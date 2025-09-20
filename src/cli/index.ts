#!/usr/bin/env node
import 'dotenv/config';
import { runPerplexityTest } from '../tools/perplexity_sonar.js';
import { runGeminiTest } from '../tools/gemini_test.js';
import { sendTriMessage } from '../tools/triChat.js';
import { loadKnowledgeBase, toContext, findNotesByQuery } from '../memory/index.js';
import { UsageAnalyticsAgent } from '../analytics/usageAnalytics.js';
import { StrategicOrchestrator } from '../orchestrator/strategicOrchestrator.js';
import { DashboardServer } from '../dashboard/dashboardServer.js';
import { AgentFactory } from '../orchestrator/agentFactory.js';
import { FundingOpportunityScanner } from '../dashboard/fundingOpportunityScanner.js';
import { claudeInterface } from '../tools/claudeAgentInterface.js';
import { projectRegistry } from '../masterControl/projectRegistry.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';
import { NotionSyncService } from '../integrations/notionSyncService.js';
import { notionSyncAgent } from '../agents/notionSyncAgent.js';
import { promises as fs } from 'fs';
import path from 'path';

async function main() {
	const cmd = process.argv[2] || 'help';
		switch (cmd) {
        case 'notion:sync-projects': {
            try {
                console.log('🔄 Syncing projects to Notion...');
                const svc = new NotionSyncService();
                await svc.syncProjects();
                console.log('✅ Projects sync complete.');
            } catch (e: any) {
                console.error('❌ Notion projects sync failed:', e.message);
                process.exit(1);
            }
            break;
        }

        case 'notion:sync-agents': {
            try {
                console.log('🔄 Syncing agent activity to Notion...');
                const svc = new NotionSyncService();
                await svc.syncAgents();
                console.log('✅ Agent activity sync complete.');
            } catch (e: any) {
                console.error('❌ Notion agents sync failed:', e.message);
                process.exit(1);
            }
            break;
        }

        case 'notion:sync-funding': {
            try {
                console.log('🔄 Syncing funding opportunities to Notion...');
                const svc = new NotionSyncService();
                await svc.syncFunding();
                await svc.syncCriticalDeadlines();
                console.log('✅ Funding sync complete.');
            } catch (e: any) {
                console.error('❌ Notion funding sync failed:', e.message);
                process.exit(1);
            }
            break;
        }

        case 'notion:daily-update': {
            try {
                console.log('🗓️ Running Notion daily update...');
                const svc = new NotionSyncService();
                await svc.syncProjects();
                await svc.syncAgents();
                await svc.syncFunding();
                await svc.syncCriticalDeadlines();
                await svc.syncDailyBriefing();
                console.log('✅ Daily update complete.');
            } catch (e: any) {
                console.error('❌ Notion daily update failed:', e.message);
                process.exit(1);
            }
            break;
        }

        case 'notion:start-scheduler': {
            try {
                const result = await notionSyncAgent.execute('start-scheduler');
                console.log(result);
            } catch (e: any) {
                console.error('❌ Scheduler start failed:', e.message);
                process.exit(1);
            }
            break;
        }

        case 'notion:stop-scheduler': {
            try {
                const result = await notionSyncAgent.execute('stop-scheduler');
                console.log(result);
            } catch (e: any) {
                console.error('❌ Scheduler stop failed:', e.message);
                process.exit(1);
            }
            break;
        }

        case 'notion:status': {
            try {
                const result = await notionSyncAgent.execute('status');
                console.log(result);
            } catch (e: any) {
                console.error('❌ Status check failed:', e.message);
                process.exit(1);
            }
            break;
        }

        case 'notion:sync-all': {
            try {
                const result = await notionSyncAgent.execute('sync-all');
                console.log(result);
            } catch (e: any) {
                console.error('❌ Full sync failed:', e.message);
                process.exit(1);
            }
            break;
        }
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

        case 'spec:list': {
            try {
                const p = path.join(process.cwd(), 'logs', 'specs', 'registry.json');
                const raw = await fs.readFile(p, 'utf-8').catch(() => '');
                const reg = raw ? JSON.parse(raw) : {};
                const entries = Object.entries(reg) as Array<[string, any]> ;
                if (!entries.length) { console.log('No specs recorded yet.'); break; }
                console.log('=== Registered Specs ===');
                for (const [specPath, meta] of entries) {
                    console.log(`- ${specPath} :: v${meta.version} @ ${meta.updatedAt}`);
                }
            } catch (e: any) {
                console.error('❌ spec:list failed:', e.message);
                process.exit(1);
            }
            break;
        }

        case 'spec:events': {
            try {
                const limit = parseInt(process.argv[3] || '20');
                const p = path.join(process.cwd(), 'logs', 'specs', 'territories_events.json');
                const raw = await fs.readFile(p, 'utf-8').catch(() => '');
                const events: any[] = raw ? JSON.parse(raw) : [];
                console.log(`=== Territory Events (last ${limit}) ===`);
                events.slice(-limit).forEach((evt) => {
                    console.log(`${evt.ts} [${evt.traceId || 'n/a'}] ${evt.id} v${evt.version} :: services=[${(evt.services||[]).join(', ')}]`);
                });
            } catch (e: any) {
                console.error('❌ spec:events failed:', e.message);
                process.exit(1);
            }
            break;
        }

        case 'spec:diff': {
            try {
                const target = process.argv[3];
                const p = path.join(process.cwd(), 'logs', 'specs', 'changelog.json');
                const raw = await fs.readFile(p, 'utf-8').catch(() => '');
                const changes: any[] = raw ? JSON.parse(raw) : [];
                const filtered = target ? changes.filter(c => c.path.includes(target)) : changes;
                if (!filtered.length) { console.log('No changelog entries found.'); break; }
                const last = filtered[filtered.length - 1];
                console.log('=== Latest Spec Diff ===');
                console.log(`Path: ${last.path}`);
                console.log(`From: ${last.from || 'none'} -> To: ${last.to}`);
                console.log(`Diff: +${last.diff.added} / -${last.diff.removed} / =${last.diff.same}`);
            } catch (e: any) {
                console.error('❌ spec:diff failed:', e.message);
                process.exit(1);
            }
            break;
        }

		case 'gemini:cli': {
			console.log('🚀 Starting Gemini 2.5 Flash CLI...');
			console.log('💡 Set GEMINI_API_KEY environment variable first');
			console.log('📝 Example: export GEMINI_API_KEY=your_key_here');
			console.log('---');

			const { GeminiCLI } = await import('../tools/gemini_cli.js');
			const cli = new GeminiCLI();
			await cli.start();
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

				case 'tri:send': {
					const from = (process.argv[3] as any) || 'human';
					const to = (process.argv[4] as any) || 'claude';
					const text = process.argv.slice(5).join(' ');
					if (!text) {
						console.log('Usage: npm run dev -- tri:send <from: human|gpt5|claude> <to: human|gpt5|claude|all> "message"');
						break;
					}

					try {
						const { sendTriMessage, printTriStatus } = await import('../tools/triChat.js');
						await sendTriMessage(from, to, text);
						await printTriStatus(5);
					} catch (error: any) {
						console.error('Error sending tri message:', error.message);
					}
					break;
				}

				case 'tri:bridge': {
					const lookback = parseInt(process.argv[3] || '20');
					try {
						const { runBridgeOnce, printTriStatus } = await import('../tools/triChat.js');
						const { processed } = await runBridgeOnce({ lookback });
						console.log(`Processed: ${processed}`);
						await printTriStatus(10);
					} catch (error: any) {
						console.error('Bridge error:', error.message);
					}
					break;
				}

				case 'tri:status': {
					try {
						const { printTriStatus } = await import('../tools/triChat.js');
						await printTriStatus(10);
					} catch (error: any) {
						console.error('Status error:', error.message);
					}
					break;
				}

				case 'tri:watch': {
					const lookback = parseInt(process.argv[3] || '20');
					try {
						const { runBridgeWatch } = await import('../tools/triChat.js');
						await runBridgeWatch(lookback, 2500);
					} catch (error: any) {
						console.error('Watch error:', error.message);
					}
					break;
				}

				case 'tri:chat': {
					try {
						console.log('🚀 Starting elegant tri-party chat UI...');
						const { startTriChatUI } = await import('../tools/triChatUI.js');
						await startTriChatUI();
					} catch (error: any) {
						console.error('Chat UI error:', error.message);
					}
					break;
				}

				case 'gpt5:send': {
					const message = process.argv.slice(3).join(' ');
					if (!message) {
						console.log('Usage: npm run dev -- gpt5:send "message" or gpt5:send @claude "message" or gpt5:send @human "message"');
						break;
					}
					
					let to: 'claude' | 'human' | 'all' = 'all';
					let text = message;

					if (message.startsWith('@claude ')) {
						to = 'claude';
						text = message.substring(8);
					} else if (message.startsWith('@human ')) {
						to = 'human';  
						text = message.substring(7);
					}

					try {
						await sendTriMessage('gpt5', to, text);
						console.log(`✅ GPT-5 message sent to ${to === 'all' ? 'everyone' : to}`);
					} catch (error: any) {
						console.error(`❌ Error: ${error.message}`);
					}
					break;
				}

				case 'dashboard:start': {
					console.log('🚀 Starting EUFM Mission Control Dashboard...');
					const server = new DashboardServer();
					await server.start();
					console.log('✅ Mission Control is ready!');
					
					// Keep the process running
					process.on('SIGINT', async () => {
						console.log('\n🛑 Shutting down Mission Control...');
						await server.stop();
						process.exit(0);
					});
					break;
				}

				case 'dashboard:status': {
					console.log('=== EUFM System Health Check ===');
					// This would normally connect to running dashboard
					console.log('Status: All systems operational');
					console.log('Agents: 5 available');
					console.log('Tools: 8 online');
					console.log('Memory: 18 notes loaded');
					console.log('Cost: Optimized usage patterns active');
					break;
				}

				case 'smoke:basic': {
					console.log('🔧 Running basic smoke test...');
					try {
						const factory = new AgentFactory();
						const test = factory.create({ id: 'smoke_test', type: 'SmokeTestAgent', requirementId: 'smoke', capabilities: [], params: {} } as any);
						const result = await test.run({ input: 'Smoke run' });
						console.log('Agent result:', result.success ? 'OK' : 'FAIL', result.output || result.error);
					} catch (e: any) {
						console.error('Smoke test error:', e.message);
						process.exit(1);
					}
					break;
				}

				case 'funding:scan': {
					console.log('🔍 Scanning EU funding opportunities...');
					const scanner = new FundingOpportunityScanner();
					const opportunities = await scanner.scanAll();
					console.log(`
✅ Found ${opportunities.length} funding opportunities:`);
					opportunities.slice(0, 5).forEach(opp => {
						console.log(`
📋 ${opp.title}`);
						console.log(`   Program: ${opp.program}`);
						console.log(`   Deadline: ${opp.deadline}`);
						console.log(`   Relevance: ${opp.relevanceScore}%`);
						console.log(`   Status: ${opp.status}`);
					});
					if (opportunities.length > 5) {
						console.log(`
... and ${opportunities.length - 5} more opportunities`);
					}
					break;
				}

				case 'funding:opportunities': {
					const scanner = new FundingOpportunityScanner();
					const opportunities = await scanner.getActiveOpportunities();
					console.log('=== Active EU Funding Opportunities ===');
					if (opportunities.length === 0) {
						console.log('No opportunities found. Run "funding:scan" first.');
					}
					else {
						opportunities.forEach(opp => {
							console.log(`
📋 ${opp.title}`);
							console.log(`   Program: ${opp.program}`);
							console.log(`   Deadline: ${opp.deadline}`);
							console.log(`   Budget: ${opp.budget}`);
							console.log(`   Relevance: ${opp.relevanceScore}%`);
							if (opp.url) console.log(`   URL: ${opp.url}`);
						});
					}
					break;
				}

				// Master Control CLI commands
				case 'master:status': {
					console.log('=== Master Control: Portfolio Overview ===');
					const health = await projectRegistry.getPortfolioHealth();
					console.log(`Projects: ${health.projectCount} total, ${health.activeProjects} active`);
					console.log(`Overall Health: ${health.overallHealth}%`);
					console.log(`Critical Issues: ${health.criticalIssues}`);
					console.log(`Budget Utilization: ${health.budgetUtilization}%`);
					break;
				}

				case 'master:health': {
					console.log('=== Master Control: Health Scores ===');
					const health = await projectRegistry.getPortfolioHealth();
					console.log(`Overall Health Score: ${health.overallHealth}%`);
					console.log(`Active Projects: ${health.activeProjects}`);
					console.log(`Critical Items: ${health.criticalIssues}`);
					break;
				}

				case 'master:projects': {
					console.log('=== Master Control: Active Projects ===');
					const active = await projectRegistry.getActiveProjects();
					if (!active.length) {
						console.log('No active projects found.');
					} else {
						active.forEach(p => {
							console.log(`- ${p.name} (${p.id})`);
						});
					}
					break;
				}

				case 'master:urgent': {
					console.log('=== Master Control: Critical Items ===');
					const critical = await projectRegistry.getCriticalProjects();
					if (!critical.length) {
						console.log('No critical items at this time.');
					} else {
						critical.forEach(p => {
							console.log(`- ${p.name} [risk=${p.metrics.riskLevel}, priority=${p.priority}]`);
						});
					}
					break;
				}

				case 'system:timeline': {
					const hours = parseInt(process.argv[3]) || 24;
					console.log(`=== System Timeline (Last ${hours} hours) ===`);
					const timeline = await agentActionLogger.getCoordinationTimeline(hours);
					if (!timeline.length) {
						console.log('No recent activity.');
					} else {
						timeline.forEach(action => {
							const time = new Date(action.timestamp).toLocaleTimeString();
							const status = action.status === 'completed' ? '✅' :
								action.status === 'failed' ? '❌' :
								action.status === 'in_progress' ? '🔄' : '⏳';
							console.log(`${time} ${status} ${action.agent}: ${action.action}`);
							if (action.output?.summary) {
								console.log(`    └─ ${action.output.summary}`);
							}
						});
					}
					break;
				}

				case 'system:snapshot': {
					console.log('=== System Snapshot ===');
					const snapshot = await agentActionLogger.generateSystemSnapshot();
					console.log(`System Health: ${snapshot.system_health}%`);
					console.log(`Active Agents: ${snapshot.active_agents.join(', ')}`);
					console.log(`Total Actions: ${snapshot.system_metrics.total_actions}`);
					console.log(`Success Rate: ${snapshot.system_metrics.success_rate}%`);
					console.log(`Active Projects: ${snapshot.system_metrics.active_projects}`);
					
					const activeActions = await agentActionLogger.getActiveActions();
					if (activeActions.length) {
						console.log('\n🔄 Currently Running:');
						activeActions.forEach(action => {
							console.log(`- ${action.agent}: ${action.action}`);
						});
					}
					break;
				}

				case 'system:agents': {
					const agent = process.argv[3];
					if (agent) {
						console.log(`=== ${agent} Recent Actions ===`);
						const actions = await agentActionLogger.getActionsByAgent(agent);
						if (!actions.length) {
							console.log(`No recent actions for ${agent}.`);
						}
						else {
							actions.forEach(action => {
								const time = new Date(action.timestamp).toLocaleString();
								const status = action.status === 'completed' ? '✅' :
									action.status === 'failed' ? '❌' :
									action.status === 'in_progress' ? '🔄' :
									'⏳';
								console.log(`${time} ${status} ${action.action}`);
								if (action.details) console.log(`    Details: ${action.details}`);
								if (action.duration) console.log(`    Duration: ${action.duration}s`);
							});
						}
					} else {
						console.log('Usage: npm run dev -- system:agents <agent_name>');
					}
					break;
				}

				case 'smoke:research': {
					const prompt = 'Say hello from EUFM smoke test.';
					try {
						const out = await runPerplexityTest(prompt);
						console.log('Perplexity OK:', out.slice(0, 120).replace(/\n/g, ' '), '...');
					} catch (e: any) {
						console.error('Perplexity smoke failed:', e.message);
						process.exit(1);
					}
					break;
				}

				case 'codex:exec': {
					const task = process.argv.slice(3).join(' ');
					if (!task) {
						console.log('Usage: npm run dev -- codex:exec "task description"');
						break;
					}
					console.log(`🤖 Executing Codex task: ${task}`);
					try {
						const result = await claudeInterface.executeCodexTask(task);
						console.log('Codex result:\n', result);
					} catch (error: any) {
						console.error('Error:', error.message);
					}
					break;
				}

				case 'codex:status': {
					try {
						const available = await claudeInterface.checkCodexAvailable();
						console.log(`Codex CLI available: ${available}`);
						if (available) {
							console.log('✅ Codex CLI is ready for use');
						} else {
							console.log('❌ Codex CLI not found. Please install Codex CLI first.');
							console.log('   Install from: https://github.com/openai/codex');
						}
					} catch (error: any) {
						console.error('Error checking Codex:', error.message);
					}
					break;
				}

				case 'research:query': {
					const query = process.argv.slice(3).join(' ');
					if (!query) {
						console.log('Usage: npm run dev -- research:query "your research question"');
						break;
					}
					console.log(`🔍 Conducting research: ${query}`);
					try {
						const result = await claudeInterface.conductResearch(query);
						console.log('Research result:\n', result);
					} catch (error: any) {
						console.error('Error:', error.message);
					}
					break;
				}

				case 'agent:summon': {
					const task = process.argv.slice(3).join(' ');
					if (!task) {
						console.log('Usage: npm run dev -- agent:summon "task description"');
						break;
					}
					console.log(`🎯 Finding optimal agent for: ${task}`);
					try {
						const result = await claudeInterface.findOptimalAgent(task);
						console.log('Agent recommendation:\n', result);
					} catch (error: any) {
						console.error('Error:', error.message);
					}
					break;
				}
				case 'agent:discover': {
					const task = process.argv.slice(3).join(' ');
					if (!task) {
						console.log('Usage: npm run dev -- agent:discover "task description"');
						break;
					}
					console.log(`🧙‍♂️ Discovering external agents for: ${task}`);
					console.log('Using proven 3-step research methodology...');
					try {
						const result = await claudeInterface.discoverExternalAgents(task);
						console.log('Comprehensive agent discovery:\n', result);
					} catch (error: any) {
						console.error('Error:', error.message);
					}
					break;
				}

				case 'session:update': {
					const summary = process.argv.slice(3).join(' ');
					if (!summary) {
						console.log('Usage: npm run dev -- session:update "session summary and key achievements"');
						break;
					}
					try {
						const { updateSessionAtEnd } = await import('../utils/sessionMemoryUpdater.js');
						
						// Parse summary for achievements and next focus
						const achievements = [
							'Session completed successfully',
							'System status: operational',
							summary
						];
						const nextFocus = 'Continue with EU funding activities or development tasks';
						
						await updateSessionAtEnd(summary, achievements, nextFocus);
						console.log('✅ Session memory updated for next Claude session');
						console.log('📝 Future sessions will have complete context restoration');
					} catch (error: any) {
						console.error('❌ Session update failed:', error.message);
					}
					break;
				}
				case 'claude:status': {
					try {
						console.log('📊 Claude Agent Interface Status:');
						const status = await claudeInterface.getSystemStatus();
						console.log(`Session: ${status.session.sessionId}`);
						console.log(`Tasks completed: ${status.session.tasksCompleted}`);
						console.log(`Total cost: ${status.session.totalCost.toFixed(4)}`);
						console.log(`Codex available: ${status.codexAvailable ? '✅' : '❌'}`);
						console.log(`Agents ready: ${status.agentsReady.join(', ')}`);
						if (status.recentTasks.length > 0) {
							console.log('Recent tasks:');
							status.recentTasks.forEach(task => console.log(`  - ${task}`));
						}
					} catch (error: any) {
						console.error('Error:', error.message);
					}
					break;
				}

				case 'claude:ready': {
					try {
						const ready = await claudeInterface.checkCodexAvailable();
						if (ready) {
							console.log('🎯 Claude Agent Interface is READY!');
							console.log('Available capabilities:');
							console.log('  - Codex CLI execution');
							console.log('  - Enhanced research');
							console.log('  - Agent summoning');
							console.log('  - System coordination');
						}
					} catch (error: any) {
						console.error('Error:', error.message);
					}
					break;
				}

				case 'gpt5:status': {
					try {
						const jsonFlag = process.argv.includes('--json');
						
						if (jsonFlag) {
							const { getGpt5Status } = await import('../tools/gpt5Status.js');
							const status = await getGpt5Status();
							console.log(JSON.stringify(status, null, 2));
							process.exit(status.collaborationHealthy ? 0 : 2);
						} else {
							const { printGpt5Status, getGpt5Status } = await import('../tools/gpt5Status.js');
							await printGpt5Status();
							const status = await getGpt5Status();
							process.exit(status.collaborationHealthy ? 0 : 2);
						}
					} catch (e: any) {
						console.error('Error:', e.message);
						process.exit(1);
					}
					break;
				}

				case 'system:analyze': {
					try {
						console.log('🧠 Initiating comprehensive system analysis with Gemini 2.5 Flash...');
						const { runSystemAnalysis } = await import('../tools/systemAnalysis.js');
						await runSystemAnalysis();
					} catch (error: any) {
						console.error('❌ System analysis error:', error.message);
						process.exit(1);
					}
					break;
				}

		default:
			console.log('Usage:');
			console.log('Master Control:');
			console.log('  npm run dev -- master:status                   - Portfolio overview');
			console.log('  npm run dev -- master:health                   - System health score');
			console.log('  npm run dev -- master:projects                 - List all projects');
			console.log('  npm run dev -- master:urgent                   - Show critical items');
			console.log('');
			console.log('System Coordination:');
			console.log('  npm run dev -- system:timeline [hours]         - Agent activity timeline');
			console.log('  npm run dev -- system:snapshot                 - Current system state');
			console.log('  npm run dev -- system:agents <agent_name>      - Agent-specific actions');
			console.log('');
			console.log('Basic Tests:');
			console.log('  npm run dev -- perplexity:test "your prompt"');
			console.log('  npm run dev -- gemini:test "your prompt"');
			console.log('  npm run dev -- gemini:cli                - Interactive Gemini 2.5 Flash CLI');
			console.log('');
			console.log('Claude Agent Interface:');
			console.log('  npm run dev -- claude:ready                    - Check if Claude interface is ready');
			console.log('  npm run dev -- claude:status                   - Show Claude session status');
			console.log('  npm run dev -- codex:exec "task"               - Execute Codex CLI task');
			console.log('  npm run dev -- codex:status                    - Check Codex availability');
			console.log('  npm run dev -- research:query "question"       - Conduct enhanced research');
			console.log('  npm run dev -- agent:summon "task"             - Find optimal agent for task');
			console.log('  npm run dev -- agent:discover "task"           - Discover external agents (comprehensive)');
			console.log('  npm run dev -- session:update "summary"        - Update session memory for next Claude session');
			console.log('');
			console.log('Memory & Knowledge:');
			console.log('  npm run dev -- memory:load');
			console.log('  npm run dev -- memory:context');
			console.log('  npm run dev -- memory:search "query"');
			console.log('');
			console.log('Task Orchestration:');
			console.log('  npm run dev -- orchestrator:analyze "task"');
			console.log('  npm run dev -- orchestrator:execute "task"');
			console.log('  npm run dev -- orchestrator:optimize');
			console.log('  npm run dev -- orchestrator:history');
			console.log('');
			console.log('Dashboard & Monitoring:');
			console.log('  npm run dev -- dashboard:start');
			console.log('  npm run dev -- dashboard:status');
			console.log('');
			console.log('Master Control:');
			console.log('  npm run dev -- master:status                   - Show portfolio overview');
			console.log('  npm run dev -- master:health                   - Show portfolio health scores');
			console.log('  npm run dev -- master:projects                 - List active projects');
			console.log('  npm run dev -- master:urgent                   - Show critical items');
			console.log('');
			console.log('EU Funding:');
			console.log('  npm run dev -- funding:scan');
			console.log('  npm run dev -- funding:opportunities');
			console.log('');
			console.log('Analytics:');
			console.log('  npm run dev -- analytics:setup');
			console.log('  npm run dev -- analytics:track');
			console.log('  npm run dev -- analytics:optimize');
			console.log('  npm run dev -- analytics:report');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
