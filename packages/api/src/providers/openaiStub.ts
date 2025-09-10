import { ProviderAdapter, ProviderResponse } from './types.js';

export class OpenAIStub implements ProviderAdapter {
  name = 'openai-stub';
  async send(input: unknown, _options?: { model?: string }): Promise<ProviderResponse> {
    const start = Date.now();
    // Simulate some processing
    const output = { echo: input, provider: this.name };
    const latencyMs = Date.now() - start + 5;
    return { output, latencyMs, inputTokens: 1, outputTokens: 1, costUsd: 0 };
  }
}


