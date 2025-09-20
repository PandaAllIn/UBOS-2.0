import { promises as fs } from 'fs';
import path from 'path';
import { OrchestrationResult } from '../orchestrator/types.js';

export interface LearnedPattern {
  id: string;
  description: string;
  signals: string[];
  effectiveness: number; // 0..1
  lastUpdated: string;
}

export class PatternLearner {
  constructor(private baseDir = 'logs/orchestrator') {}

  private patternsPath() { return path.join(this.baseDir, 'patterns.json'); }

  private async load(): Promise<LearnedPattern[]> {
    try {
      const txt = await fs.readFile(this.patternsPath(), 'utf8');
      const arr = JSON.parse(txt);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  private async save(all: LearnedPattern[]) {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(this.patternsPath(), JSON.stringify(all, null, 2), 'utf8');
  }

  async updateFromRun(run: OrchestrationResult): Promise<void> {
    const all = await this.load();
    // Very simple heuristic: reward agent combos that succeeded, penalize those that failed
    const groups: Record<string, { success: number; total: number; signals: Set<string> }> = {};
    for (const r of run.results) {
      const key = `${r.requirementId}`;
      if (!groups[key]) groups[key] = { success: 0, total: 0, signals: new Set() };
      groups[key].total += 1;
      if (r.success) groups[key].success += 1;
      // derive signals from content
      const content = `${r.output} ${r.error ?? ''}`.toLowerCase();
      if (/test|unit|spec/.test(content)) groups[key].signals.add('tests-helped');
      if (/timeout|rate limit|quota/.test(content)) groups[key].signals.add('needs-retry-with-backoff');
      if (/browser|navigate/.test(content)) groups[key].signals.add('browser-automation-applicable');
    }
    const now = new Date().toISOString();
    for (const [key, g] of Object.entries(groups)) {
      const eff = g.total ? g.success / g.total : 0;
      const existing = all.find((p) => p.id === key);
      if (existing) {
        existing.effectiveness = Math.round((existing.effectiveness * 0.7 + eff * 0.3) * 100) / 100;
        existing.signals = Array.from(new Set([...existing.signals, ...Array.from(g.signals)]));
        existing.lastUpdated = now;
      } else {
        all.push({ id: key, description: `Patterns for ${key}`, signals: Array.from(g.signals), effectiveness: eff, lastUpdated: now });
      }
    }
    await this.save(all);
  }

  async list(): Promise<LearnedPattern[]> { return this.load(); }
}

