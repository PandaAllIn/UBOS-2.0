import * as fs from 'fs/promises';
import * as path from 'path';

export type Fact = {
  id: string;
  agentId: string;
  subject: string;
  predicate: string;
  object: string;
  timestamp: number;
  ttlMs?: number;
};

type FactState = {
  facts: Fact[];
  updatedAt: number;
};

function factsPath(): string {
  return path.join(process.cwd(), 'memory', 'facts.json');
}

async function readFacts(): Promise<FactState> {
  try {
    const buf = await fs.readFile(factsPath(), 'utf8');
    return JSON.parse(buf) as FactState;
  } catch (err: any) {
    if (err.code === 'ENOENT') return { facts: [], updatedAt: Date.now() };
    throw err;
  }
}

async function writeFacts(state: FactState) {
  await fs.mkdir(path.dirname(factsPath()), { recursive: true });
  state.updatedAt = Date.now();
  await fs.writeFile(factsPath(), JSON.stringify(state, null, 2), 'utf8');
}

export class LocalFactStore {
  async addFact(f: Omit<Fact, 'id' | 'timestamp'> & { timestamp?: number }): Promise<string> {
    const state = await readFacts();
    const id = `fact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const rec: Fact = { id, timestamp: Date.now(), ...f } as Fact;
    state.facts.push(rec);
    await writeFacts(state);
    return id;
  }

  async listFacts(agentId: string): Promise<Fact[]> {
    const state = await readFacts();
    return state.facts.filter((f) => f.agentId === agentId);
  }

  async pruneExpired(ttlMs: number): Promise<number> {
    const state = await readFacts();
    const now = Date.now();
    const before = state.facts.length;
    state.facts = state.facts.filter((f) => (f.ttlMs ? f.timestamp + f.ttlMs > now : f.timestamp + ttlMs > now));
    await writeFacts(state);
    return before - state.facts.length;
  }

  async search(agentId: string, keyword: string): Promise<Fact[]> {
    const state = await readFacts();
    const k = keyword.toLowerCase();
    return state.facts.filter((f) => f.agentId === agentId && `${f.subject} ${f.predicate} ${f.object}`.toLowerCase().includes(k));
  }
}

export function extractFactsFromSession(agentId: string, sessionData: Record<string, any>): Array<Omit<Fact, 'id' | 'timestamp'>> {
  const facts: Array<Omit<Fact, 'id' | 'timestamp'>> = [];
  for (const [key, val] of Object.entries(sessionData || {})) {
    if (val == null) continue;
    const subject = agentId;
    const predicate = key;
    const object = typeof val === 'object' ? JSON.stringify(val) : String(val);
    facts.push({ agentId, subject, predicate, object });
  }
  return facts;
}

