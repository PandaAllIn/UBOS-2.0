import { BaseAgent, AgentRunOptions, AgentContext, AgentFeature } from '../premium/baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { openaiComplete } from '../../adapters/openai.js';
import { anthropicComplete } from '../../adapters/anthropic.js';
import { geminiComplete } from '../../adapters/google_gemini.js';

// Context7-guided: Codex agent feature definition
const codexFeature: AgentFeature = {
  type: 'codex',
  capabilities: ['code-planning', 'ai-integration', 'model-selection'],
  requirements: { models: ['openai', 'anthropic', 'gemini'] }
};

function pickModel(pref: 'balanced' | 'cost' | 'quality') {
  if (pref === 'quality') return { provider: 'anthropic', model: 'claude-3-5-sonnet-latest' } as const;
  if (pref === 'cost') return { provider: 'openai', model: 'gpt-4o-mini' } as const;
  return { provider: 'openai', model: 'gpt-4o' } as const;
}

export class CodexAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'codex-planning') {
    super(id, requirementId, codexFeature);
  }

  get type() { return 'CodexAgent'; }

  async run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      if (opts.dryRun) {
        return { agentId: this.id, requirementId: this.requirementId, success: true, output: '[Dry run] CodexAgent would plan code changes.', startedAt, finishedAt: this.getNow() };
      }
      const pref: 'balanced' | 'cost' | 'quality' = (ctx?.shared?.modelPreference as 'balanced' | 'cost' | 'quality') || {};
      const { provider, model } = pickModel(pref);
      let out = '';
      const prompt = `You are CodexAgent. Task: ${opts.input}\n\nReturn a concise plan and code diffs if applicable.`;
      if (provider === 'openai') out = await openaiComplete(prompt, { model, temperature: 0.2 });
      else if (provider === 'anthropic') out = await anthropicComplete(prompt, { model });
      else out = await geminiComplete(prompt, 'gemini-2.0-flash-exp');

      return { agentId: this.id, requirementId: this.requirementId, success: true, output: out, startedAt, finishedAt: this.getNow() };
    } catch (e: unknown) {
      return { agentId: this.id, requirementId: this.requirementId, success: false, output: '', error: (e as Error)?.message || String(e), startedAt, finishedAt: this.getNow() };
    }
  }
}
