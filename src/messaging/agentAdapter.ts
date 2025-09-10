import type { BaseAgent } from '../agents/baseAgent.js';
import type { AgentSpec, AgentResult } from '../orchestrator/types.js';
import type { MessageHeader, TaskMessage, ResultMessage } from '../protocols/messageTypes.js';
import { MessageBus } from './messageBus.js';

export class AgentAdapter {
  private unsubscribes: Array<() => void> = [];

  constructor(private readonly bus: MessageBus) {}

  register(agent: BaseAgent, spec: AgentSpec) {
    const topics = [
      `task.assign/${spec.requirementId}`,
      `task.assign/agent/${spec.id}`,
    ];

    const handler = async (msg: any) => {
      // Expect TaskMessage shape
      const header: MessageHeader | undefined = msg?.header;
      const body = msg?.body ?? {};
      const { taskId, requirementId, input, params, timeoutMs, dryRun } = body;
      if (!taskId || !requirementId || typeof input !== 'string') return;

      let result: AgentResult;
      try {
        result = await agent.run(
          { input, timeoutMs, dryRun },
          { shared: params || {} }
        );
      } catch (err: any) {
        result = {
          agentId: agent.id,
          requirementId,
          success: false,
          output: '',
          error: err?.message || 'Unknown error',
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        };
      }

      const resMsg: ResultMessage = {
        header: {
          type: 'task.result',
          source: agent.type,
          timestamp: new Date().toISOString(),
          correlationId: header?.correlationId,
        },
        body: { taskId, requirementId, result },
      };

      this.bus.publishResult(`task.result/${requirementId}`, resMsg);
      // Also reply if correlation requested
      this.bus.reply(header?.correlationId, resMsg);
    };

    topics.forEach((t) => {
      const unsub = this.bus.subscribe(t, handler);
      this.unsubscribes.push(unsub);
    });
  }

  dispose() {
    this.unsubscribes.forEach((u) => u());
    this.unsubscribes = [];
  }
}

