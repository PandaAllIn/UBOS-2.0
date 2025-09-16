import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface CodeLLMConfig {
  apiKey?: string;
  orgId?: string;
  projectRoot: string;
  outputDir?: string;
  model?: 'gpt-5-fusion' | 'claude-sonnet-4' | 'auto';
  temperature?: number;
}

export interface CodeLLMRequest {
  prompt: string;
  context?: string[];
  files?: string[];
  language?: string;
  framework?: string;
  task_type?: 'code_generation' | 'refactoring' | 'documentation' | 'analysis' | 'debugging';
}

export interface CodeLLMResponse {
  success: boolean;
  output: string;
  files_modified?: string[];
  suggestions?: string[];
  error?: string;
  execution_time?: number;
}

export class CodeLLMCLI {
  private config: CodeLLMConfig;
  private isAuthenticated: boolean = false;

  constructor(config: CodeLLMConfig) {
    this.config = {
      outputDir: 'codellm-output',
      model: 'auto',
      temperature: 0.7,
      ...config
    };
  }

  /**
   * Initialize and authenticate CodeLLM CLI
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if CodeLLM CLI is installed
      await execAsync('code-llm-cli --version');
      
      // Check authentication status
      const { stdout } = await execAsync('code-llm-cli whoami');
      this.isAuthenticated = !stdout.includes('not authenticated');
      
      if (!this.isAuthenticated && this.config.apiKey) {
        // Authenticate with API key
        process.env.ABACUS_API_KEY = this.config.apiKey;
        const authResult = await execAsync('code-llm-cli auth --api-key $ABACUS_API_KEY');
        this.isAuthenticated = authResult.stdout.includes('success');
      }
      
      return this.isAuthenticated;
    } catch (error) {
      console.error('CodeLLM CLI initialization failed:', error);
      return false;
    }
  }

  /**
   * Execute a CodeLLM request
   */
  async execute(request: CodeLLMRequest): Promise<CodeLLMResponse> {
    if (!this.isAuthenticated) {
      throw new Error('CodeLLM CLI not authenticated. Call initialize() first.');
    }

    const startTime = Date.now();
    
    try {
      // Prepare command arguments
      const args = [
        'generate',
        '--prompt', `"${request.prompt}"`,
        '--project-root', this.config.projectRoot,
        '--output-dir', this.config.outputDir!,
        '--model', this.config.model!,
        '--temperature', this.config.temperature!.toString()
      ];

      if (request.context && request.context.length > 0) {
        args.push('--context', request.context.join(','));
      }

      if (request.files && request.files.length > 0) {
        args.push('--files', request.files.join(','));
      }

      if (request.language) {
        args.push('--language', request.language);
      }

      if (request.framework) {
        args.push('--framework', request.framework);
      }

      if (request.task_type) {
        args.push('--task-type', request.task_type);
      }

      // Execute CodeLLM CLI
      const { stdout, stderr } = await execAsync(`code-llm-cli ${args.join(' ')}`);
      
      const executionTime = Date.now() - startTime;

      // Parse response (this would need to be adapted based on actual CLI output format)
      const response: CodeLLMResponse = {
        success: true,
        output: stdout,
        execution_time: executionTime
      };

      // Extract file modifications and suggestions from output
      if (stdout.includes('Files modified:')) {
        response.files_modified = this.extractFileList(stdout, 'Files modified:');
      }

      if (stdout.includes('Suggestions:')) {
        response.suggestions = this.extractSuggestions(stdout);
      }

      return response;

    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
        execution_time: Date.now() - startTime
      };
    }
  }

  /**
   * Generate code from UBOS specifications
   */
  async generateFromSpec(specPath: string, outputPath?: string): Promise<CodeLLMResponse> {
    const specContent = await readFile(specPath, 'utf-8');
    
    return this.execute({
      prompt: `Generate TypeScript implementation from this UBOS specification:\n\n${specContent}`,
      context: [specPath],
      language: 'typescript',
      framework: 'node',
      task_type: 'code_generation'
    });
  }

  /**
   * Refactor existing agent code
   */
  async refactorAgent(agentPath: string, improvements: string[]): Promise<CodeLLMResponse> {
    const agentCode = await readFile(agentPath, 'utf-8');
    
    const prompt = `Refactor this UBOS agent with the following improvements:
${improvements.map(imp => `- ${imp}`).join('\n')}

Current code:
${agentCode}`;

    return this.execute({
      prompt,
      files: [agentPath],
      language: 'typescript',
      framework: 'node',
      task_type: 'refactoring'
    });
  }

  /**
   * Generate EU funding documentation
   */
  async generateEUFundingDocs(projectData: any): Promise<CodeLLMResponse> {
    const prompt = `Generate EU funding proposal documentation for this project:
${JSON.stringify(projectData, null, 2)}

Include:
- Technical architecture description
- Compliance with EU regulations
- Budget breakdown
- Risk assessment
- Implementation timeline`;

    return this.execute({
      prompt,
      task_type: 'documentation',
      language: 'markdown'
    });
  }

  /**
   * Analyze codebase for security and compliance
   */
  async analyzeCompliance(targetDir: string): Promise<CodeLLMResponse> {
    return this.execute({
      prompt: `Analyze this codebase for:
- GDPR compliance issues
- Security vulnerabilities
- EU regulatory compliance
- Code quality improvements`,
      files: [`${targetDir}/**/*.ts`, `${targetDir}/**/*.js`],
      task_type: 'analysis'
    });
  }

  private extractFileList(output: string, marker: string): string[] {
    const lines = output.split('\n');
    const startIndex = lines.findIndex(line => line.includes(marker));
    if (startIndex === -1) return [];
    
    const files: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('---')) break;
      if (line.startsWith('- ')) {
        files.push(line.substring(2));
      }
    }
    return files;
  }

  private extractSuggestions(output: string): string[] {
    const lines = output.split('\n');
    const startIndex = lines.findIndex(line => line.includes('Suggestions:'));
    if (startIndex === -1) return [];
    
    const suggestions: string[] = [];
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('---')) break;
      if (line.startsWith('- ')) {
        suggestions.push(line.substring(2));
      }
    }
    return suggestions;
  }
}

// Export factory function for easy integration
export function createCodeLLMCLI(config: Partial<CodeLLMConfig>): CodeLLMCLI {
  const defaultConfig: CodeLLMConfig = {
    projectRoot: process.cwd(),
    apiKey: process.env.ABACUS_API_KEY,
    orgId: process.env.ABACUS_ORG_ID
  };

  return new CodeLLMCLI({ ...defaultConfig, ...config });
}