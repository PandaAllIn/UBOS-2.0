import { AgentFactory } from '../orchestrator/agentFactory.js';
import type { AgentSpec } from '../orchestrator/types.js';

export async function run(): Promise<void> {
  const factory = new AgentFactory();
  const spec: AgentSpec = {
    id: 'ubos-design-1',
    type: 'UBOSDesignSpecAgent',
    requirementId: 'req-ubos-design',
    capabilities: ['meta_analysis'],
    params: {}
  };
  const agent = factory.create(spec);
  const res = await agent.run({ input: 'get dashboard spec', timeoutMs: 5_000 });
  console.log('[UBOSDesignSpecAgent] success=', res.success);
  if (!res.success) {
    console.error(res.error || res.output);
    process.exitCode = 1;
  } else {
    console.log('Spec keys:', Object.keys(res.artifacts?.spec ?? {}));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch(err => {
    console.error('Test error:', err?.message || err);
    process.exitCode = 1;
  });
}

