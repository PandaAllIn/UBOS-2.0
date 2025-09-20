import fetch from 'node-fetch';

export interface PerplexityOptions {
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export async function perplexityComplete(prompt: string, options: PerplexityOptions): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error('Missing PERPLEXITY_API_KEY');
  const url = 'https://api.perplexity.ai/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: 'system', content: 'You are EUFM Perplexity adapter.' },
        { role: 'user', content: prompt }
      ],
      temperature: options.temperature ?? 0.2,
      max_tokens: options.max_tokens ?? 1024
    })
  });
  if (!res.ok) throw new Error(`Perplexity error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data?.choices?.[0]?.message?.content ?? '';
}

