import { LLMAdapter, NormalizedRequest, StandardizedResponse } from './types.js';
import { openaiComplete } from '../../adapters/openai.js';

export class OpenAIAdapter implements LLMAdapter {
  id = 'openai' as const;

  async complete(req: NormalizedRequest): Promise<StandardizedResponse> {
    const start = Date.now();
    try {
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
    } catch (error) {
      console.error('OpenAIAdapter Error:', error);
      const latency_ms = Date.now() - start;
      return {
        id: `openai_error_${Date.now()}`,
        provider: 'openai',
        model: req.model,
        created: new Date().toISOString(),
        output: { 
          text: '',
          error: error instanceof Error ? error.message : String(error) 
        },
        latency_ms,
        tenantId: req.tenantId,
      };
    }
  }
}

function buildPrompt(req: NormalizedRequest): string {
  if (req.input.messages?.length) {
    // A more structured approach to building a prompt from messages
    return req.input.messages
      .map((m) => {
        // Simple formatting, can be enhanced for specific model requirements
        return `<|im_start|>${m.role}\n${m.content}<|im_end|>`;
      })
      .join('\n');
  }
  return String(req.input.prompt || '');
}

