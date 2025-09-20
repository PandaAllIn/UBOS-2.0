import { AgentFactory } from '../orchestrator/agentFactory.js';
import type { AgentSpec, AgentResult } from '../orchestrator/types.js';

/**
 * Simple integration demo: constructs a TestAgent via AgentFactory and runs it.
 * Safe to run without external APIs or network.
 */
export async function runAgentIntegrationDemo(input: string): Promise<AgentResult> {
  const factory = new AgentFactory();

  const spec: AgentSpec = {
    id: 'agent-test-1',
    type: 'TestAgent',
    requirementId: 'req-demo-1',
    capabilities: ['memory'],
    params: { note: 'integration-smoke' },
  };

  const agent = factory.create(spec);
  const ctx = { workingDir: process.cwd(), shared: { demo: true } };
  return agent.run({ input, timeoutMs: 5_000, userId: 'test-user' }, ctx);
}

// Allow running directly with `tsx src/tests/eufm_integration_test.ts "hello"`
if (typeof require !== 'undefined' && require.main === module) {
  const input = process.argv.slice(2).join(' ') || 'Hello from EUFM integration test!';
  (async () => {
    try {
      console.info('[EUFM] Starting agent integration demo...');
      const res = await runAgentIntegrationDemo(input);
      console.info('[EUFM] Agent finished. Result:');
      console.log(JSON.stringify(res, null, 2));
      if (!res.success) process.exitCode = 1;
    } catch (err: unknown) {
      console.error('[EUFM] Integration demo error:', (err as Error)?.message || err);
      process.exitCode = 1;
    }
  })();
}
