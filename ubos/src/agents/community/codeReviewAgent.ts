import { BaseAgent, AgentRunOptions, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { geminiComplete } from '../../adapters/google_gemini.js';

// Code review agent leveraging Gemini for guidance
const codeReviewFeature: AgentFeature = {
  type: 'code-review',
  capabilities: ['code-review', 'guidance', 'gemini-integration'],
  requirements: { models: ['gemini'] }
};

export class CodeReviewAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'code-review') {
    super(id, requirementId, codeReviewFeature);
  }

  get type() { return 'CodeReviewAgent'; }
  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      if (opts.dryRun) {
        return { agentId: this.id, requirementId: this.requirementId, success: true, output: '[Dry run] CodeReviewAgent would provide code review and suggestions.', startedAt, finishedAt: this.getNow() };
      }
      const role = 'review';
      const prompt = `You are a senior code reviewer using Gemini. Role: ${role}. Task: ${opts.input}. Provide succinct guidance and actionable steps.`;
      const out = await geminiComplete(prompt, 'gemini-2.0-flash-exp');
      return { agentId: this.id, requirementId: this.requirementId, success: true, output: out, startedAt, finishedAt: this.getNow() };
    } catch (e: unknown) {
      return { agentId: this.id, requirementId: this.requirementId, success: false, output: '', error: (e as Error)?.message || String(e), startedAt, finishedAt: this.getNow() };
    }
  }
}
