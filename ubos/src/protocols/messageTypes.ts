import { z } from 'zod';
import type { AgentResult } from '../orchestrator/types.js';

export const MessageHeaderSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string(),
  source: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  correlationId: z.string().optional(),
});

export type MessageHeader = z.infer<typeof MessageHeaderSchema>;

export const TaskMessageSchema = z.object({
  header: MessageHeaderSchema,
  body: z.object({
    taskId: z.string(),
    requirementId: z.string(),
    input: z.string(),
    params: z.record(z.string(), z.any()).optional(),
    timeoutMs: z.number().int().positive().optional(),
    dryRun: z.boolean().optional(),
  }),
});

export type TaskMessage = z.infer<typeof TaskMessageSchema>;

export const ResultMessageSchema = z.object({
  header: MessageHeaderSchema,
  body: z.object({
    taskId: z.string(),
    requirementId: z.string(),
    result: z.any(),
  }),
});

export type ResultMessage = z.infer<typeof ResultMessageSchema>;

export const BusEventSchema = z.object({
  header: MessageHeaderSchema,
  body: z.object({
    event: z.string(),
    data: z.record(z.string(), z.any()).optional(),
  }),
});

export type BusEventMessage = z.infer<typeof BusEventSchema>;

export type BusTopic =
  | `task.assign/${string}`
  | `task.assign/agent/${string}`
  | `task.result/${string}`
  | `events/${string}`
  | string;
