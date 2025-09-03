#!/usr/bin/env node
import { runPerplexityTest } from '../tools/perplexity_sonar.js';

async function main() {
	const cmd = process.argv[2] || 'help';
	switch (cmd) {
		case 'perplexity:test': {
			const prompt = process.argv.slice(3).join(' ') || 'Say hello from EUFM.';
			const out = await runPerplexityTest(prompt);
			console.log(out);
			break;
		}
		default:
			console.log('Usage:');
			console.log('  npm run dev -- perplexity:test "your prompt"');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
