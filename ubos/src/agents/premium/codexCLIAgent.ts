import { BaseAgent, AgentRunOptions, AgentContext, AgentFeature } from './baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';
import { codexCLI, CodexTaskOptions } from '../../tools/codexCLI.js';
import { repoRoot } from '../../utils/paths.js';

// Context7-guided: Codex CLI agent feature definition
const codexCLIFeature: AgentFeature = {
  type: 'codex-cli',
  capabilities: ['code-generation', 'execution', 'system-access', 'project-setup'],
  requirements: { tools: ['codex-cli', 'terminal'] }
};

export interface CodexAgentOptions {
  mode?: 'agent' | 'chat' | 'full_access';
  approvalRequired?: boolean;
  targetFiles?: string[];
  timeout?: number;
}

export class CodexCLIAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'codex-cli') {
    super(id, requirementId, codexCLIFeature);
  }

  get type() { return 'CodexCLIAgent'; }


  async run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.getNow();

    try {
      if (opts.dryRun) {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: '[Dry run] CodexCLIAgent would execute task using Codex CLI with direct system access.',
          startedAt,
          finishedAt: this.getNow()
        };
      }

      // Check if Codex is available
      const status = await codexCLI.getStatus();
      if (!status.available) {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: false,
          output: '',
          error: 'Codex CLI not available. Please install Codex CLI first.',
          startedAt,
          finishedAt: this.getNow()
        };
      }

      // Parse options from context or input (simplified)
      const agentOptions: CodexAgentOptions = { mode: 'agent', approvalRequired: false };

      // Enhance the task with context (simplified)
      const enhancedTask = opts.input;

      // Execute Codex task
      const envTimeout = parseInt(process.env.CODEX_TIMEOUT_MS || '', 10);
      const codexOptions: CodexTaskOptions = {
        task: enhancedTask,
        mode: agentOptions.mode || 'agent',
        approvalRequired: agentOptions.approvalRequired ?? false,
        timeout: agentOptions.timeout || (Number.isFinite(envTimeout) ? envTimeout : 600000), // default 10 minutes
        workingDirectory: repoRoot(),
        saveLog: true
      };

      const result = await codexCLI.executeTask(codexOptions);

      if (result.success) {
        // Format successful result
        const output = this.formatSuccessOutput(result, enhancedTask);
        
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output,
          startedAt,
          finishedAt: this.getNow(),
          metadata: {
            taskId: result.taskId,
            executionTime: result.executionTime,
            logFile: result.logFile,
            codexMode: codexOptions.mode
          }
        };
      } else {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: false,
          output: result.output || '',
          error: result.error || 'Codex execution failed',
          startedAt,
          finishedAt: this.getNow(),
          metadata: {
            taskId: result.taskId,
            executionTime: result.executionTime,
            logFile: result.logFile
          }
        };
      }

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

  private formatSuccessOutput(result: {
    executionTime: number;
    taskId: string;
    output: string;
    logFile?: string;
  }, originalTask: string): string {
    const duration = Math.round(result.executionTime / 1000);
    
    return `
🤖 CODEX CLI EXECUTION COMPLETED
Task: ${originalTask.slice(0, 100)}${originalTask.length > 100 ? '...' : ''}
Duration: ${duration}s | Task ID: ${result.taskId}

${result.output}

📁 Execution Log: ${result.logFile || 'N/A'}
✅ Task completed successfully with Codex CLI
`;
  }

  // Method for direct code generation
  async generateCode(prompt: string, targetFiles?: string[]): Promise<AgentResult> {
    return await this.run({
      userId: 'unknown-user',
      input: `Generate code: ${prompt}${targetFiles ? `\nTarget files: ${targetFiles.join(', ')}` : ''}`,
      dryRun: false
    });
  }

  // Method for code review
  async reviewCode(files: string[], criteria?: string): Promise<AgentResult> {
    const task = criteria ? 
      `Review code in ${files.join(', ')} for: ${criteria}` : 
      `Review code in ${files.join(', ')} for quality, bugs, and improvements`;
    
    return await this.run({
      userId: 'unknown-user',
      input: task,
      dryRun: false
    });
  }

  // Method for refactoring
  async refactorCode(description: string, targetFiles: string[]): Promise<AgentResult> {
    return await this.run({
      userId: 'unknown-user',
      input: `Refactor: ${description}\nFiles: ${targetFiles.join(', ')}`,
      dryRun: false
    });
  }

  // Method for adding features
  async addFeature(featureDescription: string, relevantFiles?: string[]): Promise<AgentResult> {
    let task = `Add feature: ${featureDescription}`;
    if (relevantFiles && relevantFiles.length > 0) {
      task += `\nRelevant files: ${relevantFiles.join(', ')}`;
    }
    
    return await this.run({
      userId: 'unknown-user',
      input: task,
      dryRun: false
    });
  }

  // Method for documentation
  async generateDocs(target: string, type: 'api' | 'user' | 'dev' = 'dev'): Promise<AgentResult> {
    return await this.run({
      userId: 'unknown-user',
      input: `Generate ${type} documentation for ${target}`,
      dryRun: false
    });
  }

  // Method for testing
  async createTests(targetFiles: string[], testType: 'unit' | 'integration' = 'unit'): Promise<AgentResult> {
    return await this.run({
      userId: 'unknown-user',
      input: `Create ${testType} tests for: ${targetFiles.join(', ')}`,
      dryRun: false
    });
  }

  // Method for debugging
  async debugIssue(description: string, relevantFiles?: string[]): Promise<AgentResult> {
    let task = `Debug issue: ${description}`;
    if (relevantFiles && relevantFiles.length > 0) {
      task += `\nCheck these files: ${relevantFiles.join(', ')}`;
    }
    
    return await this.run({
      userId: 'unknown-user',
      input: task,
      dryRun: false
    });
  }

  // Method for project setup
  async setupProject(requirements: string): Promise<AgentResult> {
    return await this.run({
      userId: 'unknown-user',
      input: `Set up project with these requirements: ${requirements}`,
      dryRun: false
    });
  }
}
