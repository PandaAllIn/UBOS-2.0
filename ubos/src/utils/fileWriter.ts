import { promises as fs } from 'fs';
import path from 'path';

export class FileWriteError extends Error {
  code: string;
  cause?: unknown;
  constructor(message: string, code = 'FILE_WRITE_ERROR', cause?: unknown) {
    super(message);
    this.name = 'FileWriteError';
    this.code = code;
    this.cause = cause;
  }
}

export interface WriteOptions {
  encoding?: BufferEncoding;
  mode?: number;
  signal?: AbortSignal;
  atomic?: boolean;
  ensureDir?: boolean;
}

function isStringOrBuffer(v: unknown): v is string | Uint8Array {
  return typeof v === 'string' || v instanceof Uint8Array;
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    console.error('[EUFM] Failed to ensure directory exists:', dirPath, err);
    throw new FileWriteError(`Failed to ensure directory: ${dirPath}`, 'ENSURE_DIR_FAILED', err);
  }
}

function tmpName(targetPath: string): string {
  const base = `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return path.join(path.dirname(targetPath), base);
}

export async function safeWriteFile(
  filePath: string,
  data: string | Uint8Array,
  options: WriteOptions = {}
): Promise<void> {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    console.error('[EUFM] Invalid file path provided to safeWriteFile:', filePath);
    throw new FileWriteError('Invalid file path', 'INVALID_PATH');
  }
  if (!isStringOrBuffer(data)) {
    console.error('[EUFM] Invalid data type provided to safeWriteFile. Expected string or Uint8Array');
    throw new FileWriteError('Invalid data type', 'INVALID_DATA');
  }

  const { encoding, mode, signal, atomic = true, ensureDir: mkDir = true } = options;

  const dir = path.dirname(filePath);
  if (mkDir) {
    await ensureDir(dir);
  }

  const writeOpts: { encoding?: BufferEncoding, mode?: number, signal?: AbortSignal } = {};
  if (encoding && typeof data === 'string') writeOpts.encoding = encoding;
  if (mode) writeOpts.mode = mode;
  if (signal) writeOpts.signal = signal;

  try {
    if (atomic) {
      const tmp = tmpName(filePath);
      await fs.writeFile(tmp, data, writeOpts);
      await fs.rename(tmp, filePath);
    } else {
      await fs.writeFile(filePath, data, writeOpts);
    }
    console.log(`📄 [EUFM] Wrote file: ${filePath}`);
  } catch (err) {
    console.error(`[EUFM] Failed to write file: ${filePath}`, err);
    throw new FileWriteError(`Failed to write file: ${filePath}`, 'WRITE_FAILED', err);
  }
}

export interface JsonWriteOptions extends WriteOptions {
  pretty?: number | boolean;
}

export async function safeWriteJson(
  filePath: string,
  value: unknown,
  options: JsonWriteOptions = {}
): Promise<void> {
  let json: string;
  try {
    const spaces = options.pretty === true ? 2 : typeof options.pretty === 'number' ? options.pretty : 0;
    json = JSON.stringify(value, null, spaces);
  } catch (err) {
    console.error('[EUFM] JSON serialization failed in safeWriteJson for', filePath, err);
    throw new FileWriteError('JSON serialization failed', 'JSON_STRINGIFY_FAILED', err);
  }
  await safeWriteFile(filePath, json + (options.encoding === 'utf-8' || options.encoding === undefined ? '' : ''), options);
}

export async function readJson<T = unknown>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error('[EUFM] Failed to read or parse JSON:', filePath, err);
    throw new FileWriteError(`Failed to read or parse JSON: ${filePath}`, 'READ_JSON_FAILED', err);
  }
}