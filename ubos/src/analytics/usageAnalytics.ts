import readline from 'readline';
import { FileSubscriptionStore, LimitsFetchResult, PlanDefinition, PLAN_CATALOG, PlanId, Provider, SubscriptionManager, UserSubscriptions } from './subscriptionManager.js';
import { ToolUsageTracker, UsageEvent } from './toolUsageTracker.js';
import { OptimizationEngine } from './optimizationEngine.js';

function rlQuestion(rl: readline.Interface, q: string): Promise<string> {
  return new Promise((resolve) => rl.question(q, resolve));
}

export class UsageAnalyticsAgent {
  subs: SubscriptionManager;
  tracker: ToolUsageTracker;
  engine: OptimizationEngine;

  constructor(private baseDir = 'logs/analytics') {
    this.subs = new SubscriptionManager(new FileSubscriptionStore(`${baseDir}/subscriptions.json`));
    this.tracker = new ToolUsageTracker(baseDir);
    this.engine = new OptimizationEngine(this.subs, this.tracker);
  }

  async interactiveSetup(): Promise<UserSubscriptions> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const current = await this.subs.getSubscriptions();

    const choose = async (provider: Provider, options: PlanId[]) => {
      const display = options.map((id, i) => `${i + 1}) ${PLAN_CATALOG[id].name} ($${PLAN_CATALOG[id].pricePerMonthUSD}/mo)`).join('\n');
      const currentId = current[provider] ?? options[0];
      console.log(`\nSelect ${provider.toUpperCase()} plan:`);
      console.log(display);
      const defIndex = Math.max(0, options.indexOf(currentId));
      const ans = await rlQuestion(rl, `Enter number [default ${defIndex + 1}]: `);
      const idx = ans.trim() ? Math.max(1, Math.min(options.length, Number(ans))) - 1 : defIndex;
      return options[idx];
    };

    const selected: UserSubscriptions = {
      chatgpt: await choose('chatgpt', ['chatgpt_free', 'chatgpt_plus']),
      claude: await choose('claude', ['claude_free', 'claude_pro']),
      perplexity: await choose('perplexity', ['perplexity_free', 'perplexity_pro']),
      abacus: await choose('abacus', ['abacus_free', 'abacus_pro', 'abacus_enterprise']),
      google: await choose('google', ['gemini_flash', 'gemini_pro']),
    };
    rl.close();
    await this.subs.setSubscriptions(selected);
    console.log('\nSaved subscriptions to logs/analytics/subscriptions.json');
    return selected;
  }

  async fetchLimits(): Promise<LimitsFetchResult[]> {
    const subs = await this.subs.getSubscriptions();
    const plans: PlanId[] = [subs.chatgpt, subs.claude, subs.perplexity, subs.abacus]
      .concat(subs.google ? [subs.google] : []);
    const results: LimitsFetchResult[] = [];
    for (const p of plans) results.push(await this.subs.fetchLatestLimits(p));
    return results;
  }

  async showStats(): Promise<void> {
    const snapshot = this.tracker.aggregate(await this.tracker.list());
    console.log('Usage summary:');
    console.log(`  Period: ${snapshot.from} -> ${snapshot.to}`);
    console.log(`  Events: ${snapshot.events}`);
    console.log(`  Estimated variable cost (USD): ${snapshot.costUSD}`);
    const totals = snapshot.totals;
    const keys = Object.keys(totals) as Provider[];
    if (keys.length === 0) {
      console.log('  No usage recorded yet.');
    } else {
      for (const prov of keys) {
        const t = totals[prov] || {} as Record<string, unknown>;
        const parts = Object.entries(t).map(([k, v]) => `${k}=${v}`).join(', ');
        console.log(`  ${prov}: ${parts}`);
      }
    }

    // Show approaching limit warnings
    const subs = await this.subs.getSubscriptions();
    const plans = {
      chatgpt: this.subs.getPlan(subs.chatgpt),
      claude: this.subs.getPlan(subs.claude),
      perplexity: this.subs.getPlan(subs.perplexity),
      abacus: this.subs.getPlan(subs.abacus),
      google: this.subs.getPlan(subs.google ?? 'gemini_flash'),
    };
    const approaching: Array<{ provider: Provider; metric: string; used: number; limit: number; note?: string }> = [];
    for (const provider of keys) {
      const byMetric = totals[provider] || {} as Record<string, unknown>;
      const plan = (plans as Record<string, { limits: { metric: string, limit?: number, notes?: string }[], id: string }>)[provider];
      for (const lim of plan.limits) {
        const used = Number((byMetric as Record<string, number>)[lim.metric] ?? 0);
        if (typeof lim.limit === 'number' && lim.limit > 0) {
          if (used / lim.limit >= 0.8) {
            approaching.push({ provider, metric: lim.metric, used, limit: lim.limit, note: lim.notes });
          }
        }
      }
    }
    if (approaching.length) {
      console.log('Warnings: approaching limits');
      for (const a of approaching) console.log(`  ${a.provider}:${a.metric} ${a.used}/${a.limit} (${a.note ?? ''})`);
    }
  }

  async optimize(): Promise<void> {
    const events = await this.tracker.list();
    const report = await this.engine.buildReport(events);
    console.log('Optimization suggestions:');
    if (!report.suggestions.length) {
      console.log('  No suggestions at this time.');
    } else {
      for (const s of report.suggestions) {
        console.log(`- [${s.impact}] ${s.title}`);
        console.log(`  ${s.details}`);
        if (s.action) console.log(`  Action: ${s.action}`);
      }
    }
  }

  async report(): Promise<void> {
    const events = await this.tracker.list();
    const report = await this.engine.buildReport(events);
    console.log('=== Usage Report ===');
    console.log(`Period: ${report.period.from} -> ${report.period.to}`);
    console.log('Subscriptions:');
    for (const [prov, plan] of Object.entries(report.subscriptions) as [Provider, PlanDefinition][]) {
      console.log(`  ${prov}: ${plan.name} (${plan.pricePerMonthUSD}/mo)`);
    }
    console.log('Totals:');
    for (const [prov, metrics] of Object.entries(report.totals)) {
      const parts = Object.entries(metrics as Record<string, unknown>).map(([k, v]) => `${k}=${v}`).join(', ');
      console.log(`  ${prov}: ${parts}`);
    }
    console.log(`Estimated variable cost: $${report.estCostUSD}`);
    if (report.approachingLimits.length) {
      console.log('Approaching limits:');
      for (const a of report.approachingLimits) {
        console.log(`  ${a.provider}:${a.metric} ${a.used}/${a.limit} (${a.note ?? ''})`);
      }
    }
    console.log('Suggestions:');
    if (report.suggestions.length === 0) console.log('  None');
    for (const s of report.suggestions) console.log(`  - (${s.impact}) ${s.title}`);
  }

  async recordEvent(ev: Omit<UsageEvent, 'id' | 'ts'> & { ts?: string; id?: string }): Promise<void> {
    await this.tracker.record(ev);
  }
}
