import { BaseAgent, AgentRunOptions, AgentFeature } from './baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { repoPath, repoRoot } from '../../utils/paths.js';

// Context7-guided: Spec-Kit Codex agent feature definition
const specKitCodexFeature: AgentFeature = {
  type: 'spec-kit-codex',
  capabilities: ['spec-automation', 'task-synchronization', 'codex-integration', 'project-orchestration'],
  requirements: { tools: ['spec-kit', 'codex-cli', 'uv'] }
};

const execAsync = promisify(exec);

export interface SpecKitTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed';
  assignedAgent: 'codex' | 'claude' | 'gemini';
}

export interface SpecKitProject {
  name: string;
  description: string;
  tasks: SpecKitTask[];
  specPath: string;
  planPath: string;
}

export class SpecKitCodexAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'spec-kit-codex') {
    super(id, requirementId, specKitCodexFeature);
  }

  get type(): string { return 'spec-kit-codex'; } 

  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      const { input } = opts;

      if (input.includes('automate') && input.includes('spec')) {
        return await this.automateSpecToCodex();
      }

      if (input.includes('sync') && input.includes('tasks')) {
        return await this.syncTasksFromSpec();
      }

      if (input.includes('execute') && input.includes('queue')) {
        return await this.executeTaskQueue();
      }

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: 'Unsupported Spec-Kit Codex operation. Supported: automate spec, sync tasks, execute queue',
        startedAt,
        finishedAt: this.getNow()
      };

    } catch (error: unknown) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: (error as Error)?.message || String(error),
        startedAt,
        finishedAt: this.getNow()
      };
    } // This is a comment
  }

  private async automateSpecToCodex(): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      // Find all spec directories with Spec-Kit configuration
      const monetizationProjects = [
        'orchestration-saas',
        'tri-party-platform', 
        'reasoning-service',
        'research-command'
      ];

      const automatedProjects: SpecKitProject[] = [];

      for (const project of monetizationProjects) {
        const projectPath = repoPath('monetization-projects', project);
        const specPath = `${projectPath}/specs`;
        const planPath = `${projectPath}/plan.md`;

        try {
          // Check if project has spec files
          await fs.access(specPath);
          
          // Run spec-kit plan to generate tasks
          const { stdout: planOutput } = await execAsync(
            `cd "${projectPath}" && uvx spec-kit plan`,
            { timeout: 30000 }
          );

          // Parse tasks from plan output
          const tasks = await this.parseTasksFromPlan(planOutput);
          
          automatedProjects.push({
            name: project,
            description: `Automated ${project} implementation`,
            tasks,
            specPath,
            planPath
          });

          // Auto-assign high priority tasks to Codex
          await this.assignTasksToCodex(tasks, project);

        } catch (error: unknown) {
          console.log(`Skipping ${project}: ${(error as Error).message}`);
        }
      }

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output: `Automated ${automatedProjects.length} projects with spec-kit → codex integration`,
        artifacts: {
          automatedProjects,
          totalTasks: automatedProjects.reduce((sum, p) => sum + p.tasks.length, 0),
          codexTasks: automatedProjects.reduce((sum, p) => 
            sum + p.tasks.filter(t => t.assignedAgent === 'codex').length, 0
          )
        },
        startedAt,
        finishedAt: this.getNow()
      };

    } catch (error: unknown) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: (error as Error)?.message || String(error),
        startedAt,
        finishedAt: this.getNow()
      };
    }
  }

  private async executeTaskQueue(): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      const queuePath = '/tmp/codex-task-queue.json';
      
      let queue: { status: string, prompt: string, result: string, error: string }[] = [];
      try {
        const queueData = await fs.readFile(queuePath, 'utf-8');
        queue = JSON.parse(queueData);
      } catch {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: 'No tasks in queue',
          artifacts: { executed: 0 },
          startedAt,
          finishedAt: this.getNow()
        };
      }

      const queuedTasks = queue.filter(task => task.status === 'queued');
      const executedTasks = [];

      // Execute up to 3 tasks at once
      for (const task of queuedTasks.slice(0, 3)) {
        try {
          // Execute via Codex CLI
          const { stdout } = await execAsync(
            `npm run dev -- codex:exec "${task.prompt}"`,
            {
              timeout: 300000, // 5 minute timeout
              cwd: repoRoot()
            }
          );

          task.status = 'completed';
          task.result = stdout;
          executedTasks.push(task);

        } catch (error: unknown) {
          task.status = 'failed';
          task.error = (error as Error)?.message || String(error);
          executedTasks.push(task);
        }
      }

      // Update queue
      await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output: `Executed ${executedTasks.length} Codex tasks from spec-kit automation`,
        artifacts: {
          executed: executedTasks.length,
          successful: executedTasks.filter(t => t.status === 'completed').length,
          failed: executedTasks.filter(t => t.status === 'failed').length,
          results: executedTasks
        },
        startedAt,
        finishedAt: this.getNow()
      };

    } catch (error: unknown) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: (error as Error)?.message || String(error),
        startedAt,
        finishedAt: this.getNow()
      };
    }
  }

  private async syncTasksFromSpec(): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      // Sync tasks from all active monetization projects
      const projects = await this.getAllSpecProjects();
      const syncResults = [];

      for (const project of projects) {
        try {
          const { stdout } = await execAsync(
            `cd "${project.path}" && uvx spec-kit tasks`,
            { timeout: 15000 }
          );

          const tasks = await this.parseTasksFromPlan(stdout);
          syncResults.push({
            project: project.name,
            tasksFound: tasks.length,
            newTasks: tasks.filter(t => t.status === 'pending').length
          });

        } catch (error: unknown) {
          syncResults.push({
            project: project.name,
            error: (error as Error)?.message || String(error)
          });
        }
      }

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output: `Synced tasks from ${projects.length} spec-kit projects`,
        artifacts: { syncResults },
        startedAt,
        finishedAt: this.getNow()
      };

    } catch (error: unknown) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: (error as Error)?.message || String(error),
        startedAt,
        finishedAt: this.getNow()
      };
    }
  }

  private async getAllSpecProjects(): Promise<{ name: string; path: string }[]> {
    const basePath = repoPath('monetization-projects');
    const projects = [];

    try {
      const entries = await fs.readdir(basePath);
      
      for (const entry of entries) {
        const projectPath = path.join(basePath, entry);
        const stat = await fs.stat(projectPath);
        
        if (stat.isDirectory()) {
          // Check if it has spec-kit configuration
          try {
            await fs.access(path.join(projectPath, 'specs'));
            projects.push({ name: entry, path: projectPath });
          } catch {
            // Not a spec-kit project
          }
        }
      }
    } catch (error: unknown) {
      console.error('Error reading projects:', error);
    }

    return projects;
  }

  // Helper method to parse tasks from spec-kit plan output
  private async parseTasksFromPlan(planOutput: string): Promise<SpecKitTask[]> {
    // Simple implementation - parse basic task structure from output
    const tasks: SpecKitTask[] = [];
    try {
      // Extract task-like patterns from the output
      const lines = planOutput.split('\n');
      let currentTask: Partial<SpecKitTask> = {};

      for (const line of lines) {
        if (line.includes('Task:') || line.includes('task:')) {
          if (currentTask.title) {
            tasks.push(currentTask as SpecKitTask);
          }
          currentTask = { assignedAgent: 'codex' as const };
          currentTask.title = line.replace(/[Tt]ask:?\s*/, '').trim();
        } else if (line.includes('priority') || line.includes('Priority')) {
          if (line.toLowerCase().includes('high')) currentTask.priority = 'high';
          else if (line.toLowerCase().includes('low')) currentTask.priority = 'low';
          else currentTask.priority = 'medium';
        }
      }

      if (currentTask.title) {
        currentTask.status = 'pending';
        currentTask.id = 'system';
        currentTask.description = currentTask.title;
        currentTask.estimatedHours = 4;
        currentTask.dependencies = [];
        tasks.push(currentTask as SpecKitTask);
      }
    } catch (error) {
      console.error('Failed to parse tasks:', error);
    }

    return tasks;
  }

  // Helper method to assign tasks to Codex
  private async assignTasksToCodex(tasks: SpecKitTask[], project: string): Promise<void> {
    console.log(`Assigning ${tasks.length} tasks to Codex for project: ${project}`);
    // Simple implementation - mark tasks as assigned
    tasks.forEach(task => {
      if (!task.assignedAgent) {
        task.assignedAgent = 'codex';
      }
    });
  }
}
