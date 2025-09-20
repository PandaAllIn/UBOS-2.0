export interface ProviderResponse {
  output: unknown;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
}

export interface ProviderAdapter {
  name: string;
  send(input: unknown, options?: { model?: string }): Promise<ProviderResponse>;
}


