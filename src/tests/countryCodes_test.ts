import { isValidEUCountryCode, assertEUCountryCode, EU_COUNTRY_CODES } from '../utils/countryCodes.js';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function run() {
  console.log('Running country code validation tests...');

  // Valid cases
  for (const code of EU_COUNTRY_CODES) {
    expect(isValidEUCountryCode(code), `Expected ${code} to be valid`);
    expect(isValidEUCountryCode(code.toLowerCase()), `Expected lowercase ${code} to be valid`);
    expect(isValidEUCountryCode(` ${code} `), `Expected spaced ${code} to be valid`);
    expect(assertEUCountryCode(code) === code, `assert should return ${code}`);
  }

  // Invalid cases
  const invalid = [
    'GB', // United Kingdom (not EU)
    'UK', // Not ISO 3166-1 alpha-2 official
    'EU', // European Union (not a country code member)
    'EL', // Greece domestic usage, not ISO alpha-2 here
    'A',
    'FRA',
    '1A',
    '',
    '  ',
    123 as unknown,
    null as unknown,
    undefined as unknown,
  ];

  for (const v of invalid) {
    expect(!isValidEUCountryCode(v), `Expected ${String(v)} to be invalid`);
    try {
      assertEUCountryCode(v);
      throw new Error(`assertEUCountryCode(${String(v)}) should have thrown`);
    } catch {
      // expected
    }
  }

  console.log('All country code tests passed.');
}

run().catch((err) => {
  console.error('Country code tests failed:', err?.message || err);
  process.exit(1);
});

