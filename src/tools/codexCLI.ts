import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CodexTaskOptions {
  task: string;
  mode?: 'agent' | 'chat' | 'full_access';
  approvalRequired?: boolean;
  timeout?: number;
  workingDirectory?: string;
  saveLog?: boolean;
}

export interface CodexResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  logFile?: string;
  taskId: string;
}

export class CodexCLI {
  private baseDir: string;
  private logDir: string;

  constructor(baseDir: string = '/Users/panda/Desktop/EUFM') {
    this.baseDir = baseDir;
    this.logDir = path.join(baseDir, 'logs');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('which codex');
      return stdout.trim().length > 0;
    } catch {
      try {
        // Try alternative check
        await execAsync('codex --version');
        return true;
      } catch {
        return false;
      }
    }
  }

  async executeTask(options: CodexTaskOptions): Promise<CodexResult> {
    const startTime = Date.now();
    const taskId = `codex_${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = options.saveLog !== false ? 
      path.join(this.logDir, `codex_${timestamp}.log`) : undefined;

    // Ensure log directory exists
    await fs.mkdir(this.logDir, { recursive: true });

    try {
      // Check if Codex CLI is available
      if (!(await this.isAvailable())) {
        throw new Error('Codex CLI not found. Please install Codex CLI first.');
      }

      const workingDir = options.workingDirectory || this.baseDir;
      const result = await this.runCodexCommand(options, workingDir, logFile);
      
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: result,
        executionTime,
        logFile,
        taskId
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error.message || String(error);

      if (logFile) {
        await fs.appendFile(logFile, `\nERROR: ${errorMessage}\n`);
      }

      return {
        success: false,
        output: '',
        error: errorMessage,
        executionTime,
        logFile,
        taskId
      };
    }
  }

  private async runCodexCommand(options: CodexTaskOptions, workingDir: string, logFile?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = ['exec'];
      
      // Add approval bypass for non-interactive execution
      if (!options.approvalRequired) {
        args.push('--dangerously-bypass-approvals-and-sandbox');
      }
      
      // Add the task
      args.push(options.task);

      if (logFile) {
        fs.appendFile(logFile, `Executing: codex ${args.join(' ')}\nWorking Directory: ${workingDir}\n\n`);
      }

      const codexProcess = spawn('codex', args, {
        cwd: workingDir,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      codexProcess.stdout?.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        if (logFile) {
          fs.appendFile(logFile, chunk);
        }
      });

      codexProcess.stderr?.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        if (logFile) {
          fs.appendFile(logFile, `STDERR: ${chunk}`);
        }
      });

      codexProcess.on('close', (code) => {
        if (logFile) {
          fs.appendFile(logFile, `\nProcess exited with code: ${code}\n`);
        }

        if (code === 0) {
          resolve(stdout || 'Task completed successfully');
        } else {
          reject(new Error(`Codex process failed with code ${code}. Error: ${stderr}`));
        }
      });

      codexProcess.on('error', (error) => {
        if (logFile) {
          fs.appendFile(logFile, `\nProcess error: ${error.message}\n`);
        }
        reject(error);
      });

      // Handle timeout
      if (options.timeout) {
        setTimeout(() => {
          codexProcess.kill('SIGTERM');
          reject(new Error(`Codex task timed out after ${options.timeout}ms`));
        }, options.timeout);
      }
    });
  }

  // Convenience method for quick tasks
  async quickTask(task: string): Promise<string> {
    const result = await this.executeTask({
      task,
      approvalRequired: false,
      saveLog: true
    });

    if (!result.success) {
      throw new Error(result.error || 'Codex task failed');
    }

    return result.output;
  }

  // Method for interactive tasks that need approval
  async interactiveTask(task: string): Promise<string> {
    const result = await this.executeTask({
      task,
      approvalRequired: true,
      saveLog: true
    });

    if (!result.success) {
      throw new Error(result.error || 'Codex task failed');
    }

    return result.output;
  }

  // Method for file operations
  async fileTask(task: string, targetFiles?: string[]): Promise<string> {
    let enhancedTask = task;
    
    if (targetFiles && targetFiles.length > 0) {
      enhancedTask = `${task}\n\nFocus on these files: ${targetFiles.join(', ')}`;
    }

    return await this.quickTask(enhancedTask);
  }

  // Method for getting recent logs
  async getRecentLogs(limit: number = 5): Promise<string[]> {
    try {
      const files = await fs.readdir(this.logDir);
      const codexLogs = files
        .filter(f => f.startsWith('codex_') && f.endsWith('.log'))
        .sort()
        .reverse()
        .slice(0, limit);

      const logs = [];
      for (const file of codexLogs) {
        const content = await fs.readFile(path.join(this.logDir, file), 'utf-8');
        logs.push(`=== ${file} ===\n${content}`);
      }

      return logs;
    } catch {
      return [];
    }
  }

  // Method to check system status
  async getStatus(): Promise<{
    available: boolean;
    version?: string;
    workingDirectory: string;
    recentTasks: number;
  }> {
    const available = await this.isAvailable();
    let version: string | undefined;

    if (available) {
      try {
        const { stdout } = await execAsync('codex --version');
        version = stdout.trim();
      } catch {
        version = 'Unknown';
      }
    }

    // Count recent tasks (last 24 hours)
    let recentTasks = 0;
    try {
      const files = await fs.readdir(this.logDir);
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      for (const file of files) {
        if (file.startsWith('codex_') && file.endsWith('.log')) {
          const stat = await fs.stat(path.join(this.logDir, file));
          if (stat.mtime.getTime() > oneDayAgo) {
            recentTasks++;
          }
        }
      }
    } catch {}

    return {
      available,
      version,
      workingDirectory: this.baseDir,
      recentTasks
    };
  }
}

// Singleton instance for easy access
export const codexCLI = new CodexCLI();

// Convenience functions
export async function runCodexTask(task: string, options: Partial<CodexTaskOptions> = {}): Promise<CodexResult> {
  return await codexCLI.executeTask({
    task,
    ...options
  });
}

export async function quickCodex(task: string): Promise<string> {
  return await codexCLI.quickTask(task);
}

export async function codeGeneration(prompt: string, targetFiles?: string[]): Promise<string> {
  const task = `Generate code based on this prompt: ${prompt}`;
  return await codexCLI.fileTask(task, targetFiles);
}

export async function codeReview(files: string[], criteria?: string): Promise<string> {
  const task = criteria ? 
    `Review these files for: ${criteria}` : 
    'Review these files for code quality, potential bugs, and improvements';
  
  return await codexCLI.fileTask(task, files);
}

export async function refactorCode(description: string, targetFiles: string[]): Promise<string> {
  const task = `Refactor code: ${description}`;
  return await codexCLI.fileTask(task, targetFiles);
}

export async function addFeature(featureDescription: string, relevantFiles?: string[]): Promise<string> {
  const task = `Add this feature: ${featureDescription}`;
  return await codexCLI.fileTask(task, relevantFiles);
}

