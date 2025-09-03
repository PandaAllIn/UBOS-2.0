import { BaseAgent, AgentRunOptions, AgentContext } from './baseAgent.js';
import { AgentResult } from '../orchestrator/types.js';
import { geminiComplete } from '../adapters/google_gemini.js';

export class JulesAgent extends BaseAgent {
  get type() { return 'JulesAgent'; }
  async run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.now();
    try {
      if (opts.dryRun) {
        return { agentId: this.id, requirementId: this.requirementId, success: true, output: '[Dry run] JulesAgent would provide code review and suggestions.', startedAt, finishedAt: this.now() };
      }
      const role = ctx?.shared?.role || 'review';
      const prompt = `You are Jules (Gemini Code Assist). Role: ${role}. Task: ${opts.input}. Provide succinct guidance and actionable steps.`;
      const out = await geminiComplete(prompt, 'gemini-1.5-pro');
      return { agentId: this.id, requirementId: this.requirementId, success: true, output: out, startedAt, finishedAt: this.now() };
    } catch (e: any) {
      return { agentId: this.id, requirementId: this.requirementId, success: false, output: '', error: e?.message || String(e), startedAt, finishedAt: this.now() };
    }
  }
}

