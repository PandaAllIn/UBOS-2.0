/**
 * CodeRabbit Pro API Integration
 * Direct API calls to CodeRabbit for real-time analysis and fixes
 */

import { agentActionLogger } from '../../masterControl/agentActionLogger.js';

export interface CodeRabbitAnalysisRequest {
  files: Array<{
    path: string;
    content: string;
    language?: string;
  }>;
  context?: string;
  options?: {
    includeSecurityCheck?: boolean;
    includeBestPractices?: boolean;
    includePerformance?: boolean;
    generateFixes?: boolean;
  };
}

export interface CodeRabbitIssueDetail {
  id: string;
  file: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  category: 'security' | 'performance' | 'maintainability' | 'style' | 'bug' | 'best-practice';
  title: string;
  description: string;
  suggestion?: string;
  fixCode?: {
    original: string;
    fixed: string;
    explanation: string;
  };
  ruleId?: string;
  documentation?: string;
}

export interface CodeRabbitAnalysisResponse {
  analysisId: string;
  timestamp: string;
  summary: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    suggestionCount: number;
  };
  issues: CodeRabbitIssueDetail[];
  fixes: Array<{
    issueId: string;
    file: string;
    originalCode: string;
    fixedCode: string;
    explanation: string;
  }>;
  qualityScore: number;
  recommendations: string[];
}

export class CodeRabbitAPI {
  private apiKey: string;
  private baseUrl = 'https://api.coderabbit.ai/api/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.CODERABBIT_API_TOKEN || '';
    if (!this.apiKey) {
      throw new Error('CodeRabbit API key is required. Set CODERABBIT_API_TOKEN environment variable.');
    }
  }

  /**
   * Analyze code files with CodeRabbit Pro
   */
  async analyzeCode(request: CodeRabbitAnalysisRequest): Promise<CodeRabbitAnalysisResponse> {
    const actionId = await agentActionLogger.startWork(
      'CodeRabbitAPI',
      'Analyze code',
      `Analyzing ${request.files.length} files with CodeRabbit Pro`,
      'system'
    );

    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'UBOS-CodeRabbit-Integration/1.0'
        },
        body: JSON.stringify({
          files: request.files,
          context: request.context || 'UBOS codebase analysis',
          options: {
            includeSecurityCheck: true,
            includeBestPractices: true,
            includePerformance: true,
            generateFixes: true,
            ...request.options
          }
        })
      });

      if (!response.ok) {
        throw new Error(`CodeRabbit API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      await agentActionLogger.completeWork(
        actionId,
        `Analysis complete: ${result.summary.totalIssues} issues found`,
        [`analysis-${result.analysisId}`]
      );

      return result;

    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Analysis failed: ${error}`,
        []
      );
      throw error;
    }
  }

  /**
   * Get AI-powered fix suggestions for specific issues
   */
  async getFixSuggestions(issueIds: string[]): Promise<Array<{
    issueId: string;
    fix: {
      code: string;
      explanation: string;
      confidence: number;
    };
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/fixes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          issueIds
        })
      });

      if (!response.ok) {
        throw new Error(`CodeRabbit fixes API error: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to get fix suggestions:', error);
      return [];
    }
  }

  /**
   * Analyze single file for quick checks
   */
  async analyzeFile(filePath: string, content: string): Promise<CodeRabbitIssueDetail[]> {
    const request: CodeRabbitAnalysisRequest = {
      files: [{
        path: filePath,
        content,
        language: this.detectLanguage(filePath)
      }],
      context: `Single file analysis for ${filePath}`
    };

    const result = await this.analyzeCode(request);
    return result.issues;
  }

  /**
   * Get code quality score for content
   */
  async getQualityScore(files: Array<{path: string, content: string}>): Promise<{
    score: number;
    breakdown: {
      security: number;
      maintainability: number;
      performance: number;
      style: number;
    };
  }> {
    const result = await this.analyzeCode({
      files,
      options: {
        includeSecurityCheck: true,
        includeBestPractices: true,
        includePerformance: true
      }
    });

    // Calculate breakdown based on issue categories
    const issues = result.issues;
    const securityIssues = issues.filter(i => i.category === 'security').length;
    const performanceIssues = issues.filter(i => i.category === 'performance').length;
    const maintainabilityIssues = issues.filter(i => i.category === 'maintainability').length;
    const styleIssues = issues.filter(i => i.category === 'style').length;

    return {
      score: result.qualityScore,
      breakdown: {
        security: Math.max(0, 100 - securityIssues * 10),
        performance: Math.max(0, 100 - performanceIssues * 5),
        maintainability: Math.max(0, 100 - maintainabilityIssues * 3),
        style: Math.max(0, 100 - styleIssues * 1)
      }
    };
  }

  /**
   * Detect file language from path
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript', 
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'kt': 'kotlin',
      'rs': 'rust',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'yaml': 'yaml',
      'yml': 'yaml',
      'json': 'json'
    };

    return langMap[ext || ''] || 'text';
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// Factory function to create API instance with provided key
export function createCodeRabbitAPI(apiKey: string): CodeRabbitAPI {
  return new CodeRabbitAPI(apiKey);
}