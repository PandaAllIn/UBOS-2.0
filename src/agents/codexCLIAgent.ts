import { BaseAgent, AgentRunOptions, AgentContext } from './baseAgent.js';
import { AgentResult } from '../orchestrator/types.js';
import { codexCLI, CodexTaskOptions } from '../tools/codexCLI.js';

export interface CodexAgentOptions {
  mode?: 'agent' | 'chat' | 'full_access';
  approvalRequired?: boolean;
  targetFiles?: string[];
  timeout?: number;
}

export class CodexCLIAgent extends BaseAgent {
  get type() { return 'CodexCLIAgent'; }

  async run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.now();

    try {
      if (opts.dryRun) {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: '[Dry run] CodexCLIAgent would execute task using Codex CLI with direct system access.',
          startedAt,
          finishedAt: this.now()
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
          finishedAt: this.now()
        };
      }

      // Parse options from context or input
      const agentOptions = this.parseOptions(opts.input, ctx);
      
      // Enhance the task with context
      const enhancedTask = this.enhanceTask(opts.input, ctx);

      // Execute Codex task
      const envTimeout = parseInt(process.env.CODEX_TIMEOUT_MS || '', 10);
      const codexOptions: CodexTaskOptions = {
        task: enhancedTask,
        mode: agentOptions.mode || 'agent',
        approvalRequired: agentOptions.approvalRequired ?? false,
        timeout: agentOptions.timeout || (Number.isFinite(envTimeout) ? envTimeout : 300000), // default 5 minutes
        workingDirectory: '/Users/panda/Desktop/EUFM',
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
          finishedAt: this.now(),
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
          finishedAt: this.now(),
          metadata: {
            taskId: result.taskId,
            executionTime: result.executionTime,
            logFile: result.logFile
          }
        };
      }

    } catch (error: any) {
      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: '',
        error: error?.message || String(error),
        startedAt,
        finishedAt: this.now()
      };
    }
  }

  private parseOptions(input: string, ctx?: AgentContext): CodexAgentOptions {
    const inputLower = input.toLowerCase();
    const contextOptions = ctx?.shared?.codexOptions as CodexAgentOptions || {};

    // Determine mode
    let mode: 'agent' | 'chat' | 'full_access' = 'agent';
    if (inputLower.includes('chat mode') || inputLower.includes('planning')) {
      mode = 'chat';
    } else if (inputLower.includes('full access') || inputLower.includes('network access')) {
      mode = 'full_access';
    }

    // Determine if approval is required
    let approvalRequired = false;
    if (inputLower.includes('interactive') || inputLower.includes('approval required')) {
      approvalRequired = true;
    }

    // Extract target files
    let targetFiles: string[] = [];
    const fileMatches = input.match(/[\w\-_]+\.(ts|js|json|md|yml|yaml)/g);
    if (fileMatches) {
      targetFiles = fileMatches;
    }

    // Timeout
    let timeout = 120000; // 2 minutes default
    if (inputLower.includes('quick') || inputLower.includes('fast')) {
      timeout = 30000; // 30 seconds
    } else if (inputLower.includes('complex') || inputLower.includes('thorough')) {
      timeout = 300000; // 5 minutes
    }

    return {
      mode: contextOptions.mode || mode,
      approvalRequired: contextOptions.approvalRequired ?? approvalRequired,
      targetFiles: contextOptions.targetFiles || targetFiles,
      timeout: contextOptions.timeout || timeout
    };
  }

  private enhanceTask(input: string, ctx?: AgentContext): string {
    let enhancedTask = input;

    // Add project context
    enhancedTask += `\n\nProject Context: EUFM (European Union Funds Manager) - AI Agent Orchestration System`;
    enhancedTask += `\nWorking Directory: /Users/panda/Desktop/EUFM`;
    enhancedTask += `\nProject Type: TypeScript/Node.js multi-agent coordination system`;

    // Add relevant context from session
    if (ctx?.shared?.projectContext) {
      enhancedTask += `\nAdditional Context: ${ctx.shared.projectContext}`;
    }

    // Add file-specific guidance
    const inputLower = input.toLowerCase();
    if (inputLower.includes('agent') && inputLower.includes('create')) {
      enhancedTask += `\nNote: Follow the BaseAgent pattern in src/agents/ and register in AgentFactory`;
    }
    
    if (inputLower.includes('tool')) {
      enhancedTask += `\nNote: Tools should be in src/tools/ with proper TypeScript interfaces`;
    }

    if (inputLower.includes('test')) {
      enhancedTask += `\nNote: Use the existing test patterns and ensure TypeScript compatibility`;
    }

    // Add safety constraints
    enhancedTask += `\n\nSafety Guidelines:`;
    enhancedTask += `\n- Preserve existing functionality when modifying files`;
    enhancedTask += `\n- Follow TypeScript best practices and existing code patterns`;
    enhancedTask += `\n- Add proper error handling and logging`;
    enhancedTask += `\n- Test changes before completing`;

    return enhancedTask;
  }

  private formatSuccessOutput(result: any, originalTask: string): string {
    const duration = Math.round(result.executionTime / 1000);
    
    return `
🤖 CODEX CLI EXECUTION COMPLETED
Task: ${originalTask.slice(0, 100)}${originalTask.length > 100 ? '...' : ''}
Duration: ${duration}s | Task ID: ${result.taskId}

${result.output}

📁 Execution Log: ${result.logFile}
✅ Task completed successfully with Codex CLI
`;
  }

  // Method for direct code generation
  async generateCode(prompt: string, targetFiles?: string[]): Promise<AgentResult> {
    return await this.run({
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
      input: task,
      dryRun: false
    });
  }

  // Method for refactoring
  async refactorCode(description: string, targetFiles: string[]): Promise<AgentResult> {
    return await this.run({
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
      input: task,
      dryRun: false
    });
  }

  // Method for documentation
  async generateDocs(target: string, type: 'api' | 'user' | 'dev' = 'dev'): Promise<AgentResult> {
    return await this.run({
      input: `Generate ${type} documentation for ${target}`,
      dryRun: false
    });
  }

  // Method for testing
  async createTests(targetFiles: string[], testType: 'unit' | 'integration' = 'unit'): Promise<AgentResult> {
    return await this.run({
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
      input: task,
      dryRun: false
    });
  }

  // Method for project setup
  async setupProject(requirements: string): Promise<AgentResult> {
    return await this.run({
      input: `Set up project with these requirements: ${requirements}`,
      dryRun: false
    });
  }
}
