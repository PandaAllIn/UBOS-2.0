import * as fs from 'fs/promises';
import * as path from 'path';

type VectorEntry = {
  id: string;
  agentId: string;
  vector: number[];
  text: string;
  metadata?: Record<string, any>;
  timestamp: number;
};

type VectorState = {
  entries: VectorEntry[];
  updatedAt: number;
};

function vectorsPath(): string {
  return path.join(process.cwd(), 'memory', 'vectors.json');
}

async function readVectors(): Promise<VectorState> {
  try {
    const buf = await fs.readFile(vectorsPath(), 'utf8');
    return JSON.parse(buf) as VectorState;
  } catch (err: any) {
    if (err.code === 'ENOENT') return { entries: [], updatedAt: Date.now() };
    throw err;
  }
}

async function writeVectors(state: VectorState) {
  await fs.mkdir(path.dirname(vectorsPath()), { recursive: true });
  state.updatedAt = Date.now();
  await fs.writeFile(vectorsPath(), JSON.stringify(state, null, 2), 'utf8');
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) || []).slice(0, 2048);
}

function hashToken(token: string, dim: number): number {
  let h = 2166136261;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h) % dim;
}

function embed(text: string, dim = 256): number[] {
  const v = new Array(dim).fill(0);
  const toks = tokenize(text);
  for (const t of toks) {
    const i = hashToken(t, dim);
    v[i] += 1;
  }
  // L2 normalize
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) dot += a[i] * b[i];
  return dot;
}

export class LocalVectorStore {
  constructor(private dim = 256) {}

  async add(agentId: string, text: string, metadata?: Record<string, any>): Promise<string> {
    const state = await readVectors();
    const id = `vec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const entry: VectorEntry = { id, agentId, vector: embed(text, this.dim), text, metadata, timestamp: Date.now() };
    state.entries.push(entry);
    await writeVectors(state);
    return id;
  }

  async search(agentId: string, query: string, k = 5): Promise<Array<{ id: string; score: number; text: string; metadata?: any }>> {
    const state = await readVectors();
    const q = embed(query, this.dim);
    const scored = state.entries
      .filter((e) => e.agentId === agentId)
      .map((e) => ({ id: e.id, score: cosine(e.vector, q), text: e.text, metadata: e.metadata }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
    return scored;
  }
}

