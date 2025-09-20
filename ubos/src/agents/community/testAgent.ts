import { BaseAgent, AgentRunOptions, AgentContext, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';

// Context7-guided: Test agent feature definition
const testFeature: AgentFeature = {
  type: 'test',
  capabilities: ['validation', 'echo', 'integration-testing'],
  requirements: { environment: ['testing', 'development'] }
};

/**
 * TestAgent: a minimal agent used to validate integration.
 * - Echoes the input and context
 * - Never calls external services
 */
export class TestAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'test-integration') {
    super(id, requirementId, testFeature);
  }

  get type() { return 'TestAgent'; }

  async run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      if (!opts?.input || typeof opts.input !== 'string') {
        throw new Error('Invalid input: expected non-empty string');
      }

      if (opts.dryRun) {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: '[Dry run] TestAgent would echo the input.',
          startedAt,
          finishedAt: this.getNow(),
        };
      }

      const lines: string[] = [];
      lines.push('TestAgent Integration Run');
      lines.push(`Input: ${opts.input}`);
      if (ctx?.workingDir) lines.push(`WorkingDir: ${ctx.workingDir}`);
      if (ctx?.shared) lines.push(`SharedKeys: ${Object.keys(ctx.shared).join(', ') || 'none'}`);

      const output = lines.join('\n');

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output,
        artifacts: {
          echoed: opts.input,
          context: ctx ?? null,
        },
        startedAt,
        finishedAt: this.getNow(),
      };
    } catch (e: unknown) {
      const errMsg = (e as Error)?.message || String(e);
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: errMsg,
        startedAt,
        finishedAt: this.getNow(),
      };
    }
  }
}
