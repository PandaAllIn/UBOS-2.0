import { createHash } from 'crypto';

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function extractApiKeyPrefix(apiKey: string): string {
  // Convention: prefix is first 8 chars; adjust if using structured keys
  return apiKey.slice(0, 8);
}


