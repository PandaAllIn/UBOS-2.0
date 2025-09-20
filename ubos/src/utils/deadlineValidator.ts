/**
 * EU Funding deadline validation utilities.
 *
 * Provides strict, dependency-free validation for ISO-like date strings
 * and normalized results useful for scheduling and dashboards.
 */

export interface DeadlineValidationOptions {
  /**
   * An override for the current time to make evaluation deterministic in tests.
   * Accepts a Date instance or an ISO-8601 string. Defaults to `new Date()`.
   */
  now?: Date | string;
  /**
   * If true, a deadline on the same calendar day as `now` is considered upcoming (not past).
   * Defaults to true (inclusive end-of-day deadline behavior).
   */
  inclusive?: boolean;
}

export interface DeadlineValidationResult {
  valid: boolean;
  /** ISO date-only (YYYY-MM-DD) when valid, otherwise undefined */
  date?: string;
  /** True when deadline end-of-day is in the past relative to `now` */
  isPast: boolean;
  /** True when deadline is the same calendar day as `now` */
  isToday: boolean;
  /** Whole days remaining until deadline end-of-day; 0 if today; negative when in past */
  daysRemaining: number;
  /** Human-readable reason for invalid input, when applicable */
  reason?: string;
}

/** Milliseconds in a day */
const DAY_MS = 24 * 60 * 60 * 1000;

function toDateSafe(input: Date | string | undefined): Date | null {
  if (!input) return null;
  try {
    if (input instanceof Date) return new Date(input.getTime());
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function normalizeDateOnly(dateStr: string): string | null {
  // Accept common formats; prefer YYYY-MM-DD. Strip time if present.
  // Using regex to extract YYYY-MM-DD at the start of the string.
  const m = /^\s*(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return null;
  const [y, mo, d] = m;
  // Basic range checks to avoid Date auto-rollover surprises
  const year = Number(y), month = Number(mo), day = Number(d);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  // Construct date in UTC to avoid TZ surprises and then reformat
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(dt.getTime())) return null;
  // Ensure the components round-trip (no rollover)
  const ok = dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
  if (!ok) return null;
  return `${y}-${mo}-${d}`;
}

/** Returns a Date at the end of the given date's day in UTC (23:59:59.999 UTC). */
function endOfDayUTC(dateOnlyISO: string): Date {
  const [y, m, d] = dateOnlyISO.split('-').map(Number);
  // Next day 00:00:00.000 UTC minus 1 ms
  const nextDay = new Date(Date.UTC(y, m, d));
  return new Date(nextDay.getTime() - 1);
}

/** Returns whether two dates are on the same calendar day in UTC. */
function isSameUTCDate(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
}

/**
 * Validate and evaluate a funding deadline.
 *
 * - Accepts ISO-like inputs such as `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm`.
 * - Normalizes to date-only in UTC and evaluates using end-of-day semantics.
 */
export function validateDeadline(input: unknown, opts: DeadlineValidationOptions = {}): DeadlineValidationResult {
  const inclusive = opts.inclusive ?? true;
  const now = toDateSafe(opts.now) ?? new Date();

  if (typeof input !== 'string') {
    console.error('[deadlineValidator] Invalid input type. Expected string.');
    return { valid: false, isPast: false, isToday: false, daysRemaining: 0, reason: 'Expected a date string' };
  }

  const dateOnly = normalizeDateOnly(input);
  if (!dateOnly) {
    console.error('[deadlineValidator] Invalid date format. Expected YYYY-MM-DD. Got:', input);
    return { valid: false, isPast: false, isToday: false, daysRemaining: 0, reason: 'Invalid or unsupported date format' };
  }

  const deadlineEOD = endOfDayUTC(dateOnly);
  const isToday = isSameUTCDate(deadlineEOD, now);
  const diffMs = deadlineEOD.getTime() - now.getTime();
  const daysRemaining = isToday
    ? 0
    : (diffMs >= 0 ? Math.ceil(diffMs / DAY_MS) : Math.floor(diffMs / DAY_MS));

  // Determine past status with inclusive behavior (today counts as not past when inclusive)
  const isPast = inclusive ? diffMs < 0 && !isToday : diffMs < 0 || isToday;

  return {
    valid: true,
    date: dateOnly,
    isPast,
    isToday,
    daysRemaining,
  };
}

/** Convenience predicate: returns true when the deadline is valid and not past. */
export function isDeadlineUpcoming(input: unknown, opts?: DeadlineValidationOptions): boolean {
  const res = validateDeadline(input, opts);
  return res.valid && !res.isPast;
}
