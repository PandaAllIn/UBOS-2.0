import fetch from 'node-fetch';
import { trackLLMUsage } from '../analytics/autoTracker.js';

export async function geminiComplete(prompt: string, model = 'gemini-2.5-flash'): Promise<string> {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
	const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
	});
	if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
	const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
	const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

	// Record usage (optional, best-effort)
	try { await trackLLMUsage('google', model, prompt, text); } catch (e) { console.error(e); }
	return text;
}
