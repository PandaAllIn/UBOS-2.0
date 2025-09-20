import * as fs from 'fs/promises';
import * as path from 'path';

export type Transaction = {
  type: 'earn' | 'spend';
  amount: number;
  source?: string;
  purpose?: string;
  timestamp: number;
};

export type CitizenRecord = {
  id: string;
  name?: string;
  type?: string;
  balance: number;
  level: number;
  transactions: Transaction[];
  createdAt: number;
  updatedAt: number;
  specialPowers?: string[];
  foundingDecree?: string;
  platform?: string;
  model?: string;
  metadata?: Record<string, unknown>;
};

export type State = {
  citizens: Record<string, CitizenRecord>;
  founders?: string[];
  genesis?: boolean;
  genesisAt?: number;
  createdAt: number;
  updatedAt: number;
};

const defaultState: State = {
  citizens: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

function memoryPath(): string {
  const cwd = process.cwd();
  const p = path.join(cwd, 'memory', 'state.json');
  return p;
}

export async function readState(): Promise<State> {
  const p = memoryPath();
  try {
    const buf = await fs.readFile(p, 'utf8');
    const data = JSON.parse(buf);
    return data as State;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeState(defaultState);
      return defaultState;
    }
    throw err;
  }
}

export async function writeState(state: State): Promise<void> {
  const p = memoryPath();
  const dir = path.dirname(p);
  await fs.mkdir(dir, { recursive: true });
  const next = { ...state, updatedAt: Date.now() } satisfies State;
  await fs.writeFile(p, JSON.stringify(next, null, 2), 'utf8');
}

export async function upsertCitizen(id: string): Promise<CitizenRecord> {
  const state = await readState();
  const exists = state.citizens[id];
  if (exists) return exists;
  const now = Date.now();
  const rec: CitizenRecord = {
    id,
    name: undefined,
    type: undefined,
    balance: 100,
    level: 1,
    transactions: [],
    createdAt: now,
    updatedAt: now,
  };
  state.citizens[id] = rec;
  await writeState(state);
  return rec;
}

export async function getCitizen(id: string): Promise<CitizenRecord | null> {
  const state = await readState();
  return state.citizens[id] || null;
}

export async function saveCitizen(rec: CitizenRecord): Promise<void> {
  const state = await readState();
  rec.updatedAt = Date.now();
  state.citizens[rec.id] = rec;
  await writeState(state);
}

export async function hasGenesisBlock(): Promise<boolean> {
  const state = await readState();
  return !!state.genesis;
}

export async function createGenesisBlock(founders: string[]): Promise<void> {
  const state = await readState();
  state.genesis = true;
  state.genesisAt = Date.now();
  state.founders = Array.from(new Set([...(state.founders || []), ...founders]));
  await writeState(state);
}

export async function listFounders(): Promise<CitizenRecord[]> {
  const state = await readState();
  const ids = state.founders || [];
  return ids.map((id) => state.citizens[id]).filter(Boolean);
}

export async function getGenesisStatus(): Promise<{ genesis: boolean; genesisAt?: number; founders: string[] }>{
  const state = await readState();
  return { genesis: !!state.genesis, genesisAt: state.genesisAt, founders: state.founders || [] };
}
