import { randomUUID } from 'node:crypto';
import { AgentFactory } from '../orchestrator/agentFactory.js';
import type { AgentSpec } from '../orchestrator/types.js';
import type { ResultMessage } from '../protocols/messageTypes.js';
import { MessageBus } from '../messaging/messageBus.js';
import { AgentAdapter } from '../messaging/agentAdapter.js';
import { ResultAggregator } from '../aggregation/resultAggregator.js';

async function main() {
  const bus = new MessageBus();
  const factory = new AgentFactory();
  const aggregator = new ResultAggregator();
  const adapter = new AgentAdapter(bus);

  // Minimal demo specs using existing agents in repo
  const specs: AgentSpec[] = [
    {
      id: 'agent:smoke:1',
      type: 'SmokeTestAgent',
      requirementId: 'req:hello',
      capabilities: ['meta_analysis'],
    },
    {
      id: 'agent:memory:1',
      type: 'MemoryAgent',
      requirementId: 'req:memory',
      capabilities: ['memory'],
    },
  ];

  // Create and register agents on the bus
  for (const spec of specs) {
    const agent = factory.create(spec);
    adapter.register(agent, spec);
  }

  // Subscribe to all result topics and aggregate
  specs.forEach((s) => {
    bus.subscribe<ResultMessage>(`task.result/${s.requirementId}`, (msg) => {
      const result = msg?.body?.result;
      if (result) aggregator.add(result);
      console.log(`[result] ${s.requirementId}: ${result?.success ? 'OK' : 'ERR'}`);
    });
  });

  // Send tasks via bus and await replies (request/response)
  const taskId = randomUUID();
  // 1) Hello smoke test
  await bus.request<object, ResultMessage>(
    `task.assign/${specs[0].requirementId}`,
    {
      header: { type: 'task.assign', source: 'demo', timestamp: new Date().toISOString() },
      body: { taskId, requirementId: specs[0].requirementId, input: 'Say hello from EUFM demo.' },
    },
    { timeoutMs: 10000 }
  );

  // 2) Memory agent simple prompt
  await bus.request<object, ResultMessage>(
    `task.assign/${specs[1].requirementId}`,
    {
      header: { type: 'task.assign', source: 'demo', timestamp: new Date().toISOString() },
      body: { taskId, requirementId: specs[1].requirementId, input: 'Store a note: EUFM demo completed.' },
    },
    { timeoutMs: 10000 }
  );

  console.log('\n=== EUFM Demo Aggregated Summary ===');
  console.log(aggregator.summary());
}

main().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
