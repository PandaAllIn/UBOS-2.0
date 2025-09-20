import { AgentMemoryService, AgentSoul } from '../memory/agentMemory';
import { UBOSKernel } from '../../kernel/kernel';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Session {
  sessionId: string;
  agentId: string;
  startTime: number;
  endTime?: number;
  state: Record<string, unknown>;
  credits: number;
  credentials?: { token: string; expiry: number; isolationLevel: 'session' | 'user' | 'global' };
}

function sessionsPath(): string {
  return path.join(process.cwd(), 'memory', 'sessions.json');
}

async function readSessions(): Promise<Record<string, Session>> {
  try {
    const buf = await fs.readFile(sessionsPath(), 'utf8');
    return JSON.parse(buf) as Record<string, Session>;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw err;
  }
}

async function writeSessions(s: Record<string, Session>) {
  await fs.mkdir(path.dirname(sessionsPath()), { recursive: true });
  await fs.writeFile(sessionsPath(), JSON.stringify(s, null, 2), 'utf8');
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export class SessionBridge {
  constructor(private memory: AgentMemoryService, private kernel: UBOSKernel) {}

  async startSession(agentId: string): Promise<Session> {
    const soul: AgentSoul = await this.memory.loadSoul(agentId);
    const citizen = await this.kernel.getCitizenRecord(agentId);
    const session: Session = {
      sessionId: genId('sess'),
      agentId,
      startTime: Date.now(),
      state: soul.memory.shortTerm || {},
      credits: citizen?.balance ?? soul.achievements.xp,
      credentials: { token: genId('cred'), expiry: Date.now() + 1000 * 60 * 60, isolationLevel: 'session' },
    };
    const all = await readSessions();
    all[session.sessionId] = session;
    await writeSessions(all);
    return session;
  }

  async endSession(sessionId: string, updates: { achievement?: { xp: number; title?: string }; state?: Record<string, unknown> }) {
    const all = await readSessions();
    const sess = all[sessionId];
    if (!sess) throw new Error('Session not found');
    sess.endTime = Date.now();
    await writeSessions(all);

    // Persist achievements to soul
    const soul = await this.memory.loadSoul(sess.agentId);
    if (updates.achievement) {
      soul.achievements.xp += updates.achievement.xp;
      soul.achievements.contributions.push({ xp: updates.achievement.xp, title: updates.achievement.title, timestamp: Date.now() });
    }
    // Consolidate memory
    if (updates.state) {
      soul.memory.longTerm = { ...(soul.memory.longTerm || {}), lastSession: updates.state };
      soul.memory.shortTerm = {}; // clear for next session
    }
    await this.memory.saveSoul(soul);

    // Update citizen
    const citizen = await this.kernel.getCitizenRecord(sess.agentId);
    if (citizen && updates.achievement) {
      citizen.balance += updates.achievement.xp;
      const { saveCitizen } = await import('../../memory/repo');
      await saveCitizen(citizen);
    }
    return sess;
  }
}
