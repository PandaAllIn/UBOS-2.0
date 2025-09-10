export type ProviderId = 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface NormalizedRequest {
  tenantId: string;
  provider: ProviderId;
  model: string;
  input: {
    prompt?: string;
    messages?: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }[];
    json?: boolean;
  };
  params?: {
    temperature?: number;
    maxOutputTokens?: number;
    top_p?: number;
  };
  metadata?: Record<string, any>;
}

export interface StandardizedResponse {
  id: string;
  provider: ProviderId;
  model: string;
  created: string;
  output: {
    text: string;
    citations?: any[];
    tool_calls?: any[];
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    cost_usd?: number;
  };
  latency_ms?: number;
  tenantId: string;
  warnings?: string[];
}

export interface LLMAdapter {
  id: ProviderId;
  complete(req: NormalizedRequest): Promise<StandardizedResponse>;
}

