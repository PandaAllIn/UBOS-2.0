import { LLMAdapter, NormalizedRequest, StandardizedResponse } from './types.js';
import { anthropicComplete } from '../../adapters/anthropic.js';

export class AnthropicAdapter implements LLMAdapter {
  id = 'anthropic' as const;

  async complete(req: NormalizedRequest): Promise<StandardizedResponse> {
    const start = Date.now();
    const prompt = buildPrompt(req);
    const text = await anthropicComplete(prompt, req.model || 'claude-3-5-sonnet-latest');
    const latency_ms = Date.now() - start;
    return {
      id: `anthropic_${Date.now()}`,
      provider: 'anthropic',
      model: req.model,
      created: new Date().toISOString(),
      output: { text },
      latency_ms,
      tenantId: req.tenantId,
    };
  }
}

function buildPrompt(req: NormalizedRequest): string {
  if (req.input.messages?.length) {
    return req.input.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');
  }
  return String(req.input.prompt || '');
}

