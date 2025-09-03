import { geminiComplete } from '../adapters/google_gemini.js';

export async function runGeminiTest(prompt: string): Promise<string> {
	const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
	return geminiComplete(prompt, model);
}
