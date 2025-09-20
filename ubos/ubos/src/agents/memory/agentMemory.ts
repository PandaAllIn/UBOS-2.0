import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { LocalVectorStore } from './vector';
import { LocalFactStore, extractFactsFromSession } from './facts';

export interface Achievement {
  id?: string;
  title?: string;
  xp: number;
  timestamp?: number;
  details?: unknown;
}

export interface AgentSoul {
  agentId: string;
  type: string;
  created: string;
  achievements: {
    titles: string[];
    xp: number;
    level: number;
    contributions: Achievement[];
  };
  memory: {
    shortTerm: Record<string, unknown>;
    longTerm: Record<string, unknown>;
  };
  credentials: {
    publicKey?: string | null;
    registrationTx?: string | null;
    foundingDecree?: string | null;
  };
}

async function pickExisting(paths: string[]): Promise<string> {
  for (const p of paths) {
    try {
      await fs.stat(p);
      return p;
    } catch {
      // continue
    }
  }
  return paths[0];
}

async function soulsDir(): Promise<string> {
  // Try src path first (ts-node), then dist, then fallback to project souls
  const candidates = [
    path.join(process.cwd(), 'src', 'agents', 'souls'),
    path.join(process.cwd(), 'dist', 'src', 'agents', 'souls'),
    path.join(process.cwd(), 'agents', 'souls'),
  ];
  return pickExisting(candidates);
}

export class AgentMemoryService {
  private baseDirPromise: Promise<string>;
  private vectors = new LocalVectorStore();
  private facts = new LocalFactStore();

  constructor(baseDir?: string) {
    this.baseDirPromise = baseDir ? Promise.resolve(baseDir) : soulsDir();
  }

  private async soulPathCandidates(agentId: string): Promise<string[]> {
    const baseDir = await this.baseDirPromise;
    const segments = agentId.split(':');
    const fileSafe = agentId.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const names = [
      `${fileSafe}.soul.json`,
      ...(segments.map((s) => `${s}.soul.json`)),
    ];
    return names.map((n) => path.join(baseDir, n));
  }

  async loadSoul(agentId: string): Promise<AgentSoul> {
    const candidates = await this.soulPathCandidates(agentId);
    let lastErr: unknown;
    for (const p of candidates) {
      try {
        const buf = await fs.readFile(p, 'utf8');
        return JSON.parse(buf) as AgentSoul;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Soul not found');
  }

  async saveSoul(soul: AgentSoul): Promise<void> {
    const baseDir = await this.baseDirPromise;
    // Persist using normalized id filename
    const fileSafe = soul.agentId.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const p = path.join(baseDir, `${fileSafe}.soul.json`);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(soul, null, 2), 'utf8');
  }

  async persistAchievement(agentId: string, achievement: Achievement): Promise<AgentSoul> {
    const soul = await this.loadSoul(agentId);
    const entry: Achievement = {
      id: achievement.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: achievement.title,
      xp: achievement.xp,
      timestamp: achievement.timestamp || Date.now(),
      details: achievement.details,
    };
    soul.achievements.xp += entry.xp;
    soul.achievements.contributions.push(entry);
    await this.saveSoul(soul);
    return soul;
  }

  async consolidateMemory(agentId: string, sessionData: Record<string, unknown>): Promise<AgentSoul> {
    const soul = await this.loadSoul(agentId);
    // A minimal consolidation: merge keys under longTerm.insights
    soul.memory.longTerm = {
      ...soul.memory.longTerm,
      insights: {
        ...(soul.memory.longTerm?.insights as Record<string, unknown> || {}),
        lastSession: sessionData,
      },
    };
    await this.saveSoul(soul);
    // Extract facts
    const facts = extractFactsFromSession(agentId, sessionData);
    for (const f of facts) {
      await this.facts.addFact({ ...f, ttlMs: 1000 * 60 * 60 * 24 * 30 }); // default 30d TTL
    }
    // Add semantic memory (simple summary)
    await this.vectors.add(agentId, JSON.stringify(sessionData).slice(0, 2000), { kind: 'session' });
    return soul;
  }

  async addSemanticMemory(agentId: string, text: string, metadata?: Record<string, unknown>) {
    return this.vectors.add(agentId, text, metadata);
  }

  async searchSemanticMemory(agentId: string, query: string, k = 5) {
    return this.vectors.search(agentId, query, k);
  }

  async addFacts(agentId: string, facts: Array<{ subject: string; predicate: string; object: string; ttlMs?: number }>) {
    for (const f of facts) {
      await this.facts.addFact({ agentId, ...f });
    }
  }

  async pruneFacts(ttlMs: number) {
    return this.facts.pruneExpired(ttlMs);
  }

  async attestIdentity(agentId: string): Promise<{ platform: string; signature: string; timestamp: number; expiry: number; codeIntegrity: string }>{
    // Software-based attestation: hash a subset of files
    const filesToHash = [
      path.join(process.cwd(), 'src', 'kernel', 'kernel.ts'),
      path.join(process.cwd(), 'src', 'agents', 'memory', 'agentMemory.ts'),
    ];
    const hash = crypto.createHash('sha256');
    for (const f of filesToHash) {
      try {
        const buf = await fs.readFile(f);
        hash.update(buf);
      } catch {}
    }
    const codeIntegrity = hash.digest('hex');
    const timestamp = Date.now();
    const expiry = timestamp + 1000 * 60 * 60; // 1h
    const platform = process.env.UBOS_PLATFORM || 'local';
    const keyPath = path.join(process.cwd(), 'memory', 'attestation.key');
    let key: Buffer;
    try {
      key = await fs.readFile(keyPath);
    } catch {
      key = crypto.randomBytes(32);
      await fs.mkdir(path.dirname(keyPath), { recursive: true });
      await fs.writeFile(keyPath, key);
    }
    const signature = crypto.createHmac('sha256', key).update(`${agentId}|${codeIntegrity}|${timestamp}`).digest('hex');
    return { platform, signature, timestamp, expiry, codeIntegrity };
  }
}