import { loadKnowledgeBase } from '../memory/memoryLoader.js';
import { OptimizationEngine } from '../analytics/optimizationEngine.js';
import { SubscriptionManager, FileSubscriptionStore } from '../analytics/subscriptionManager.js';
import { ToolUsageTracker } from '../analytics/toolUsageTracker.js';
import { AgentSpec } from './types.js';

export class CapabilityMapper {
  subs = new SubscriptionManager(new FileSubscriptionStore('logs/analytics/subscriptions.json'));
  tracker = new ToolUsageTracker();
  engine = new OptimizationEngine(this.subs, this.tracker);

  async map(requirementId: string, description: string, capabilities: string[]): Promise<AgentSpec[]> {
    const specs: AgentSpec[] = [];
    const caps = new Set(capabilities);
    const subs = await this.subs.getSubscriptions();

    // Memory-aware routing
    try {
      const kb = await loadKnowledgeBase();
      const isDocHeavy = kb.length > 0 && /docs|readme|kb|knowledge|architecture/i.test(description);
      if (isDocHeavy) {
        specs.push({ id: `agent_${requirementId}_mem`, type: 'MemoryAgent', requirementId, capabilities: ['memory'], params: { query: description } });
      }
    } catch {}

    // Coding
    if (caps.has('coding')) {
      // Prefer local CodexAgent abstraction (wraps OpenAI/Anthropic/Gemini via adapters), fallbacks based on subscription cost-awareness
      specs.push({ id: `agent_${requirementId}_code`, type: 'CodexAgent', requirementId, capabilities: ['coding'], params: { modelPreference: 'balanced' } });
      // Secondary advisor using Gemini for code review if available
      specs.push({ id: `agent_${requirementId}_jules`, type: 'JulesAgent', requirementId, capabilities: ['coding'], params: { role: 'review' } });
    }

    // Research
    if (caps.has('research')) {
      // Prefer Perplexity for web research if PRO plan
      const usePerplexity = subs.perplexity === 'perplexity_pro';
      if (usePerplexity) {
        specs.push({ id: `agent_${requirementId}_abacus`, type: 'AbacusAgent', requirementId, capabilities: ['research'], params: { mode: 'research' } });
      } else {
        // Fall back to Gemini/Claude via JulesAgent for general research
        specs.push({ id: `agent_${requirementId}_jules_research`, type: 'JulesAgent', requirementId, capabilities: ['research'], params: { role: 'research' } });
      }
    }

    // Data
    if (caps.has('data')) {
      specs.push({ id: `agent_${requirementId}_code_data`, type: 'CodexAgent', requirementId, capabilities: ['data', 'coding'], params: { modelPreference: 'cost' } });
    }

    // Web automation
    if (caps.has('web_automation')) {
      specs.push({ id: `agent_${requirementId}_browser`, type: 'BrowserAgent', requirementId, capabilities: ['web_automation'], params: { headless: true } });
    }

    return specs;
  }
}

