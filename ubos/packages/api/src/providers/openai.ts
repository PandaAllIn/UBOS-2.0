import OpenAI from 'openai';
import { ProviderAdapter, ProviderResponse } from './types.js';

export class OpenAIAdapter implements ProviderAdapter {
  name = 'openai';
  private client: OpenAI;
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) throw new Error('OPENAI_API_KEY required');
    this.client = new OpenAI({ apiKey });
  }
  async send(input: unknown, options?: { model?: string }): Promise<ProviderResponse> {
    const model = options?.model || 'gpt-4o-mini';
    const start = Date.now();
    const msg = typeof input === 'string' ? input : JSON.stringify(input);
    const res = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: msg }],
      temperature: 0.2
    });
    const output = res.choices[0]?.message?.content ?? '';
    const latencyMs = Date.now() - start;
    const usage = res.usage;
    return { output, latencyMs, inputTokens: usage?.prompt_tokens, outputTokens: usage?.completion_tokens, costUsd: 0 };
  }
}


