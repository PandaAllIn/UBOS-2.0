import path from 'path';
import { promises as fs } from 'fs';
import { safeWriteFile, safeWriteJson, readJson, FileWriteError } from '../utils/fileWriter.js';

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  console.log('[EUFM] Running fileWriter tests...');
  const base = path.join('logs', 'test-output', 'file-writer', `${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // ensureDir behavior via nested path
  const nestedFile = path.join(base, 'deep', 'nest', 'hello.txt');
  await safeWriteFile(nestedFile, 'hello world', { encoding: 'utf-8', ensureDir: true, atomic: true });
  expect(await exists(nestedFile), 'nested write: file should exist');
  const text = await fs.readFile(nestedFile, 'utf-8');
  expect(text === 'hello world', 'nested write: content should match');

  // JSON write + read
  const jsonFile = path.join(base, 'data', 'obj.json');
  const obj = { a: 1, b: 'two', c: [3, 4, 5] };
  await safeWriteJson(jsonFile, obj, { pretty: true, ensureDir: true });
  const readBack = await readJson<typeof obj>(jsonFile);
  expect(readBack.a === 1 && readBack.b === 'two' && Array.isArray(readBack.c) && readBack.c.length === 3, 'json read: object should match structure');

  // atomic write attempts should not leave temp files in directory
  const dirEntries = await fs.readdir(path.dirname(jsonFile));
  const tmpLeak = dirEntries.some((e) => e.startsWith('.tmp-'));
  expect(!tmpLeak, 'atomic write: should not leave temporary files');

  // error path: JSON serialization failure (circular reference)
  const circ: any = { name: 'x' };
  circ.self = circ;
  let threw = false;
  try {
    await safeWriteJson(path.join(base, 'bad', 'circ.json'), circ, { ensureDir: true });
  } catch (err) {
    threw = true;
    expect(err instanceof FileWriteError, 'circular: should throw FileWriteError');
    expect((err as FileWriteError).code === 'JSON_STRINGIFY_FAILED', 'circular: error code should be JSON_STRINGIFY_FAILED');
  }
  expect(threw, 'circular: expected to throw');

  // error path: invalid data type for safeWriteFile
  let threw2 = false;
  try {
    // @ts-expect-error testing runtime guard
    await safeWriteFile(path.join(base, 'bad', 'invalid.txt'), { not: 'string or buffer' }, { ensureDir: true });
  } catch (err) {
    threw2 = true;
    expect(err instanceof FileWriteError, 'invalid data: should throw FileWriteError');
    expect((err as FileWriteError).code === 'INVALID_DATA', 'invalid data: error code should be INVALID_DATA');
  }
  expect(threw2, 'invalid data: expected to throw');

  console.log('[EUFM] fileWriter tests passed.');
}

run().catch((err) => {
  console.error('[EUFM] fileWriter tests failed:', err?.message || err);
  process.exit(1);
});

