import { LLMAdapter, NormalizedRequest, StandardizedResponse } from './types.js';
import { anthropicComplete } from '../../adapters/anthropic.js';

export class AnthropicAdapter implements LLMAdapter {
  id = 'anthropic' as const;

  async complete(req: NormalizedRequest): Promise<StandardizedResponse> {
    const start = Date.now();
    try {
      const prompt = buildPrompt(req);
      const text = await anthropicComplete(prompt, { model: req.model || 'claude-3-5-sonnet-latest' });
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
    } catch (error) {
      console.error('AnthropicAdapter Error:', error);
      const latency_ms = Date.now() - start;
      return {
        id: `anthropic_error_${Date.now()}`,
        provider: 'anthropic',
        model: req.model,
        created: new Date().toISOString(),
        output: { text: '' },
        latency_ms,
        tenantId: req.tenantId,
        warnings: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}

function buildPrompt(req: NormalizedRequest): string {
  if (req.input.messages?.length) {
    // Anthropic's format is a single string with roles.
    return req.input.messages
      .map((m) => `\n\n${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
      .join('') + '\n\nAssistant:'; // Prompt the assistant to respond
  }
  return String(req.input.prompt || '');
}
