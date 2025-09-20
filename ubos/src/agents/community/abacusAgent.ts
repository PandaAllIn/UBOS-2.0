import { BaseAgent, AgentRunOptions, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { runPerplexityTest } from '../../tools/perplexity_sonar.js';

// Context7-guided: Abacus agent feature definition
const abacusFeature: AgentFeature = {
  type: 'abacus',
  capabilities: ['research', 'analysis', 'perplexity-integration'],
  requirements: { tools: ['perplexity', 'sonar'] }
};

export class AbacusAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'abacus-research') {
    super(id, requirementId, abacusFeature);
  }

  get type() { return 'AbacusAgent'; }
  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      if (opts.dryRun) {
        return { agentId: this.id, requirementId: this.requirementId, success: true, output: '[Dry run] AbacusAgent would query research models.', startedAt, finishedAt: this.getNow() };
      }
      const out = await runPerplexityTest(`Research: ${opts.input}. Provide sources and a concise synthesis.`);
      return { agentId: this.id, requirementId: this.requirementId, success: true, output: out, startedAt, finishedAt: this.getNow() };
    } catch (e: unknown) {
      return { agentId: this.id, requirementId: this.requirementId, success: false, output: '', error: (e as Error)?.message || String(e), startedAt, finishedAt: this.getNow() };
    }
  }
}
