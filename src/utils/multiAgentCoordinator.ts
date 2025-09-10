import { randomUUID } from 'node:crypto';
import type { AgentResult, AgentSpec } from '../orchestrator/types.js';
import { MessageBus } from '../messaging/messageBus.js';
import { AgentAdapter } from '../messaging/agentAdapter.js';
import { AgentFactory } from '../orchestrator/agentFactory.js';

export interface CoordinationPlan {
  taskId?: string;
  agents: AgentSpec[];
  inputs: Record<string, string>; // requirementId -> input
  timeoutMs?: number;
  concurrency?: number;
  dryRun?: boolean;
}

export interface CoordinationResultSummary {
  taskId: string;
  results: AgentResult[];
  success: boolean;
  errors: string[];
}

/**
 * MultiAgentCoordinator
 * - Registers agents on a local in-memory MessageBus
 * - Dispatches tasks to agents by requirementId
 * - Gathers results and aggregates success/errors
 */
export class MultiAgentCoordinator {
  private readonly bus: MessageBus;
  private readonly adapter: AgentAdapter;
  private readonly factory = new AgentFactory();
  private disposables: Array<() => void> = [];

  constructor(bus?: MessageBus) {
    this.bus = bus ?? new MessageBus();
    this.adapter = new AgentAdapter(this.bus);
  }

  /** Register and wire up agents to the bus */
  registerAgents(specs: AgentSpec[]) {
    for (const spec of specs) {
      const agent = this.factory.create(spec);
      this.adapter.register(agent, spec);
    }
  }

  /**
   * Execute the plan and return aggregated results.
   * Uses request/reply to await each agent’s result with optional concurrency.
   */
  async execute(plan: CoordinationPlan): Promise<CoordinationResultSummary> {
    const taskId = plan.taskId ?? randomUUID();
    const timeoutMs = plan.timeoutMs ?? 15_000;
    const concurrency = plan.concurrency && plan.concurrency > 0 ? plan.concurrency : Math.min(4, plan.agents.length || 1);

    const queue = [...plan.agents];
    const results: AgentResult[] = [];
    const errors: string[] = [];

    const runForSpec = async (spec: AgentSpec) => {
      const input = plan.inputs[spec.requirementId] ?? '';
      try {
        const res: any = await this.bus.request(
          `task.assign/${spec.requirementId}`,
          {
            header: { type: 'task.assign', source: 'MultiAgentCoordinator', timestamp: new Date().toISOString() },
            body: {
              taskId,
              requirementId: spec.requirementId,
              input,
              params: spec.params ?? {},
              timeoutMs,
              dryRun: plan.dryRun,
            },
          },
          { timeoutMs }
        );
        const result: AgentResult | undefined = res?.body?.result;
        if (result) results.push(result);
        else errors.push(`No result from ${spec.type}/${spec.id}`);
      } catch (err: any) {
        errors.push(`${spec.type}/${spec.id} failed: ${err?.message || String(err)}`);
      }
    };

    const active: Promise<void>[] = [];
    while (queue.length > 0 || active.length > 0) {
      while (active.length < concurrency && queue.length > 0) {
        const spec = queue.shift()!;
        const p = runForSpec(spec).finally(() => {
          const idx = active.indexOf(p as any);
          if (idx >= 0) active.splice(idx, 1);
        });
        active.push(p as any);
      }
      if (active.length > 0) {
        await Promise.race(active).catch(() => {});
      }
    }

    const success = results.length > 0 && results.every((r) => r.success) && errors.length === 0;
    return { taskId, results, success, errors };
  }

  dispose() {
    try { this.adapter.dispose(); } catch {}
    this.disposables.forEach((d) => {
      try { d(); } catch {}
    });
    this.disposables = [];
  }
}

