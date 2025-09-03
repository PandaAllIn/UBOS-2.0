import fetch from 'node-fetch';
import { trackLLMUsage } from '../analytics/autoTracker.js';

const ENDPOINT = 'https://api.perplexity.ai/chat/completions';

export async function runPerplexityTest(prompt: string): Promise<string> {
	const apiKey = process.env.PERPLEXITY_API_KEY;
	if (!apiKey) throw new Error('Missing PERPLEXITY_API_KEY');

	const model = process.env.PERPLEXITY_MODEL || 'sonar-pro';
	const body = {
		model,
		messages: [
			{ role: 'system', content: 'You are EUFM test agent.' },
			{ role: 'user', content: prompt }
		],
		temperature: 0.2
	};

	const res = await fetch(ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Perplexity API error ${res.status}: ${text}`);
	}
	const data: any = await res.json();
	const content = data?.choices?.[0]?.message?.content ?? '';

	// Extract usage if provided by API
	const usage = data?.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

	// Record usage (optional, best-effort)
	try { await trackLLMUsage('perplexity', model, prompt, typeof content === 'string' ? content : JSON.stringify(content), usage); } catch {}
	return typeof content === 'string' ? content : JSON.stringify(content);
}
