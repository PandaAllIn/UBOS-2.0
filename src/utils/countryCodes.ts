// EU country code utilities (ISO 3166-1 alpha-2)
// Project: EUFM (European Union Funds Manager)

export const EU_COUNTRY_CODES = [
  'AT', // Austria
  'BE', // Belgium
  'BG', // Bulgaria
  'HR', // Croatia
  'CY', // Cyprus
  'CZ', // Czechia
  'DK', // Denmark
  'EE', // Estonia
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'GR', // Greece
  'HU', // Hungary
  'IE', // Ireland
  'IT', // Italy
  'LV', // Latvia
  'LT', // Lithuania
  'LU', // Luxembourg
  'MT', // Malta
  'NL', // Netherlands
  'PL', // Poland
  'PT', // Portugal
  'RO', // Romania
  'SK', // Slovakia
  'SI', // Slovenia
  'ES', // Spain
  'SE', // Sweden
] as const;

export type EUCountryCode = typeof EU_COUNTRY_CODES[number];

/**
 * Normalize input to uppercase 2-letter code (A-Z). Returns null if not possible.
 */
export function normalizeCountryCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (trimmed.length !== 2) return null;
  const upper = trimmed.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return upper;
}

/**
 * Check if a value is a valid EU member state code (ISO 3166-1 alpha-2).
 * - Case-insensitive
 * - Ignores leading/trailing whitespace
 * - Returns false for non-strings or malformed inputs
 */
export function isValidEUCountryCode(value: unknown): value is EUCountryCode {
  const code = normalizeCountryCode(value);
  if (!code) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[EUFM] Invalid country code format:', value);
    }
    return false;
  }
  return (EU_COUNTRY_CODES as readonly string[]).includes(code);
}

/**
 * Asserts that the provided value is a valid EU country code and returns the normalized code.
 * Throws an Error if invalid. Logs the reason before throwing.
 */
export function assertEUCountryCode(value: unknown): EUCountryCode {
  const code = normalizeCountryCode(value);
  if (!code) {
    console.error('[EUFM] Country code must be a 2-letter ISO 3166-1 alpha-2 string:', value);
    throw new Error('Country code must be a 2-letter ISO alpha-2 string');
  }
  if (!(EU_COUNTRY_CODES as readonly string[]).includes(code)) {
    console.error('[EUFM] Country is not an EU member (ISO alpha-2):', code);
    throw new Error('Country is not an EU member (ISO alpha-2)');
  }
  return code as EUCountryCode;
}

