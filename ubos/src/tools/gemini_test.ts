import { geminiComplete } from '../adapters/google_gemini.js';

export async function runGeminiTest(prompt: string): Promise<string> {
	const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
	return geminiComplete(prompt, model);
}
