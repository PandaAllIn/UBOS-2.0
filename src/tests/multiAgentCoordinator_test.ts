import { MultiAgentCoordinator } from '../utils/multiAgentCoordinator.js';
import { MessageBus } from '../messaging/messageBus.js';
import { AgentFactory } from '../orchestrator/agentFactory.js';
import type { AgentSpec } from '../orchestrator/types.js';

async function runCoordinatorDemo() {
  const bus = new MessageBus();
  const coordinator = new MultiAgentCoordinator(bus);

  const specs: AgentSpec[] = [
    { id: 'smoke-1', type: 'SmokeTestAgent', requirementId: 'req:hello', capabilities: ['meta_analysis'] },
    { id: 'test-1', type: 'TestAgent', requirementId: 'req:test', capabilities: ['memory'], params: { note: 'from-multiAgent-demo' } },
  ];

  coordinator.registerAgents(specs);

  const inputs = {
    'req:hello': 'Say hello from MultiAgentCoordinator test.',
    'req:test': 'Echo this input and context.',
  };

  const summary = await coordinator.execute({ agents: specs, inputs, timeoutMs: 10_000, concurrency: 2 });

  // eslint-disable-next-line no-console
  console.log('\n=== MultiAgentCoordinator Summary ===');
  // eslint-disable-next-line no-console
  console.log(`Success: ${summary.success}`);
  // eslint-disable-next-line no-console
  console.log(`Results: ${summary.results.length}, Errors: ${summary.errors.length}`);

  if (!summary.success) throw new Error('Coordinator summary unsuccessful');
}

async function runCoordinationAgentDemo() {
  const factory = new AgentFactory();

  const subAgents: AgentSpec[] = [
    { id: 'smoke-2', type: 'SmokeTestAgent', requirementId: 'req:hello2', capabilities: ['meta_analysis'] },
    { id: 'test-2', type: 'TestAgent', requirementId: 'req:test2', capabilities: ['memory'], params: { note: 'from-coordination-agent' } },
  ];

  const inputs = {
    'req:hello2': 'Hello from CoordinationAgent demo.',
    'req:test2': 'Please echo cleanly.',
  };

  const agentSpec: AgentSpec = {
    id: 'coord-1',
    type: 'CoordinationAgent',
    requirementId: 'req:coord',
    capabilities: ['meta_analysis'],
  };

  const agent = factory.create(agentSpec);
  const res = await agent.run(
    { input: 'Coordinate agents', timeoutMs: 15_000 },
    { shared: { agents: subAgents, inputs } }
  );

  // eslint-disable-next-line no-console
  console.log('\n=== CoordinationAgent Result ===');
  // eslint-disable-next-line no-console
  console.log(res.output);
  if (!res.success) throw new Error('CoordinationAgent failed');
}

// Allow running directly with `tsx src/tests/multiAgentCoordinator_test.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await runCoordinatorDemo();
      await runCoordinationAgentDemo();
      // eslint-disable-next-line no-console
      console.log('\nAll coordination demos passed.');
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Coordination demos failed:', err?.message || err);
      process.exitCode = 1;
    }
  })();
}

