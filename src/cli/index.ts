#!/usr/bin/env node
import { runPerplexityTest } from '../tools/perplexity_sonar.js';
import { runGeminiTest } from '../tools/gemini_test.js';
import { loadKnowledgeBase, toContext, findNotesByQuery } from '../memory/index.js';

async function main() {
	const cmd = process.argv[2] || 'help';
	switch (cmd) {
		case 'gemini:test': {
			const prompt = process.argv.slice(3).join(' ') || 'Say hello from EUFM.';
			const out = await runGeminiTest(prompt);
			console.log(out);
			break;
		}

		case 'perplexity:test': {
			const prompt = process.argv.slice(3).join(' ') || 'Say hello from EUFM.';
			const out = await runPerplexityTest(prompt);
			console.log(out);
			break;
		}

		case 'memory:load': {
			const notes = await loadKnowledgeBase();
			console.log(`Loaded ${notes.length} notes from knowledge base:`);
			notes.forEach(n => console.log(`  - ${n.title} (${n.path})`));
			break;
		}

		case 'memory:context': {
			const notes = await loadKnowledgeBase();
			const context = toContext(notes, { maxBytes: 10000 }); // Smaller for CLI
			console.log('Knowledge base context:\n');
			console.log(context);
			break;
		}

		case 'memory:search': {
			const query = process.argv.slice(3).join(' ');
			if (!query) {
				console.log('Usage: npm run dev -- memory:search "your query"');
				break;
			}
			const notes = await loadKnowledgeBase();
			const results = findNotesByQuery(notes, query);
			console.log(`Found ${results.length} notes matching "${query}":`);
			results.forEach(n => console.log(`  - ${n.title} (${n.path})`));
			break;
		}

		default:
			console.log('Usage:');
			console.log('  npm run dev -- perplexity:test "your prompt"');
			console.log('  npm run dev -- gemini:test "your prompt"');
			console.log('  npm run dev -- memory:load');
			console.log('  npm run dev -- memory:context');
			console.log('  npm run dev -- memory:search "query"');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
