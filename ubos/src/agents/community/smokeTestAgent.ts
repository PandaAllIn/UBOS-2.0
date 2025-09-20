import { BaseAgent, AgentRunOptions, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';

// Context7-guided: Smoke test agent feature definition
const smokeTestFeature: AgentFeature = {
  type: 'smoke-test',
  capabilities: ['testing', 'validation', 'system-check'],
  requirements: { environment: ['development', 'testing'] }
};

export class SmokeTestAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'smoke-test') {
    super(id, requirementId, smokeTestFeature);
  }

  get type() { return 'SmokeTestAgent'; }

  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output: `SmokeTestAgent OK: ${opts.input || 'no input'}`,
        startedAt,
        finishedAt: this.getNow()
      };
    } catch (e: unknown) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: (e as Error)?.message || String(e),
        startedAt,
        finishedAt: this.getNow()
      };
    }
  }
}
