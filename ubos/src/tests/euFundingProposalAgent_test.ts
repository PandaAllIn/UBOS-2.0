import { AgentFactory } from '../orchestrator/agentFactory.js';
import type { AgentSpec, AgentResult } from '../orchestrator/types.js';

async function runOnce(input: string, dryRun: boolean): Promise<AgentResult> {
  const factory = new AgentFactory();
  const spec: AgentSpec = {
    id: `agent-proposal-${dryRun ? 'dry' : 'run'}`,
    type: 'EUFundingProposalAgent',
    requirementId: 'req-proposal-1',
    capabilities: ['memory'],
  };
  const agent = factory.create(spec);
  const ctx = { workingDir: process.cwd(), shared: { test: true } };
  return agent.run({ input, timeoutMs: 15_000, dryRun }, ctx);
}

export async function runEUProposalAgentDemo(): Promise<void> {
  const input = 'Horizon Europe green hydrogen pilot [programme:Horizon Europe] [beneficiary:Consortium]';
  console.info('[EUFM] EUFundingProposalAgent demo starting...');
  const dry = await runOnce(input, true);
  console.info('[EUFM] Dry run result:', dry.success ? 'ok' : 'failed');
  const real = await runOnce(input, false);
  console.info('[EUFM] Real run success:', real.success);
  console.log(JSON.stringify({ dry, real }, null, 2));
  if (!dry.success || !real.success) process.exitCode = 1;
}

// Allow running directly with `tsx src/tests/euFundingProposalAgent_test.ts`
if (typeof require !== 'undefined' && require.main === module) {
  runEUProposalAgentDemo().catch((err) => {
    console.error('[EUFM] EUFundingProposalAgent demo error:', err?.message || err);
    process.exitCode = 1;
  });
}
