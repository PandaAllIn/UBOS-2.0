import type { BaseAgent, AgentRunOptions, AgentContext } from '../agents/premium/baseAgent.js';
import type { AgentResult } from '../orchestrator/types.js';
import { MessageBus } from './messageBus.js';
import { ResultMessage, MessageHeaderSchema } from '../protocols/messageTypes.js';
import { AgentSpec } from '../orchestrator/types.js';
import { MessageHeader } from '../protocols/messageTypes.js';
import { z } from 'zod';

// Define a schema for the incoming message to ensure type safety
const IncomingMessageSchema = z.object({
  header: MessageHeaderSchema.optional(),
  body: z.object({
    taskId: z.string(),
    requirementId: z.string(),
    input: z.string(),
    params: z.record(z.string(), z.unknown()).optional(),
    timeoutMs: z.number().optional(),
    dryRun: z.boolean().optional(),
  }).passthrough(), // Allow extra fields in body
}).passthrough(); // Allow extra fields in message

export class AgentAdapter {
  private unsubscribes: Array<() => void> = [];

  constructor(private readonly bus: MessageBus) {}

  register(agent: BaseAgent, spec: AgentSpec) {
    const topics = [
      `task.assign/${spec.requirementId}`,
      `task.assign/agent/${spec.id}`,
    ];

    const handler = async (rawMsg: unknown) => {
      let header: MessageHeader | undefined;
      let body: z.infer<typeof IncomingMessageSchema>['body'];
      let result: AgentResult;

      try {
        // Validate incoming message
        const parsedMsg = IncomingMessageSchema.parse(rawMsg);
        header = parsedMsg.header;
        body = parsedMsg.body;

        const { taskId, requirementId, input, params, timeoutMs, dryRun } = body;

        // Ensure required fields are present after parsing
        if (!taskId || !requirementId || typeof input !== 'string') {
          throw new Error('Invalid task message: missing taskId, requirementId, or input');
        }

        try {
          result = await agent.run(
            { input, timeoutMs, dryRun } as AgentRunOptions,
            { shared: params || {} } as AgentContext
          );
          // Ensure success is explicitly true if no error
          if (result.success === undefined) result.success = true;
        } catch (err: unknown) {
          result = {
            agentId: agent.id,
            requirementId,
            success: false,
            output: '', // Explicitly empty text output on error
            error: (err as Error)?.message || 'Unknown error',
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
        if (header?.correlationId) {
          this.bus.reply(header.correlationId, resMsg);
        }
      } catch (outerError: unknown) {
        console.error(`AgentAdapter: Error processing message for agent ${agent.id}:`, outerError);
        // Attempt to send a failure result if possible
        const failedTaskId = (rawMsg as { body?: { taskId?: string } })?.body?.taskId || 'unknown';
        const failedRequirementId = (rawMsg as { body?: { requirementId?: string } })?.body?.requirementId || 'unknown';
        const failureResult: AgentResult = {
          agentId: agent.id,
          requirementId: failedRequirementId,
          success: false,
          output: '',
          error: (outerError as Error)?.message || 'Unknown adapter error',
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        };
        const failMsg: ResultMessage = {
          header: {
            type: 'task.result',
            source: agent.type,
            timestamp: new Date().toISOString(),
            correlationId: (rawMsg as { header?: { correlationId?: string } })?.header?.correlationId,
          },
          body: { taskId: failedTaskId, requirementId: failedRequirementId, result: failureResult },
        };
        // Try to publish and reply the failure, but don't re-throw
        try {
          this.bus.publishResult(`task.result/${failedRequirementId}`, failMsg);
          if ((rawMsg as { header?: { correlationId?: string } })?.header?.correlationId) {
            this.bus.reply((rawMsg as { header: { correlationId: string } }).header.correlationId, failMsg);
          }
        } catch (publishError) {
          console.error('AgentAdapter: Failed to publish error message:', publishError);
        }
      }
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
