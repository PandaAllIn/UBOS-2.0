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
      // Determine if we should use Codex CLI for direct system access
      const needsSystemAccess = description.toLowerCase().includes('file') || 
        description.toLowerCase().includes('create') || 
        description.toLowerCase().includes('refactor') ||
        description.toLowerCase().includes('install') ||
        description.toLowerCase().includes('setup');

      if (needsSystemAccess) {
        // Use Codex CLI for direct file/system operations
        specs.push({ id: `agent_${requirementId}_codex_cli`, type: 'CodexCLIAgent', requirementId, capabilities: ['coding', 'file_operations', 'system_access'], params: { mode: 'agent', approvalRequired: false } });
      } else {
        // Use standard CodexAgent for planning and code generation
        specs.push({ id: `agent_${requirementId}_code`, type: 'CodexAgent', requirementId, capabilities: ['coding'], params: { modelPreference: 'balanced' } });
      }
      
      // Secondary advisor using Gemini for code review if available
      specs.push({ id: `agent_${requirementId}_jules`, type: 'JulesAgent', requirementId, capabilities: ['coding'], params: { role: 'review' } });
    }

    // Research
    if (caps.has('research')) {
      // Prefer Enhanced Perplexity for comprehensive research if PRO plan
      const usePerplexity = subs.perplexity === 'perplexity_pro';
      if (usePerplexity) {
        // Use Enhanced Abacus for advanced research with structured results
        specs.push({ id: `agent_${requirementId}_enhanced_abacus`, type: 'EnhancedAbacusAgent', requirementId, capabilities: ['research'], params: { depth: 'comprehensive', sources: 'mixed' } });
      } else {
        // Fall back to standard Abacus or Gemini for basic research
        specs.push({ id: `agent_${requirementId}_abacus`, type: 'AbacusAgent', requirementId, capabilities: ['research'], params: { mode: 'research' } });
      }
    }

    // Agent Discovery & Meta-Task Analysis
    if (caps.has('agent_discovery') || description.toLowerCase().includes('what agent') || description.toLowerCase().includes('which tool') || description.toLowerCase().includes('best approach')) {
      // Use Agent Summoner for discovering optimal agents for complex tasks
      specs.push({ id: `agent_${requirementId}_summoner`, type: 'AgentSummonerAgent', requirementId, capabilities: ['agent_discovery', 'meta_analysis'], params: { complexity: 'auto', saveResults: true } });
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

