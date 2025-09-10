import path from 'path';

// Resolve repository root regardless of dist/src execution location
export function repoRoot(): string {
  // dist/<...> => repo root two levels up; src/<...> via tsx => process.cwd()
  try {
    const here = __dirname;
    // If running from dist, __dirname ends with /dist/...; go up two levels
    if (here.includes(`${path.sep}dist${path.sep}`)) {
      return path.resolve(here, '..', '..');
    }
  } catch (_) {
    // ignore and fallback
  }
  return process.cwd();
}

export function repoPath(...segments: string[]): string {
  return path.resolve(repoRoot(), ...segments);
}

