#!/usr/bin/env node
import { runPerplexityTest } from '../tools/perplexity_sonar.js';
import { runGeminiTest } from '../tools/gemini_test.js';
import { loadKnowledgeBase, toContext, findNotesByQuery } from '../memory/index.js';
import { UsageAnalyticsAgent } from '../analytics/usageAnalytics.js';
import { StrategicOrchestrator } from '../orchestrator/strategicOrchestrator.js';

async function main() {
	const cmd = process.argv[2] || 'help';
		switch (cmd) {
		case 'analytics:setup': {
			const agent = new UsageAnalyticsAgent();
			await agent.interactiveSetup();
			const limits = await agent.fetchLimits();
			console.log('\nFetched plan info (best-effort):');
			for (const l of limits) {
				console.log(`  ${l.provider}: ${l.plan} from ${l.source}${l.rawSourceUrl ? ` (${l.rawSourceUrl})` : ''}`);
			}
			break;
		}

		case 'analytics:track': {
			const agent = new UsageAnalyticsAgent();
			await agent.showStats();
			break;
		}

		case 'analytics:optimize': {
			const agent = new UsageAnalyticsAgent();
			await agent.optimize();
			break;
		}

		case 'analytics:report': {
			const agent = new UsageAnalyticsAgent();
			await agent.report();
			break;
		}
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

		case 'orchestrator:analyze': {
			const task = process.argv.slice(3).join(' ');
			if (!task) { console.log('Usage: npm run dev -- orchestrator:analyze "task description"'); break; }
			const orch = new StrategicOrchestrator();
			const { analyzed, suggestions } = await orch.analyze(task);
			console.log('=== Analysis ===');
			console.log(`Task: ${analyzed.title}`);
			console.log(`Risk: ${analyzed.riskLevel}`);
			console.log('Requirements:');
			for (const r of analyzed.requirements) {
				console.log(`  - ${r.id}: ${r.description}`);
				console.log(`    caps=${r.capabilities.join(', ')} complexity=${r.estimatedComplexity} est=${r.estimatedResources.timeMinutes}m`);
				if (r.optimizations?.length) console.log(`    optimizations: ${r.optimizations.join('; ')}`);
			}
			if (suggestions.length) {
				console.log('\nProactive suggestions:');
				suggestions.forEach((s) => console.log(`  - ${s}`));
			}
			break;
		}

		case 'orchestrator:execute': {
			const task = process.argv.slice(3).join(' ');
			if (!task) { console.log('Usage: npm run dev -- orchestrator:execute "task description"'); break; }
			const dry = String(process.env.DRY_RUN || '').toLowerCase() === 'true';
			const orch = new StrategicOrchestrator();
			const run = await orch.execute(task, { dryRun: dry });
			console.log('=== Execution Result ===');
			console.log(`Task: ${run.plan.task.title}`);
			console.log(`Started: ${run.startedAt}`);
			console.log(`Finished: ${run.finishedAt}`);
			console.log(`Success: ${run.success}`);
			console.log('Results:');
			for (const r of run.results) {
				console.log(`  - ${r.requirementId}/${r.agentId}: ${r.success ? 'ok' : 'fail'}${r.error ? ` (${r.error})` : ''}`);
			}
			console.log(`Summary: ${run.summary}`);
			console.log(`Saved to logs/orchestrator/run_${run.taskId}.json`);
			break;
		}

		case 'orchestrator:optimize': {
			const orch = new StrategicOrchestrator();
			const suggestions = await orch.optimize();
			console.log('=== Orchestrator Optimization ===');
			if (!suggestions.length) console.log('No suggestions at this time.');
			for (const s of suggestions) console.log(`- ${s}`);
			break;
		}

		case 'orchestrator:history': {
			const orch = new StrategicOrchestrator();
			const h = await orch.history();
			console.log('=== Orchestrator History ===');
			console.log(`Runs: ${h.files.length}`);
			if (h.latest) console.log(`Latest: ${h.latest.taskId} (${h.latest.startedAt} -> ${h.latest.finishedAt}) success=${h.latest.success}`);
			break;
		}

		default:
			console.log('Usage:');
			console.log('  npm run dev -- perplexity:test "your prompt"');
			console.log('  npm run dev -- gemini:test "your prompt"');
			console.log('  npm run dev -- memory:load');
			console.log('  npm run dev -- memory:context');
			console.log('  npm run dev -- memory:search "query"');
			console.log('  npm run dev -- orchestrator:analyze "task"');
			console.log('  npm run dev -- orchestrator:execute "task"');
			console.log('  npm run dev -- orchestrator:optimize');
			console.log('  npm run dev -- orchestrator:history');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
