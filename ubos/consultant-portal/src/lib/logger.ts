export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel: LogLevel = (((import.meta as { env: Record<string, string> }).env?.MODE) === 'development' ? 'debug' : 'info');

export function log(level: LogLevel, message: string, meta?: unknown) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;
  const payload = meta !== undefined ? { message, meta } : { message };
  // eslint-disable-next-line no-console
  console[level](`[${level.toUpperCase()}]`, payload);
}

