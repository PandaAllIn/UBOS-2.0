import { AgentResult, OrchestrationPlan } from './types.js';
import { AgentFactory } from './agentFactory.js';

export interface ExecutionOptions {
  dryRun?: boolean;
  timeoutMs?: number;
  concurrency?: number; // max agents in parallel
}

export class ExecutionCoordinator {
  private factory = new AgentFactory();

  async execute(plan: OrchestrationPlan, inputByReq: Record<string, string>, options: ExecutionOptions = {}): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    const ctxShared: Record<string, unknown> = {};
    const concurrency = options.concurrency ?? Math.min(4, plan.parallelBatches.flat().length || 1);

    for (const batch of plan.parallelBatches) {
      // Throttle within batch to configured concurrency
      const queue = [...batch];
      const active: Promise<void>[] = [];
      const runOne = async (reqId: string) => {
        const specs = plan.agentSpecs.filter((a) => a.requirementId === reqId);
        for (const spec of specs) {
          const agent = await this.factory.create(spec);
          const out = await agent.run({ input: inputByReq[reqId], timeoutMs: options.timeoutMs, dryRun: options.dryRun }, { shared: { ...ctxShared, ...(spec.params || {}) } });
          results.push(out);
          // Simple knowledge sharing: stash outputs by requirement
          ctxShared[`out_${reqId}_${spec.type}`] = out.output;
          if (!out.success) break; // leave early if agent in this requirement failed
        }
      };

      while (queue.length > 0 || active.length > 0) {
        while (active.length < concurrency && queue.length > 0) {
          const reqId = queue.shift()!;
          const p = runOne(reqId).finally(() => {
            const i = active.indexOf(p);
            if (i >= 0) active.splice(i, 1);
          });
          active.push(p);
        }
        await Promise.race(active).catch(() => {});
      }
    }

    return results;
  }
}

