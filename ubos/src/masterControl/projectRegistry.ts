import { promises as fs } from 'fs';
import path from 'path';
import { repoPath } from '../utils/paths.js';

export interface ProjectMetadata {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'planned';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  budget: {
    allocated: number;
    spent: number;
    currency: string;
    target?: number;
  };
  timeline: {
    startDate: string;
    endDate?: string;
    milestones: Array<{
      name: string;
      date: string;
      status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    }>;
  };
  resources: {
    agents: string[];
    computeAllocation: number; // Percentage of total resources
    apiCredits: number;
    teamMembers: string[];
  };
  metrics: {
    healthScore: number; // 0-100
    progressPercentage: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    lastUpdated: string;
  };
  dependencies: {
    dependsOn: string[]; // Other project IDs
    blockedBy: string[];
    synergiesWith: string[];
  };
  automatedTasks: Array<{
    id: string;
    description: string;
    schedule: string; // cron format
    agent: string;
    lastRun?: string;
    nextRun: string;
    status: 'active' | 'paused' | 'error';
  }>;
  location: {
    baseDirectory: string;
    configFile: string;
    logsDirectory: string;
  };
}

export class ProjectRegistry {
  private registryPath: string;
  private projectsData: Map<string, ProjectMetadata> = new Map();
  private initializationPromise: Promise<void> | null = null;
  private isInitialized = false;

  constructor() {
    this.registryPath = path.join('logs', 'master_control', 'project_registry.json');
    // Kick off async initialization and keep a handle to await later
    this.initializationPromise = this.initializeRegistry();
  }

  private async initializeRegistry(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
      
      // Try to load existing registry
      try {
        const data = await fs.readFile(this.registryPath, 'utf-8');
        const projects = JSON.parse(data);
        this.projectsData = new Map(Object.entries(projects));
      } catch (readError: unknown) {
        if ((readError as { code: string }).code !== 'ENOENT') {
          console.error('❌ Failed to read existing project registry:', readError);
          // If file exists but is corrupted, we start fresh but log the error
        }
        // Registry doesn't exist or is corrupted, create with default projects
        await this.createDefaultProjects();
      }
      this.isInitialized = true;
    } catch (error: unknown) {
      console.error('❌ Failed to initialize project registry (mkdir or initial read):', error);
      throw error; // Re-throw to indicate a critical initialization failure
    }
  }

  private async createDefaultProjects(): Promise<void> {
    // Note: during initialization, avoid calling public methods to prevent re-entrancy
    const xfProject: ProjectMetadata = {
      id: 'xf_production',
      name: 'XF Production System',
      description: 'Proven AI agent system with €6M track record',
      status: 'active',
      priority: 'P1',
      budget: {
        allocated: 6000000,
        spent: 6000000,
        currency: 'EUR'
      },
      timeline: {
        startDate: '2024-01-01',
        milestones: [
          {
            name: 'System Deployment',
            date: '2024-06-01',
            status: 'completed'
          },
          {
            name: 'Production Validation',
            date: '2024-12-01',
            status: 'completed'
          }
        ]
      },
      resources: {
        agents: ['AgentSummoner', 'MissionControl', 'ResearchAgent'],
        computeAllocation: 40,
        apiCredits: 50000,
        teamMembers: ['Core Team']
      },
      metrics: {
        healthScore: 98,
        progressPercentage: 100,
        riskLevel: 'low',
        lastUpdated: new Date().toISOString()
      },
      dependencies: {
        dependsOn: [],
        blockedBy: [],
        synergiesWith: ['eufm_funding']
      },
      automatedTasks: [
        {
          id: 'xf_health_check',
          description: 'Daily system health monitoring',
          schedule: '0 6 * * *',
          agent: 'SystemMonitor',
          nextRun: this.getNextCronRun('0 6 * * *'),
          status: 'active'
        }
      ],
      location: {
        baseDirectory: repoPath('eufm', 'docs', 'xf'),
        configFile: 'mission_control.py',
        logsDirectory: repoPath('logs', 'xf')
      }
    };

    // EUFM Funding Project
    const eufmProject: ProjectMetadata = {
      id: 'eufm_funding',
      name: 'EUFM EU Funding Acquisition',
      description: 'Secure €2M+ EU funding for EUFM infrastructure scaling',
      status: 'active',
      priority: 'P0',
      budget: {
        allocated: 100000,
        spent: 27000,
        currency: 'EUR',
        target: 2000000
      },
      timeline: {
        startDate: '2025-09-01',
        endDate: '2025-12-31',
        milestones: [
          {
            name: 'Agent Summoner Deployment',
            date: '2025-09-06',
            status: 'completed'
          },
          {
            name: 'EU Funding Strategy',
            date: '2025-09-06',
            status: 'completed'
          },
          {
            name: 'Horizon Europe Application',
            date: '2025-09-18',
            status: 'in_progress'
          },
          {
            name: 'Funding Decision',
            date: '2025-12-15',
            status: 'pending'
          }
        ]
      },
      resources: {
        agents: ['AgentSummoner', 'EUFundingProposal', 'EnhancedAbacus', 'CodexCLI'],
        computeAllocation: 50,
        apiCredits: 25000,
        teamMembers: ['Core Team', 'EU Consortium']
      },
      metrics: {
        healthScore: 92,
        progressPercentage: 65,
        riskLevel: 'medium',
        lastUpdated: new Date().toISOString()
      },
      dependencies: {
        dependsOn: [],
        blockedBy: [],
        synergiesWith: ['xf_production']
      },
      automatedTasks: [
        {
          id: 'eu_funding_scan',
          description: 'Daily EU funding opportunity scan',
          schedule: '0 4 * * *',
          agent: 'AgentSummoner',
          nextRun: this.getNextCronRun('0 4 * * *'),
          status: 'active'
        },
        {
          id: 'deadline_monitor',
          description: 'Critical deadline monitoring',
          schedule: '0 8 * * *',
          agent: 'ProjectMonitor',
          nextRun: this.getNextCronRun('0 8 * * *'),
          status: 'active'
        }
      ],
      location: {
        baseDirectory: repoPath(),
        configFile: 'eufm/docs/agents/CLAUDE_SESSION_MEMORY.md',
        logsDirectory: repoPath('logs')
      }
    };

    this.projectsData.set(xfProject.id, xfProject);
    this.projectsData.set(eufmProject.id, eufmProject);
    await this.saveRegistry();

    console.log('✅ Default projects created in registry');
  }

  // Ensures registry is initialized before any public operation
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized && this.projectsData.size > 0) return;
    if (this.initializationPromise) {
      await this.initializationPromise;
    } else {
      // Should not happen if constructor is called correctly, but as a safeguard
      this.initializationPromise = this.initializeRegistry();
      await this.initializationPromise;
    }
  }

  async registerProject(project: ProjectMetadata): Promise<void> {
    await this.ensureInitialized();
    this.projectsData.set(project.id, project);
    await this.saveRegistry();
    console.log(`📋 Project registered: ${project.name} (${project.id})`);
  }

  async getProject(projectId: string): Promise<ProjectMetadata | undefined> {
    await this.ensureInitialized();
    return this.projectsData.get(projectId);
  }

  async getAllProjects(): Promise<ProjectMetadata[]> {
    await this.ensureInitialized();
    return Array.from(this.projectsData.values());
  }

  async getActiveProjects(): Promise<ProjectMetadata[]> {
    await this.ensureInitialized();
    return Array.from(this.projectsData.values()).filter(p => p.status === 'active');
  }

  async updateProjectStatus(projectId: string, status: ProjectMetadata['status']): Promise<void> {
    await this.ensureInitialized();
    const project = this.projectsData.get(projectId);
    if (project) {
      project.status = status;
      project.metrics.lastUpdated = new Date().toISOString();
      await this.saveRegistry();
      console.log(`📊 Project ${projectId} status updated to: ${status}`);
    }
  }

  async updateProjectMetrics(projectId: string, metrics: Partial<ProjectMetadata['metrics']>): Promise<void> {
    await this.ensureInitialized();
    const project = this.projectsData.get(projectId);
    if (project) {
      project.metrics = { ...project.metrics, ...metrics };
      project.metrics.lastUpdated = new Date().toISOString();
      await this.saveRegistry();
      console.log(`📈 Project ${projectId} metrics updated`);
    }
  }

  async addAutomatedTask(
    projectId: string, 
    task: Omit<ProjectMetadata['automatedTasks'][0], 'nextRun'>
  ): Promise<void> {
    await this.ensureInitialized();
    const project = this.projectsData.get(projectId);
    if (project) {
      const taskWithSchedule = {
        ...task,
        nextRun: this.getNextCronRun(task.schedule)
      };
      project.automatedTasks.push(taskWithSchedule);
      await this.saveRegistry();
      console.log(`⚡ Automated task added to ${projectId}: ${task.description}`);
    }
  }

  async getProjectsByStatus(status: ProjectMetadata['status']): Promise<ProjectMetadata[]> {
    await this.ensureInitialized();
    return Array.from(this.projectsData.values()).filter(p => p.status === status);
  }

  async getProjectsByPriority(priority: ProjectMetadata['priority']): Promise<ProjectMetadata[]> {
    await this.ensureInitialized();
    return Array.from(this.projectsData.values()).filter(p => p.priority === priority);
  }

  async getCriticalProjects(): Promise<ProjectMetadata[]> {
    await this.ensureInitialized();
    return Array.from(this.projectsData.values()).filter(p => 
      p.metrics.riskLevel === 'critical' || p.priority === 'P0'
    );
  }

  async getPortfolioHealth(): Promise<{
    overallHealth: number;
    projectCount: number;
    activeProjects: number;
    criticalIssues: number;
    budgetUtilization: number;
  }> {
    await this.ensureInitialized();
    const allProjects = Array.from(this.projectsData.values());
    const activeProjects = allProjects.filter(p => p.status === 'active');
    const criticalProjects = allProjects.filter(p => p.metrics.riskLevel === 'critical');
    
    const avgHealth = activeProjects.reduce((sum, p) => sum + p.metrics.healthScore, 0) / activeProjects.length;
    const totalBudget = allProjects.reduce((sum, p) => sum + p.budget.allocated, 0);
    const totalSpent = allProjects.reduce((sum, p) => sum + p.budget.spent, 0);
    
    return {
      overallHealth: Math.round(avgHealth) || 0,
      projectCount: allProjects.length,
      activeProjects: activeProjects.length,
      criticalIssues: criticalProjects.length,
      budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
    };
  }

  private async saveRegistry(): Promise<void> {
    try {
      const registryData = Object.fromEntries(this.projectsData);
      await fs.writeFile(this.registryPath, JSON.stringify(registryData, null, 2), 'utf-8');
    } catch (error: unknown) {
      console.error('❌ Failed to save project registry:', error);
    }
  }

  private getNextCronRun(cronExpression: string): string {
    // Simple cron calculation for common patterns
    // For production, use a proper cron library
    const now = new Date();
    const [minute, hour, day, month, dayOfWeek] = cronExpression.split(' ');
    
    // Handle daily tasks (0 X * * *)
    if (day === '*' && month === '*' && dayOfWeek === '*' && hour !== undefined && minute !== undefined) {
      const nextRun = new Date(now);
      nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      return nextRun.toISOString();
    }
    
    // Default: schedule for next hour
    const nextRun = new Date(now.getTime() + 60 * 60 * 1000);
    return nextRun.toISOString();
  }
}

export const projectRegistry = new ProjectRegistry();