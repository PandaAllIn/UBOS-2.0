import { promises as fs } from 'fs';
import path from 'path';
import { PlanId, Provider } from './subscriptionManager.js';

export type UsageMetric = 'messages' | 'requests' | 'tokens' | 'images';

export interface UsageEvent {
  id: string;
  ts: string; // ISO date
  provider: Provider;
  plan: PlanId;
  metric: UsageMetric;
  amount: number; // e.g., 1 request, 5234 tokens, etc.
  costUSD?: number; // optional per-event cost, if known
  model?: string;
  tags?: string[];
  notes?: string;
}

export interface UsageSnapshot {
  from: string; // ISO
  to: string; // ISO
  totals: Record<Provider, Partial<Record<UsageMetric, number>>>;
  costUSD: number;
  events: number;
}

export interface PricingRule {
  provider: Provider;
  model?: string; // optional model-specific pricing
  metric: UsageMetric; // typically 'tokens' or 'requests'
  unit: number; // base unit for pricing (e.g., 1000 tokens)
  priceUSD: number; // price per unit
  direction?: 'input' | 'output' | 'both';
}

export class ToolUsageTracker {
  private dbPath: string;
  constructor(baseDir = 'logs/analytics') {
    this.dbPath = path.join(baseDir, 'usage.json');
  }

  private async loadAll(): Promise<UsageEvent[]> {
    try {
      const txt = await fs.readFile(this.dbPath, 'utf8');
      const arr = JSON.parse(txt);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  private async saveAll(events: UsageEvent[]): Promise<void> {
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    await fs.writeFile(this.dbPath, JSON.stringify(events, null, 2), 'utf8');
  }

  async record(ev: Omit<UsageEvent, 'id' | 'ts'> & { ts?: string; id?: string }): Promise<UsageEvent> {
    const events = await this.loadAll();
    const full: UsageEvent = {
      id: ev.id ?? `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ts: ev.ts ?? new Date().toISOString(),
      provider: ev.provider,
      plan: ev.plan,
      metric: ev.metric,
      amount: ev.amount,
      costUSD: ev.costUSD,
      model: ev.model,
      tags: ev.tags,
      notes: ev.notes,
    };
    events.push(full);
    await this.saveAll(events);
    return full;
  }

  async list({ since, until }: { since?: string; until?: string } = {}): Promise<UsageEvent[]> {
    const events = await this.loadAll();
    return events.filter(e => (!since || e.ts >= since) && (!until || e.ts <= until));
  }

  async clear(): Promise<void> {
    await this.saveAll([]);
  }

  aggregate(events: UsageEvent[]): UsageSnapshot {
    if (events.length === 0) {
      const now = new Date().toISOString();
      return { from: now, to: now, totals: emptyTotals(), costUSD: 0, events: 0 };
    }
    const from = events[0].ts;
    const to = events[events.length - 1].ts;
    const totals: UsageSnapshot['totals'] = emptyTotals();
    let cost = 0;
    for (const e of events) {
      const bucket = totals[e.provider] as Partial<Record<UsageMetric, number>>;
      bucket[e.metric] = ((bucket[e.metric] as number | undefined) ?? 0) + e.amount;
      cost += e.costUSD ?? 0;
    }
    return { from, to, totals, costUSD: round2(cost), events: events.length };
  }

  estimateCost(events: UsageEvent[], pricing: PricingRule[]): number {
    let total = 0;
    for (const e of events) {
      // Respect explicit cost if provided
      if (typeof e.costUSD === 'number') { total += e.costUSD; continue; }
      const candidates = pricing.filter(p => p.provider === e.provider && p.metric === e.metric && (!p.model || p.model === e.model));
      if (candidates.length === 0) continue;
      const p = candidates[0];
      const units = e.amount / (p.unit || 1);
      total += units * p.priceUSD;
    }
    return round2(total);
  }
}

export function round2(n: number): number { return Math.round(n * 100) / 100; }

function emptyTotals(): Record<Provider, Partial<Record<UsageMetric, number>>> {
  return {
    chatgpt: {},
    claude: {},
    perplexity: {},
    abacus: {},
  };
}

// Indicative pricing rules (USD). Keep conservative and simple.
// These are rough and for comparison; real API billing may differ.
export const DEFAULT_PRICING: PricingRule[] = [
  // Perplexity API (Sonar Pro): assume $1 per 1M tokens (illustrative)
  { provider: 'perplexity', metric: 'tokens', unit: 1_000_000, priceUSD: 1 },
  // Anthropic Claude API: simplified sample $3 per 1M tokens
  { provider: 'claude', metric: 'tokens', unit: 1_000_000, priceUSD: 3 },
  // Abacus.ai: illustrative $2 per 1M tokens
  { provider: 'abacus', metric: 'tokens', unit: 1_000_000, priceUSD: 2 },
  // ChatGPT web is subscription; treat messages as zero marginal API cost
  { provider: 'chatgpt', metric: 'messages', unit: 1, priceUSD: 0 },
];
