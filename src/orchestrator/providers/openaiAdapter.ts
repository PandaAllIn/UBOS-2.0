import { LLMAdapter, NormalizedRequest, StandardizedResponse } from './types.js';
import { openaiComplete } from '../../adapters/openai.js';

export class OpenAIAdapter implements LLMAdapter {
  id = 'openai' as const;

  async complete(req: NormalizedRequest): Promise<StandardizedResponse> {
    const start = Date.now();
    const prompt = buildPrompt(req);
    const text = await openaiComplete(prompt, {
      model: req.model,
      temperature: req?.params?.temperature,
      maxOutputTokens: req?.params?.maxOutputTokens,
      json: !!req.input.json,
    });
    const latency_ms = Date.now() - start;
    return {
      id: `openai_${Date.now()}`,
      provider: 'openai',
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

