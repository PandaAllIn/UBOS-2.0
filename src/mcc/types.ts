import { z } from 'zod';

export const ProjectId = z.string().min(1);

export const ProjectConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(10).default(5),
  maxConcurrency: z.number().int().min(1).max(8).default(2),
  dailyBudgetUSD: z.number().min(0).default(0),
  schedule: z.object({
    enabled: z.boolean().default(true),
    timezone: z.string().default('UTC'),
    // hh:mm-hh:mm 24h format windows; empty => always allowed
    windows: z.array(z.string()).default([]),
  }).default({ enabled: true, timezone: 'UTC', windows: [] }),
  metadata: z.record(z.any()).default({}),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export const ProjectStatusSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  activeTasks: z.number().int().nonnegative().default(0),
  completedTasks: z.number().int().nonnegative().default(0),
  failedTasks: z.number().int().nonnegative().default(0),
  todayCostUSD: z.number().nonnegative().default(0),
});

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export const ScheduledTaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  description: z.string(),
  priority: z.number().int().min(1).max(10).default(5),
  notBefore: z.string().optional(), // ISO datetime
  createdAt: z.string(),
  state: z.enum(['queued', 'running', 'completed', 'failed', 'canceled']).default('queued'),
  attempts: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().min(1).max(5).default(2),
  lastError: z.string().optional(),
});

export type ScheduledTask = z.infer<typeof ScheduledTaskSchema>;

export interface RunRecord {
  taskId: string;
  projectId: string;
  startedAt: string;
  finishedAt: string;
  success: boolean;
  summary: string;
  orchestratorRunPath?: string;
  costUSD?: number;
}

