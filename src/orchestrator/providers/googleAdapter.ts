import { LLMAdapter, NormalizedRequest, StandardizedResponse } from './types.js';
import { geminiComplete } from '../../adapters/google_gemini.js';

export class GoogleAdapter implements LLMAdapter {
  id = 'google' as const;

  async complete(req: NormalizedRequest): Promise<StandardizedResponse> {
    const start = Date.now();
    try {
      const prompt = buildPrompt(req);
      const text = await geminiComplete(prompt, req.model || 'gemini-2.5-flash');
      const latency_ms = Date.now() - start;
      return {
        id: `google_${Date.now()}`,
        provider: 'google',
        model: req.model,
        created: new Date().toISOString(),
        output: { text },
        latency_ms,
        tenantId: req.tenantId,
      };
    } catch (error) {
      console.error('GoogleAdapter Error:', error);
      const latency_ms = Date.now() - start;
      return {
        id: `google_error_${Date.now()}`,
        provider: 'google',
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
    // Gemini has a specific format for multi-turn chat.
    // This is a simplified version.
    return req.input.messages
      .map((m) => `## ${m.role}\n${m.content}`)
      .join('\n');
  }
  return String(req.input.prompt || '');
}
