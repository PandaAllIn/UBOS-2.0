**File Writer Utility**
- Location: `src/utils/fileWriter.ts`

Provides safe, atomic file and JSON writing with directory creation, typed errors, and concise logging consistent with EUFM patterns.

API
- `safeWriteFile(filePath, data, options)`
  - Writes `string` or `Uint8Array` to disk.
  - Options:
    - `atomic` (default: true): write to temp file and rename for atomicity.
    - `ensureDir` (default: true): create parent directories recursively.
    - `encoding`, `mode`, `signal`: forwarded to `fs.writeFile`.
- `safeWriteJson(filePath, value, options)`
  - Serializes JSON with optional `pretty` spacing (true = 2 spaces) and writes via `safeWriteFile`.
- `readJson(filePath)`
  - Reads and parses JSON with error context.
- `FileWriteError`
  - Custom error with `code`:
    - `INVALID_PATH`, `INVALID_DATA`, `ENSURE_DIR_FAILED`, `WRITE_FAILED`, `JSON_STRINGIFY_FAILED`, `READ_JSON_FAILED`.

Usage
- Write text safely:
  - `await safeWriteFile('logs/output/report.txt', 'hello', { encoding: 'utf-8' });`
- Write JSON (pretty):
  - `await safeWriteJson('logs/output/data.json', { ok: true }, { pretty: true });`
- Read JSON:
  - `const data = await readJson('logs/output/data.json');`

Error Handling
- Throws `FileWriteError` with a specific `code` and logs a clear `[EUFM]`-prefixed message.
- Catch and branch on `code` for programmatic recovery.

Testing
- Run: `tsx src/tests/fileWriter_test.ts`
- Tests cover directory creation, atomic writes (no temp leaks), JSON round-trip, and error cases.

