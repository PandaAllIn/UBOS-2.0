import { validateDeadline, isDeadlineUpcoming } from '../utils/deadlineValidator.js';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function run() {
  console.log('[EUFM] Running deadline validator tests...');

  const NOW = '2025-09-08T10:00:00Z';

  // Future date
  const future = validateDeadline('2025-09-10', { now: NOW });
  expect(future.valid, 'future: should be valid');
  expect(!future.isPast, 'future: should not be past');
  expect(!future.isToday, 'future: should not be today');
  expect(future.daysRemaining === 3, `future: expected daysRemaining 3, got ${future.daysRemaining}`);

  // Today (inclusive default)
  const today = validateDeadline('2025-09-08', { now: NOW });
  expect(today.valid, 'today: should be valid');
  expect(today.isToday, 'today: isToday should be true');
  expect(!today.isPast, 'today: not past when inclusive');
  expect(today.daysRemaining === 0, `today: expected daysRemaining 0, got ${today.daysRemaining}`);

  // Past
  const past = validateDeadline('2025-09-05', { now: NOW });
  expect(past.valid, 'past: should be valid');
  expect(past.isPast, 'past: should be past');
  expect(past.daysRemaining <= -1, `past: expected negative daysRemaining, got ${past.daysRemaining}`);
  expect(past.daysRemaining === -3, `past: expected -3, got ${past.daysRemaining}`);

  // Invalid format
  const bad1 = validateDeadline('08/09/2025', { now: NOW });
  expect(!bad1.valid, 'invalid: slash format should be invalid');
  const bad2 = validateDeadline('2025-13-01', { now: NOW });
  expect(!bad2.valid, 'invalid: month 13 should be invalid');
  const bad3 = validateDeadline(123 as unknown, { now: NOW });
  expect(!bad3.valid, 'invalid: non-string should be invalid');

  // Convenience predicate
  expect(isDeadlineUpcoming('2025-09-10', { now: NOW }), 'upcoming: future should be upcoming');
  expect(isDeadlineUpcoming('2025-09-08', { now: NOW }), 'upcoming: today inclusive should be upcoming');
  expect(!isDeadlineUpcoming('2025-09-05', { now: NOW }), 'upcoming: past should not be upcoming');

  // Non-inclusive behavior
  const todayNonInclusive = validateDeadline('2025-09-08', { now: NOW, inclusive: false });
  expect(todayNonInclusive.isPast, 'non-inclusive: today counts as past');
  expect(!isDeadlineUpcoming('2025-09-08', { now: NOW, inclusive: false }), 'non-inclusive: today not upcoming');

  console.log('[EUFM] Deadline validator tests passed.');
}

run().catch((err) => {
  console.error('[EUFM] Deadline validator tests failed:', err?.message || err);
  process.exit(1);
});

