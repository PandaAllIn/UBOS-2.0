import { LLMAdapter, NormalizedRequest, StandardizedResponse } from './types.js';
import { geminiComplete } from '../../adapters/google_gemini.js';

export class GoogleAdapter implements LLMAdapter {
  id = 'google' as const;

  async complete(req: NormalizedRequest): Promise<StandardizedResponse> {
    const start = Date.now();
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

