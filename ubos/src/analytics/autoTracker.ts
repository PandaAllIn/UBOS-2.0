// Simple, optional usage auto-tracker for LLM calls
// - Enabled only when EUFM_TRACK_USAGE=true
// - Records requests and tokens using UsageAnalyticsAgent
// - Estimates tokens when API does not provide usage
// - Never throws: failures are swallowed to avoid impacting API calls

import { UsageAnalyticsAgent } from './usageAnalytics.js';
import type { Provider, PlanId } from './subscriptionManager.js';

let agentSingleton: UsageAnalyticsAgent | null = null;

function getAgent(): UsageAnalyticsAgent {
  if (!agentSingleton) agentSingleton = new UsageAnalyticsAgent();
  return agentSingleton;
}

function isEnabled(): boolean {
  return String(process.env.EUFM_TRACK_USAGE || '').toLowerCase() === 'true';
}

export function estimateTokens(text: string | undefined | null): number {
  if (!text) return 0;
  // Very rough heuristic: ~4 chars per token
  return Math.max(0, Math.ceil(text.length / 4));
}

type UsageLike = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

export async function trackLLMUsage(
  provider: Provider,
  model: string,
  prompt?: string,
  completion?: string,
  usageFromApi?: UsageLike,
): Promise<void> {
  try {
    if (!isEnabled()) return;

    const agent = getAgent();
    // Resolve a plan to satisfy analytics schema; use best-match or a safe fallback.
    const subs = await agent.subs.getSubscriptions();
    const plan = (subs[provider] ?? subs.perplexity ?? subs.abacus) as PlanId;

    // Compute total tokens from API usage if present, else estimate from text sizes.
    const apiTotal = (usageFromApi?.total_tokens ?? 0) || ((usageFromApi?.prompt_tokens ?? 0) + (usageFromApi?.completion_tokens ?? 0));
    const estTotal = apiTotal > 0 ? apiTotal : (estimateTokens(prompt) + estimateTokens(completion));

    // Fire-and-forget with safety: do not block or throw if tracking fails.
    agent.recordEvent({ provider, plan, metric: 'requests', amount: 1, model, tags: ['auto'] }).catch((err) => {
      console.error('Error recording analytics event (requests):', err);
    });
    if (estTotal > 0) {
      agent.recordEvent({ provider, plan, metric: 'tokens', amount: estTotal, model, tags: ['auto'] }).catch((err) => {
        console.error('Error recording analytics event (tokens):', err);
      });
    }
  } catch (err) {
    // Swallow any tracking errors completely, but log them for debugging
    console.error('Error in trackLLMUsage:', err);
  }
}
