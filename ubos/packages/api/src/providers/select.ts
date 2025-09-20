import { ProviderAdapter } from './types.js';
import { OpenAIAdapter } from './openai.js';
import { OpenAIStub } from './openaiStub.js';

export function selectAdapter(preferred?: string): ProviderAdapter {
  if (preferred === 'openai' && process.env.OPENAI_API_KEY) return new OpenAIAdapter();
  if (process.env.OPENAI_API_KEY) return new OpenAIAdapter();
  return new OpenAIStub();
}


