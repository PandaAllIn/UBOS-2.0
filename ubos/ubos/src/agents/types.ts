import { AgentSoul } from './memory/agentMemory';

export interface AgentCapabilities {
  canExecute: string[];
  requires: string[];
  produces: string[];
  costs: number; // credits per task
}

export type AgentStatus = 'idle' | 'working' | 'suspended' | 'upgrading';

export interface AgentState {
  id: string;
  type: string;
  soul: AgentSoul;
  status: AgentStatus;
  memory: Record<string, unknown>;
  credits: number;
  xp: number;
  level: number;
  lastActivity: number;
}

export interface Task {
  id?: string;
  type: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
  deadline?: string | number;
}

export interface TaskResult {
  success: boolean;
  data?: unknown;
  credits?: number;
  error?: string;
}

export interface AgentConfig {
  id?: string;
  soulId?: string;
  name?: string;
}

export interface AgentFilter {
  type?: string;
  status?: AgentStatus;
}

