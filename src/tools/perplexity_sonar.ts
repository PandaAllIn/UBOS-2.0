import fetch from 'node-fetch';

const ENDPOINT = 'https://api.perplexity.ai/chat/completions';

export async function runPerplexityTest(prompt: string): Promise<string> {
	const apiKey = process.env.PERPLEXITY_API_KEY;
	if (!apiKey) throw new Error('Missing PERPLEXITY_API_KEY');

	const body = {
		model: 'sonar-small-chat',
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
	return typeof content === 'string' ? content : JSON.stringify(content);
}
