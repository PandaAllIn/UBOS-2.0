import { promises as fs } from 'fs';
import { constants as FsConstants } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { promisify } from 'util';

const ROOT = '/Users/panda/Desktop/EUFM';
const LOG_DIR = path.join(ROOT, 'logs', 'tri_chat');
const LOG_FILE = path.join(LOG_DIR, 'tri_chat.jsonl');
const LOCKS_DIR = path.join(LOG_DIR, 'locks');

export type Participant = 'gpt5' | 'claude' | 'human';

export interface TriMessage {
  id: string;
  timestamp: string;
  from: Participant;
  to: Participant | 'all';
  text: string;
  repliedToId?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `tri_${Date.now()}_${rand}`;
}

async function ensureLogDir(): Promise<void> {
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.mkdir(LOCKS_DIR, { recursive: true });
}

async function acquireLock(msgId: string): Promise<boolean> {
  const lockFile = path.join(LOCKS_DIR, `${msgId}.lock`);
  const ttlMs = 90_000;
  try {
    // Try to create exclusively (atomic)
    const fh = await (await import('fs/promises')).open(lockFile, FsConstants.O_CREAT | FsConstants.O_EXCL | FsConstants.O_WRONLY, 0o644);
    await fh.write(`${process.pid}:${Date.now()}`);
    await fh.close();
    return true;
  } catch (err: any) {
    if (err?.code !== 'EEXIST') {
      return false;
    }
    // Lock exists: check staleness
    try {
      const stat = await fs.stat(lockFile);
      const age = Date.now() - stat.mtime.getTime();
      if (age > ttlMs) {
        // Stale: remove and retry once
        await fs.unlink(lockFile).catch(() => {});
        try {
          const fh = await (await import('fs/promises')).open(lockFile, FsConstants.O_CREAT | FsConstants.O_EXCL | FsConstants.O_WRONLY, 0o644);
          await fh.write(`${process.pid}:${Date.now()}`);
          await fh.close();
          return true;
        } catch {
          return false;
        }
      }
    } catch {
      // Could not stat; assume locked
    }
    return false;
  }
}

async function releaseLock(msgId: string): Promise<void> {
  const lockFile = path.join(LOCKS_DIR, `${msgId}.lock`);
  try {
    await fs.unlink(lockFile);
  } catch {
    // Ignore errors releasing lock
  }
}

export async function appendMessage(msg: Omit<TriMessage, 'id' | 'timestamp'> & Partial<Pick<TriMessage, 'id' | 'timestamp'>>): Promise<TriMessage> {
  await ensureLogDir();
  const record: TriMessage = {
    id: msg.id || generateId(),
    timestamp: msg.timestamp || nowIso(),
    from: msg.from,
    to: msg.to,
    text: msg.text,
    repliedToId: msg.repliedToId,
  };
  await fs.appendFile(LOG_FILE, JSON.stringify(record) + '\n', 'utf-8');
  return record;
}

export async function readAllMessages(): Promise<TriMessage[]> {
  try {
    const raw = await fs.readFile(LOG_FILE, 'utf-8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try { return JSON.parse(line) as TriMessage; } catch { return null as any; }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function readLastMessages(limit: number = 20): Promise<TriMessage[]> {
  const all = await readAllMessages();
  return all.slice(-limit);
}

function findReply(messages: TriMessage[], sourceId: string): TriMessage | undefined {
  return messages.find(m => m.repliedToId === sourceId && m.from === 'claude');
}

function shouldRespond(msg: TriMessage): boolean {
  // Don't respond to my own messages
  if (msg.from === 'claude') return false;
  
  // Only respond to messages directed to me or everyone
  if (msg.to !== 'claude' && msg.to !== 'all') return false;
  
  return true;
}

function formatContext(messages: TriMessage[]): string {
  const lines = messages.map(m => `${m.timestamp} ${m.from}->${m.to}: ${m.text}`);
  return lines.join('\n');
}

async function callClaudeWithContext(context: TriMessage[], newMsg: TriMessage): Promise<string> {
  const header = [
    'You are Claude Code inside Cursor, participating in a tri-party chat with GPT-5 and the human.',
    'Respond concisely to the last message. Do not include code edits; reply as text.',
    'Context (most recent first):',
  ].join('\n');

  const ctx = formatContext(context);
  const prompt = `${header}\n\n${ctx}\n\nLast message to answer: ${newMsg.from}->${newMsg.to}: ${newMsg.text}`;

  return new Promise((resolve) => {
    // Write prompt to stdin to avoid argv length limits and quoting issues
    const claudeProcess = spawn('claude', ['--print', '--output-format', 'text'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    claudeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      // Safety cap to prevent runaway buffers
      if (stdout.length > 100_000) {
        stdout = stdout.slice(0, 100_000);
      }
    });

    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claudeProcess.on('close', (code) => {
      if (code === 0) {
        // Normalize whitespace to single paragraph
        const response = stdout.trim().replace(/\s+/g, ' ');
        resolve(response || 'Acknowledged.');
      } else {
        const errOut = stderr.trim();
        resolve(`Error: Claude process failed (code ${code})${errOut ? ` - ${errOut}` : ''}`);
      }
    });

    claudeProcess.on('error', (error) => {
      resolve(`Error: ${error.message}`);
    });

    // Set timeout - kill and return error instead of rejecting
    const timeout = setTimeout(() => {
      claudeProcess.kill('SIGTERM');
      resolve('Error: Response timed out after 60 seconds');
    }, 60000);

    claudeProcess.on('close', () => {
      clearTimeout(timeout);
    });

    // Feed prompt to stdin and end
    try {
      claudeProcess.stdin.write(prompt);
      claudeProcess.stdin.end();
    } catch (e: any) {
      resolve(`Error: Failed to write prompt to Claude stdin - ${e?.message || e}`);
    }
  });
}

let inProcessBridgeRunning = false; // in-process guard to prevent overlapping runs

export async function runBridgeOnce({ lookback = 20 }: { lookback?: number } = {}): Promise<{ processed: number }> {
  if (inProcessBridgeRunning) {
    return { processed: 0 };
  }
  inProcessBridgeRunning = true;
  const messages = await readAllMessages();
  const pending = messages.filter(shouldRespond);
  let processed = 0;
  
  for (const msg of pending) {
    // Check if reply already exists
    const already = findReply(messages, msg.id);
    if (already) continue;
    
    // Acquire lock for this message
    if (!(await acquireLock(msg.id))) {
      continue; // Another process is handling this message
    }
    
    try {
      const context = messages.slice(-lookback);
      const replyText = await callClaudeWithContext(context, msg);
      
      if (replyText && !replyText.startsWith('Error:')) {
        await appendMessage({ from: 'claude', to: msg.from, text: replyText, repliedToId: msg.id });
        processed++;
        
        // Add delay to prevent bursts
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      await releaseLock(msg.id);
    }
  }
  inProcessBridgeRunning = false;
  return { processed };
}

export async function sendTriMessage(from: Participant, to: Participant | 'all', text: string): Promise<TriMessage> {
  return await appendMessage({ from, to, text });
}

export async function getTriStatus(): Promise<{
  total: number;
  lastFrom?: Participant;
  lastTo?: Participant | 'all';
  lastText?: string;
}> {
  const msgs = await readAllMessages();
  const last = msgs[msgs.length - 1];
  return {
    total: msgs.length,
    lastFrom: last?.from,
    lastTo: last?.to,
    lastText: last?.text,
  };
}

export async function printTriStatus(limit: number = 10): Promise<void> {
  const msgs = await readLastMessages(limit);
  console.log(`=== Tri-Party Chat (last ${msgs.length}) ===`);
  msgs.forEach(m => {
    console.log(`${m.timestamp} [${m.id}] ${m.from}->${m.to}${m.repliedToId ? ` (reply to ${m.repliedToId})` : ''}: ${m.text}`);
  });
}

export async function runBridgeWatch(lookback: number = 20, intervalMs: number = 2500): Promise<void> {
  console.log('🔄 Starting tri-party chat watch mode...');
  console.log('Press Ctrl+C to exit\n');
  
  let isRunning = true;
  
  process.on('SIGINT', () => {
    console.log('\n👋 Exiting tri-party chat watch...');
    isRunning = false;
    process.exit(0);
  });

  while (isRunning) {
    try {
      const { processed } = await runBridgeOnce({ lookback });
      if (processed > 0) {
        console.log(`📨 Processed ${processed} message${processed === 1 ? '' : 's'}`);
        await printTriStatus(3);
        console.log(''); // blank line for readability
      }
    } catch (error: any) {
      console.error(`❌ Watch error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

// Legacy alias for backward compatibility
export async function watchTriChat(options: { lookback?: number } = {}): Promise<void> {
  return runBridgeWatch(options.lookback);
}

