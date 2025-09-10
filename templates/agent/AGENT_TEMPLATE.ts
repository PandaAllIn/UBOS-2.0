import { BaseAgent, AgentRunOptions, AgentContext } from '../../src/agents/baseAgent.js';
import { AgentResult } from '../../src/orchestrator/types.js';

export class {{CLASS_NAME}} extends BaseAgent {
  get type() { return '{{AGENT_TYPE}}'; }

  async run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.now();
    try {
      // Implement your agent logic here
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output: '{{AGENT_TYPE}} executed successfully',
        startedAt,
        finishedAt: this.now()
      };
    } catch (error: any) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: error?.message || String(error),
        startedAt,
        finishedAt: this.now()
      };
    }
  }
}

// Register in src/orchestrator/agentFactory.ts by adding case '{{AGENT_TYPE}}'
// and export the class from an appropriate src/agents/ file.

