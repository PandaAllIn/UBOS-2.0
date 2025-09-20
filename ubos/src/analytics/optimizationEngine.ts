import { PlanDefinition, PlanId, Provider, SubscriptionManager } from './subscriptionManager.js';
import { DEFAULT_PRICING, ToolUsageTracker, UsageEvent, UsageSnapshot, round2 } from './toolUsageTracker.js';

export interface OptimizationSuggestion {
  id: string;
  title: string;
  impact: 'low' | 'medium' | 'high';
  details: string;
  action?: string;
}

export interface OptimizationReport {
  period: { from: string; to: string };
  subscriptions: Record<Provider, PlanDefinition>;
  totals: UsageSnapshot['totals'];
  estCostUSD: number;
  suggestions: OptimizationSuggestion[];
  approachingLimits: Array<{ provider: Provider; plan: PlanId; metric: string; used: number; limit: number; note?: string }>;
}

export class OptimizationEngine {
  constructor(private subs: SubscriptionManager, private tracker: ToolUsageTracker) {}

  async buildReport(events: UsageEvent[]): Promise<OptimizationReport> {
    const snapshot = this.tracker.aggregate(events);
    const subs = await this.subs.getSubscriptions();
    const plans: Record<Provider, PlanDefinition> = {
      chatgpt: this.subs.getPlan(subs.chatgpt),
      claude: this.subs.getPlan(subs.claude),
      perplexity: this.subs.getPlan(subs.perplexity),
      abacus: this.subs.getPlan(subs.abacus),
      google: this.subs.getPlan(subs.google ?? 'gemini_flash'),
    };

    const estCostUSD = this.tracker.estimateCost(events, DEFAULT_PRICING);
    const approaching = this.findApproachingLimits(snapshot, plans);
    const suggestions = this.makeSuggestions(snapshot, plans, estCostUSD);
    return {
      period: { from: snapshot.from, to: snapshot.to },
      subscriptions: plans,
      totals: snapshot.totals,
      estCostUSD,
      suggestions,
      approachingLimits: approaching,
    };
  }

  private findApproachingLimits(snapshot: UsageSnapshot, plans: Record<Provider, PlanDefinition>) {
    const alerts: OptimizationReport['approachingLimits'] = [];
    for (const provider of Object.keys(snapshot.totals) as Provider[]) {
      const byMetric = snapshot.totals[provider] || {};
      const plan = plans[provider];
      for (const lim of plan.limits) {
        const used = (byMetric as Record<string, number>)[lim.metric] || 0;
        if (typeof lim.limit === 'number' && lim.limit > 0) {
          const usageRatio = used / lim.limit;
          if (usageRatio >= 0.8) {
            alerts.push({ provider, plan: plan.id, metric: lim.metric, used, limit: lim.limit, note: lim.notes });
          }
        }
      }
    }
    return alerts;
  }

  private makeSuggestions(snapshot: UsageSnapshot, plans: Record<Provider, PlanDefinition>, estCostUSD: number): OptimizationSuggestion[] {
    const s: OptimizationSuggestion[] = [];

    // Cross-provider substitution: if user pays for ChatGPT Plus, prefer it for browsing/general Q&A
    if (plans.chatgpt.pricePerMonthUSD > 0 && (snapshot.totals.perplexity?.requests || 0) > 50) {
      s.push({
        id: 'use-chatgpt-plus-for-qa',
        title: 'Shift general Q&A to ChatGPT Plus',
        impact: 'medium',
        details: 'You already pay a flat monthly fee for ChatGPT Plus. For general browsing/Q&A tasks, prefer ChatGPT sessions instead of API calls to reduce variable costs.',
        action: 'Route lightweight queries to ChatGPT web; reserve API for automation.'
      });
    }

    // If Claude Pro exists, suggest using Claude web for long-form reasoning where API cost is high
    if (plans.claude.pricePerMonthUSD > 0 && (snapshot.totals.claude?.tokens || 0) > 1_000_000) {
      s.push({
        id: 'use-claude-pro-web',
        title: 'Use Claude Pro web for long-form tasks',
        impact: 'medium',
        details: 'Long-form tasks can be done in Claude Pro web UI which is subscription-based, reducing per-token API spend.',
      });
    }

    // If Abacus has spare quota, shift batch/offline workloads there
    if ((snapshot.totals.abacus?.tokens || 0) < 0.5 * (plans.abacus.limits.find(l => l.metric === 'tokens')?.limit ?? Infinity)) {
      s.push({
        id: 'shift-batch-to-abacus',
        title: 'Shift batch workloads to Abacus.ai',
        impact: 'low',
        details: 'You have spare token quota on Abacus.ai; consider shifting batch/offline inference to utilize included capacity.',
      });
    }

    // Cost alert
    if (estCostUSD > 100) {
      s.push({
        id: 'cost-overspend',
        title: `High variable spend (~$${round2(estCostUSD)})`,
        impact: 'high',
        details: 'Your variable API usage cost is high. Consider consolidating on subscriptions or using cheaper models for bulk tasks.',
      });
    }

    // Upgrade/downgrade hints
    for (const provider of Object.keys(plans) as Provider[]) {
      const plan = plans[provider];
      const totals = snapshot.totals[provider] || {};
      const msgUsed = (totals.messages || 0) + (totals.requests || 0);
      const limit = plan.limits.find(l => l.metric === 'messages' || l.metric === 'requests');
      if (limit && typeof limit.limit === 'number') {
        const ratio = msgUsed / (limit.limit || Infinity);
        if (ratio > 0.9) {
          s.push({
            id: `upgrade-${provider}`,
            title: `Consider upgrading ${plan.name}`,
            impact: 'medium',
            details: `Usage is ${Math.round(ratio * 100)}% of the monthly cap. Upgrade for higher limits.`,
          });
        } else if (ratio < 0.2 && plan.pricePerMonthUSD > 0) {
          s.push({
            id: `downgrade-${provider}`,
            title: `Consider downgrading ${plan.name}`,
            impact: 'low',
            details: `You use <20% of the plan limits. A lower tier may suffice.`,
          });
        }
      }
    }

    return s;
  }
}
