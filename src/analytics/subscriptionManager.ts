import fetch from 'node-fetch';

export type Provider = 'chatgpt' | 'claude' | 'perplexity' | 'abacus';

export type PlanId =
  | 'chatgpt_free'
  | 'chatgpt_plus'
  | 'claude_free'
  | 'claude_pro'
  | 'perplexity_free'
  | 'perplexity_pro'
  | 'abacus_free'
  | 'abacus_pro'
  | 'abacus_enterprise';

export interface PlanFeature {
  name: string;
  description?: string;
}

export interface UsageLimit {
  metric: 'messages' | 'requests' | 'tokens' | 'images' | 'concurrent' | 'custom';
  period: 'minute' | 'hour' | 'day' | 'month';
  limit: number | null; // null = unknown; Infinity allowed for effectively unlimited
  notes?: string;
}

export interface PlanDefinition {
  id: PlanId;
  provider: Provider;
  name: string;
  pricePerMonthUSD: number; // 0 for free
  features: PlanFeature[];
  limits: UsageLimit[];
}

export interface UserSubscriptions {
  // one selected plan per provider
  chatgpt: PlanId;
  claude: PlanId;
  perplexity: PlanId;
  abacus: PlanId;
}

export interface LimitsFetchResult {
  provider: Provider;
  plan: PlanId;
  fetchedAt: string;
  source: 'static-default' | 'web' | 'api' | 'user';
  limits: UsageLimit[];
  rawSourceUrl?: string;
}

// Static catalog with conservative defaults. Values are indicative and may change.
// We attempt web/API refresh where possible at runtime.
export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  chatgpt_free: {
    id: 'chatgpt_free', provider: 'chatgpt', name: 'ChatGPT Free', pricePerMonthUSD: 0,
    features: [
      { name: 'GPT-4o-mini', description: 'Access subject to capacity' },
    ],
    limits: [
      { metric: 'messages', period: 'day', limit: 30, notes: 'Varies; capacity-based' },
    ]
  },
  chatgpt_plus: {
    id: 'chatgpt_plus', provider: 'chatgpt', name: 'ChatGPT Plus', pricePerMonthUSD: 20,
    features: [
      { name: 'Priority access' },
      { name: 'Advanced models', description: 'GPT-4o, o-mini' },
      { name: 'Vision/Browse/Upload', description: 'Feature availability varies' },
    ],
    limits: [
      { metric: 'messages', period: 'day', limit: 80, notes: 'Approx; dynamic rate limits' },
    ]
  },
  claude_free: {
    id: 'claude_free', provider: 'claude', name: 'Claude Free', pricePerMonthUSD: 0,
    features: [ { name: 'Claude 3.x access', description: 'As available' } ],
    limits: [ { metric: 'messages', period: 'day', limit: 25, notes: 'Subject to change' } ]
  },
  claude_pro: {
    id: 'claude_pro', provider: 'claude', name: 'Claude Pro', pricePerMonthUSD: 20,
    features: [ { name: 'Priority', description: 'Higher rate limits' } ],
    limits: [ { metric: 'messages', period: 'day', limit: 100, notes: 'Approx; dynamic' } ]
  },
  perplexity_free: {
    id: 'perplexity_free', provider: 'perplexity', name: 'Perplexity Free', pricePerMonthUSD: 0,
    features: [ { name: 'Sonar small' } ],
    limits: [ { metric: 'requests', period: 'day', limit: 50, notes: 'Estimate' } ]
  },
  perplexity_pro: {
    id: 'perplexity_pro', provider: 'perplexity', name: 'Perplexity Pro', pricePerMonthUSD: 20,
    features: [ { name: 'Sonar Pro' }, { name: 'Higher caps' } ],
    limits: [ { metric: 'requests', period: 'day', limit: 300, notes: 'Estimate' } ]
  },
  abacus_free: {
    id: 'abacus_free', provider: 'abacus', name: 'Abacus.ai Free', pricePerMonthUSD: 0,
    features: [ { name: 'Trial features' } ],
    limits: [ { metric: 'tokens', period: 'month', limit: 2_000_000, notes: 'Promotional / trial credits' } ]
  },
  abacus_pro: {
    id: 'abacus_pro', provider: 'abacus', name: 'Abacus.ai Pro', pricePerMonthUSD: 30,
    features: [ { name: 'Developer tier' } ],
    limits: [ { metric: 'tokens', period: 'month', limit: 10_000_000, notes: 'Subject to pricing plan' } ]
  },
  abacus_enterprise: {
    id: 'abacus_enterprise', provider: 'abacus', name: 'Abacus.ai Enterprise', pricePerMonthUSD: 0,
    features: [ { name: 'Custom contract' } ],
    limits: [ { metric: 'custom', period: 'month', limit: null, notes: 'Per SOW' } ]
  },
};

export const DEFAULT_SUBSCRIPTIONS: UserSubscriptions = {
  chatgpt: 'chatgpt_plus',
  claude: 'claude_pro',
  perplexity: 'perplexity_pro',
  abacus: 'abacus_pro',
};

export interface SubscriptionStore {
  load(): Promise<UserSubscriptions | null>;
  save(subs: UserSubscriptions): Promise<void>;
}

export class FileSubscriptionStore implements SubscriptionStore {
  constructor(private path: string) {}
  async load(): Promise<UserSubscriptions | null> {
    try {
      const { readFile } = await import('fs/promises');
      const txt = await readFile(this.path, 'utf8');
      return JSON.parse(txt);
    } catch (e) {
      return null;
    }
  }
  async save(subs: UserSubscriptions): Promise<void> {
    const { mkdir, writeFile } = await import('fs/promises');
    const dir = this.path.split('/').slice(0, -1).join('/');
    await mkdir(dir, { recursive: true });
    await writeFile(this.path, JSON.stringify(subs, null, 2), 'utf8');
  }
}

export class SubscriptionManager {
  constructor(private store: SubscriptionStore) {}

  async getSubscriptions(): Promise<UserSubscriptions> {
    return (await this.store.load()) ?? DEFAULT_SUBSCRIPTIONS;
  }

  async setSubscriptions(subs: UserSubscriptions): Promise<void> {
    await this.store.save(subs);
  }

  getPlan(planId: PlanId): PlanDefinition {
    const p = PLAN_CATALOG[planId];
    if (!p) throw new Error(`Unknown plan: ${planId}`);
    return p;
  }

  // Best-effort: fetch updated high-level limits pages. If fetch fails, return catalog limits.
  async fetchLatestLimits(planId: PlanId): Promise<LimitsFetchResult> {
    const base = this.getPlan(planId);
    const fetchedAt = new Date().toISOString();

    const sources: Partial<Record<Provider, string>> = {
      chatgpt: 'https://help.openai.com/en/articles/8554405-chatgpt-plus-faq',
      claude: 'https://support.anthropic.com/en/collections/5019952-claude-pro',
      perplexity: 'https://www.perplexity.ai/pricing',
      abacus: 'https://abacus.ai/pricing',
    };

    const url = sources[base.provider];
    if (!url) {
      return { provider: base.provider, plan: planId, fetchedAt, source: 'static-default', limits: base.limits };
    }
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // We do not attempt deep parsing; we only record that web was reachable and keep static limits.
      return {
        provider: base.provider,
        plan: planId,
        fetchedAt,
        source: 'web',
        limits: base.limits,
        rawSourceUrl: url,
      };
    } catch {
      return { provider: base.provider, plan: planId, fetchedAt, source: 'static-default', limits: base.limits, rawSourceUrl: url };
    }
  }
}

