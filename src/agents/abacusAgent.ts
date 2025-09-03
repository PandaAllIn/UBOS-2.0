import { BaseAgent, AgentRunOptions, AgentContext } from './baseAgent.js';
import { AgentResult } from '../orchestrator/types.js';
import { runPerplexityTest } from '../tools/perplexity_sonar.js';

export class AbacusAgent extends BaseAgent {
  get type() { return 'AbacusAgent'; }
  async run(opts: AgentRunOptions, _ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.now();
    try {
      if (opts.dryRun) {
        return { agentId: this.id, requirementId: this.requirementId, success: true, output: '[Dry run] AbacusAgent would query research models.', startedAt, finishedAt: this.now() };
      }
      const out = await runPerplexityTest(`Research: ${opts.input}. Provide sources and a concise synthesis.`);
      return { agentId: this.id, requirementId: this.requirementId, success: true, output: out, startedAt, finishedAt: this.now() };
    } catch (e: any) {
      return { agentId: this.id, requirementId: this.requirementId, success: false, output: '', error: e?.message || String(e), startedAt, finishedAt: this.now() };
    }
  }
}

