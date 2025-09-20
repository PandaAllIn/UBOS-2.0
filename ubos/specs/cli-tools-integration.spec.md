# CLI Tools Integration Specification

**Project**: UBOS 2.0 CLI Tools Orchestration Layer
**Purpose**: Unified interface for Groq, CodeLLM, and Codex CLI integration
**Target**: Production-ready wrappers for 4-stage EUFM agent system
**Integration**: TypeScript wrappers with existing UBOS infrastructure

---

## 1. INTEGRATION ARCHITECTURE

### 1.1 Unified CLI Interface
```typescript
// File: src/tools/cliOrchestrator.ts
export interface CLIToolInterface {
  name: 'groq' | 'codellm' | 'codex';
  initialize(): Promise<boolean>;
  execute(request: CLIRequest): Promise<CLIResponse>;
  healthCheck(): Promise<HealthStatus>;
  getCapabilities(): CLICapabilities;
}

export interface CLIRequest {
  prompt: string;
  context?: string[];
  files?: string[];
  language?: string;
  framework?: string;
  task_type?: 'generation' | 'analysis' | 'refactoring' | 'documentation';
  priority?: 'high' | 'medium' | 'low';
  timeout?: number; // milliseconds
}

export interface CLIResponse {
  success: boolean;
  output: string;
  executionTime: number;
  tool: string;
  cost?: number; // EUR
  quality?: number; // 0-1 scale
  metadata?: Record<string, any>;
  error?: string;
}
```

---

## 2. GROQ CLI WRAPPER

### 2.1 Implementation Requirements
Based on existing documentation, create production wrapper for ultra-fast inference.

```typescript
// File: src/tools/groqCLI.ts
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GroqConfig {
  apiKey: string;
  model: 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant';
  temperature: number;
  maxTokens: number;
  timeout: number; // milliseconds
}

export class GroqCLI implements CLIToolInterface {
  name = 'groq' as const;
  private config: GroqConfig;
  private isInitialized = false;

  constructor(config: Partial<GroqConfig> = {}) {
    this.config = {
      apiKey: process.env.GROQ_API_KEY || '',
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      maxTokens: 4000,
      timeout: 30000, // 30 seconds max
      ...config
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Verify Groq SDK installation
      await execAsync('python -c "import groq; print(groq.__version__)"');

      // Test API key
      if (!this.config.apiKey) {
        throw new Error('GROQ_API_KEY not configured');
      }

      // Quick API test
      await this.testConnection();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Groq CLI initialization failed:', error);
      return false;
    }
  }

  async execute(request: CLIRequest): Promise<CLIResponse> {
    if (!this.isInitialized) {
      throw new Error('Groq CLI not initialized');
    }

    const startTime = Date.now();

    try {
      // Create Python script for Groq API call
      const pythonScript = this.buildPythonScript(request);

      // Execute with timeout
      const { stdout, stderr } = await Promise.race([
        execAsync(`python -c "${pythonScript.replace(/"/g, '\\"')}"`),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), request.timeout || this.config.timeout)
        )
      ]);

      if (stderr) {
        throw new Error(stderr);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: stdout.trim(),
        executionTime,
        tool: 'groq',
        cost: this.calculateCost(request),
        quality: await this.assessQuality(stdout, request),
        metadata: {
          model: this.config.model,
          tokens_used: this.estimateTokens(request.prompt + stdout)
        }
      };

    } catch (error: any) {
      return {
        success: false,
        output: '',
        executionTime: Date.now() - startTime,
        tool: 'groq',
        error: error.message
      };
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const testRequest: CLIRequest = {
        prompt: 'Hello, respond with "OK" if you can process this request.',
        timeout: 5000
      };

      const result = await this.execute(testRequest);

      return {
        healthy: result.success,
        latency: result.executionTime,
        lastChecked: new Date(),
        details: result.success ? 'API responding normally' : result.error
      };
    } catch {
      return {
        healthy: false,
        latency: -1,
        lastChecked: new Date(),
        details: 'Health check failed'
      };
    }
  }

  getCapabilities(): CLICapabilities {
    return {
      maxTokens: this.config.maxTokens,
      supportedLanguages: ['javascript', 'typescript', 'python', 'markdown'],
      supportedTasks: ['generation', 'analysis'],
      avgLatency: 800, // milliseconds - Groq's strength
      qualityRating: 0.8, // Good but not highest quality
      costPerToken: 0.00001 // Very cost-effective
    };
  }

  private buildPythonScript(request: CLIRequest): string {
    const contextStr = request.context ? request.context.join('\\n') : '';

    return `
import os
from groq import Groq

client = Groq(api_key="${this.config.apiKey}")

context = "${contextStr}"
prompt = "${request.prompt}"

if context:
    full_prompt = f"Context: {context}\\n\\nRequest: {prompt}"
else:
    full_prompt = prompt

chat_completion = client.chat.completions.create(
    messages=[{"role": "user", "content": full_prompt}],
    model="${this.config.model}",
    temperature=${this.config.temperature},
    max_tokens=${this.config.maxTokens}
)

print(chat_completion.choices[0].message.content)
`;
  }

  private async testConnection(): Promise<void> {
    const testScript = `
import os
from groq import Groq

client = Groq(api_key="${this.config.apiKey}")
response = client.chat.completions.create(
    messages=[{"role": "user", "content": "Test"}],
    model="${this.config.model}",
    max_tokens=10
)
print("Connection OK")
`;

    await execAsync(`python -c "${testScript.replace(/"/g, '\\"')}"`);
  }

  private calculateCost(request: CLIRequest): number {
    // Groq pricing estimation
    const estimatedTokens = this.estimateTokens(request.prompt);
    return estimatedTokens * 0.00001; // $0.01 per 1000 tokens estimate
  }

  private estimateTokens(text: string): number {
    // Simple token estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private async assessQuality(output: string, request: CLIRequest): Promise<number> {
    // Simple quality assessment based on output characteristics
    let quality = 0.7; // Base quality for Groq

    // Length indicator
    if (output.length > 100) quality += 0.1;
    if (output.length > 500) quality += 0.1;

    // Task-specific quality indicators
    if (request.task_type === 'generation' && output.includes('function')) quality += 0.1;

    return Math.min(1.0, quality);
  }
}
```

---

## 3. CODELLM CLI WRAPPER

### 3.2 Enhanced Integration
Extend existing CodeLLMCLI implementation with production features.

```typescript
// File: src/tools/codeLLMCLIWrapper.ts
import { CodeLLMCLI, CodeLLMRequest, CodeLLMResponse } from '../../TOOLS/CodeLLM_CLI/src/codellmCLI.js';

export class CodeLLMCLIWrapper implements CLIToolInterface {
  name = 'codellm' as const;
  private codellmCLI: CodeLLMCLI;
  private isInitialized = false;

  constructor(projectRoot: string = process.cwd()) {
    this.codellmCLI = new CodeLLMCLI({
      projectRoot,
      apiKey: process.env.ABACUS_API_KEY,
      orgId: process.env.ABACUS_ORG_ID,
      model: 'claude-sonnet-4',
      temperature: 0.3
    });
  }

  async initialize(): Promise<boolean> {
    try {
      this.isInitialized = await this.codellmCLI.initialize();
      return this.isInitialized;
    } catch (error) {
      console.error('CodeLLM CLI initialization failed:', error);
      return false;
    }
  }

  async execute(request: CLIRequest): Promise<CLIResponse> {
    if (!this.isInitialized) {
      throw new Error('CodeLLM CLI not initialized');
    }

    const startTime = Date.now();

    try {
      // Convert unified request to CodeLLM format
      const codellmRequest: CodeLLMRequest = {
        prompt: this.buildEnhancedPrompt(request),
        context: request.context,
        files: request.files,
        language: request.language || 'typescript',
        framework: request.framework || 'node',
        task_type: this.mapTaskType(request.task_type)
      };

      const result = await this.codellmCLI.execute(codellmRequest);

      return {
        success: result.success,
        output: result.output,
        executionTime: result.execution_time || (Date.now() - startTime),
        tool: 'codellm',
        cost: this.calculateCost(request.prompt, result.output),
        quality: await this.assessQuality(result),
        metadata: {
          files_modified: result.files_modified,
          suggestions: result.suggestions,
          model: 'claude-sonnet-4'
        },
        error: result.error
      };

    } catch (error: any) {
      return {
        success: false,
        output: '',
        executionTime: Date.now() - startTime,
        tool: 'codellm',
        error: error.message
      };
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const testRequest: CLIRequest = {
        prompt: 'Generate a simple TypeScript interface for a User with name and email properties.',
        language: 'typescript',
        task_type: 'generation'
      };

      const result = await this.execute(testRequest);

      return {
        healthy: result.success,
        latency: result.executionTime,
        lastChecked: new Date(),
        details: result.success ? 'CodeLLM API responding normally' : result.error
      };
    } catch {
      return {
        healthy: false,
        latency: -1,
        lastChecked: new Date(),
        details: 'Health check failed'
      };
    }
  }

  getCapabilities(): CLICapabilities {
    return {
      maxTokens: 8000,
      supportedLanguages: ['typescript', 'javascript', 'python', 'go', 'rust', 'java'],
      supportedTasks: ['generation', 'refactoring', 'documentation', 'analysis'],
      avgLatency: 3000, // milliseconds - Higher quality takes time
      qualityRating: 0.95, // Highest quality
      costPerToken: 0.0001 // Premium pricing for quality
    };
  }

  private buildEnhancedPrompt(request: CLIRequest): string {
    let enhancedPrompt = request.prompt;

    // Add UBOS-specific context
    enhancedPrompt += '\n\nAdditional Requirements:';
    enhancedPrompt += '\n- Follow UBOS TypeScript conventions';
    enhancedPrompt += '\n- Include proper error handling';
    enhancedPrompt += '\n- Add JSDoc documentation';
    enhancedPrompt += '\n- Ensure GDPR compliance where applicable';

    if (request.task_type === 'generation') {
      enhancedPrompt += '\n- Generate production-ready code';
      enhancedPrompt += '\n- Include unit tests if appropriate';
    }

    return enhancedPrompt;
  }

  private mapTaskType(taskType?: string): 'code_generation' | 'refactoring' | 'documentation' | 'analysis' | 'debugging' {
    switch (taskType) {
      case 'generation': return 'code_generation';
      case 'refactoring': return 'refactoring';
      case 'documentation': return 'documentation';
      case 'analysis': return 'analysis';
      default: return 'code_generation';
    }
  }

  private calculateCost(prompt: string, output: string): number {
    // CodeLLM pricing estimation (higher cost for quality)
    const inputTokens = this.estimateTokens(prompt);
    const outputTokens = this.estimateTokens(output);

    return (inputTokens * 0.00015) + (outputTokens * 0.0003); // Premium pricing
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private async assessQuality(result: CodeLLMResponse): Promise<number> {
    let quality = 0.9; // High base quality for CodeLLM

    if (result.success && result.output.length > 100) quality += 0.05;
    if (result.files_modified && result.files_modified.length > 0) quality += 0.03;
    if (result.suggestions && result.suggestions.length > 0) quality += 0.02;

    return Math.min(1.0, quality);
  }
}
```

---

## 4. CODEX CLI WRAPPER

### 4.1 Enterprise Compliance Integration
Based on Codex OpenAI Agent documentation, create enterprise-grade wrapper.

```typescript
// File: src/tools/codexCLI.ts
export interface CodexConfig {
  apiKey: string;
  orgId?: string;
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  auditMode: boolean;
  complianceLevel: 'basic' | 'enterprise';
}

export class CodexCLI implements CLIToolInterface {
  name = 'codex' as const;
  private config: CodexConfig;
  private isInitialized = false;
  private auditTrail: AuditEntry[] = [];

  constructor(config: Partial<CodexConfig> = {}) {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      orgId: process.env.OPENAI_ORG_ID,
      model: 'gpt-4',
      auditMode: true,
      complianceLevel: 'enterprise',
      ...config
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Check if codex CLI is available (web or local)
      const isWebAvailable = await this.checkWebAccess();
      const isCLIInstalled = await this.checkCLIInstall();

      if (!isWebAvailable && !isCLIInstalled) {
        throw new Error('No Codex access method available');
      }

      // Test API authentication
      await this.testAuthentication();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Codex CLI initialization failed:', error);
      return false;
    }
  }

  async execute(request: CLIRequest): Promise<CLIResponse> {
    if (!this.isInitialized) {
      throw new Error('Codex CLI not initialized');
    }

    const startTime = Date.now();
    const auditEntry: AuditEntry = {
      id: this.generateAuditId(),
      timestamp: new Date(),
      request: this.sanitizeForAudit(request),
      user: process.env.USER || 'system',
      complianceChecks: []
    };

    try {
      // Pre-execution compliance checks
      const complianceResult = await this.performComplianceChecks(request);
      auditEntry.complianceChecks = complianceResult.checks;

      if (!complianceResult.passed && this.config.complianceLevel === 'enterprise') {
        throw new Error(`Compliance check failed: ${complianceResult.failures.join(', ')}`);
      }

      // Execute via preferred method (web API or CLI)
      const result = await this.executeCodexRequest(request);

      // Post-execution audit
      auditEntry.response = this.sanitizeForAudit(result);
      auditEntry.success = result.success;

      if (this.config.auditMode) {
        this.auditTrail.push(auditEntry);
        await this.persistAuditEntry(auditEntry);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        output: result.output,
        executionTime,
        tool: 'codex',
        cost: this.calculateCost(request, result),
        quality: await this.assessQuality(result, request),
        metadata: {
          model: this.config.model,
          auditId: auditEntry.id,
          complianceStatus: complianceResult.passed ? 'passed' : 'failed',
          securityLevel: this.config.complianceLevel
        },
        error: result.error
      };

    } catch (error: any) {
      auditEntry.success = false;
      auditEntry.error = error.message;

      if (this.config.auditMode) {
        this.auditTrail.push(auditEntry);
        await this.persistAuditEntry(auditEntry);
      }

      return {
        success: false,
        output: '',
        executionTime: Date.now() - startTime,
        tool: 'codex',
        error: error.message,
        metadata: {
          auditId: auditEntry.id,
          complianceStatus: 'failed'
        }
      };
    }
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      const testRequest: CLIRequest = {
        prompt: 'Create a simple hello world function in TypeScript.',
        language: 'typescript',
        task_type: 'generation'
      };

      const result = await this.execute(testRequest);

      return {
        healthy: result.success,
        latency: result.executionTime,
        lastChecked: new Date(),
        details: result.success ? 'Codex API responding normally' : result.error,
        metadata: {
          auditTrailSize: this.auditTrail.length,
          complianceLevel: this.config.complianceLevel
        }
      };
    } catch {
      return {
        healthy: false,
        latency: -1,
        lastChecked: new Date(),
        details: 'Health check failed'
      };
    }
  }

  getCapabilities(): CLICapabilities {
    return {
      maxTokens: 8000,
      supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'csharp', 'go', 'rust'],
      supportedTasks: ['generation', 'analysis', 'refactoring', 'documentation'],
      avgLatency: 4000, // milliseconds - Enterprise features add overhead
      qualityRating: 0.88, // High quality with enterprise features
      costPerToken: 0.0002, // Enterprise pricing
      specialFeatures: ['audit_trail', 'compliance_checks', 'enterprise_security']
    };
  }

  async getAuditTrail(limit: number = 100): Promise<AuditEntry[]> {
    return this.auditTrail.slice(-limit);
  }

  private async checkWebAccess(): Promise<boolean> {
    try {
      // Test access to chatgpt.com/codex
      const response = await fetch('https://chatgpt.com/api/auth/session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkCLIInstall(): Promise<boolean> {
    try {
      await execAsync('codex --version');
      return true;
    } catch {
      return false;
    }
  }

  private async testAuthentication(): Promise<void> {
    // Test API key validity
    const testScript = `
import openai
openai.api_key = "${this.config.apiKey}"

response = openai.ChatCompletion.create(
    model="${this.config.model}",
    messages=[{"role": "user", "content": "Test"}],
    max_tokens=10
)
print("Auth OK")
`;

    await execAsync(`python -c "${testScript.replace(/"/g, '\\"')}"`);
  }

  private async executeCodexRequest(request: CLIRequest): Promise<{success: boolean, output: string, error?: string}> {
    // Implementation depends on available access method
    const pythonScript = `
import openai
import json

openai.api_key = "${this.config.apiKey}"

try:
    response = openai.ChatCompletion.create(
        model="${this.config.model}",
        messages=[
            {"role": "system", "content": "You are Codex, an expert programming assistant with enterprise compliance features."},
            {"role": "user", "content": "${request.prompt.replace(/"/g, '\\"')}"}
        ],
        temperature=0.1,
        max_tokens=4000
    )

    result = {
        "success": True,
        "output": response.choices[0].message.content
    }

    print(json.dumps(result))

except Exception as e:
    result = {
        "success": False,
        "output": "",
        "error": str(e)
    }
    print(json.dumps(result))
`;

    const { stdout } = await execAsync(`python -c "${pythonScript}"`);
    return JSON.parse(stdout);
  }

  private async performComplianceChecks(request: CLIRequest): Promise<ComplianceResult> {
    const checks: ComplianceCheck[] = [];
    const failures: string[] = [];

    // Check for sensitive data in prompt
    const sensitiveDataCheck = await this.checkForSensitiveData(request.prompt);
    checks.push(sensitiveDataCheck);
    if (!sensitiveDataCheck.passed) failures.push(sensitiveDataCheck.reason);

    // Check for malicious intent
    const securityCheck = await this.performSecurityCheck(request.prompt);
    checks.push(securityCheck);
    if (!securityCheck.passed) failures.push(securityCheck.reason);

    // GDPR compliance check
    const gdprCheck = await this.checkGDPRCompliance(request);
    checks.push(gdprCheck);
    if (!gdprCheck.passed) failures.push(gdprCheck.reason);

    return {
      passed: failures.length === 0,
      checks,
      failures
    };
  }

  private async checkForSensitiveData(prompt: string): Promise<ComplianceCheck> {
    // Simple regex-based sensitive data detection
    const sensitivePatterns = [
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN pattern
      /password|secret|key|token/i // Common sensitive terms
    ];

    const found = sensitivePatterns.some(pattern => pattern.test(prompt));

    return {
      type: 'sensitive_data',
      passed: !found,
      reason: found ? 'Potential sensitive data detected in prompt' : 'No sensitive data detected',
      timestamp: new Date()
    };
  }

  private async performSecurityCheck(prompt: string): Promise<ComplianceCheck> {
    const maliciousPatterns = [
      /rm\s+-rf|del\s+\/s/i, // Dangerous commands
      /eval\s*\(|exec\s*\(/i, // Code injection
      /\.\.\/|\.\.\\/, // Path traversal
      /drop\s+table|delete\s+from/i // SQL injection
    ];

    const found = maliciousPatterns.some(pattern => pattern.test(prompt));

    return {
      type: 'security',
      passed: !found,
      reason: found ? 'Potentially malicious content detected' : 'Security check passed',
      timestamp: new Date()
    };
  }

  private async checkGDPRCompliance(request: CLIRequest): Promise<ComplianceCheck> {
    // Check if request involves personal data processing
    const personalDataTerms = /personal\s+data|pii|gdpr|data\s+subject/i;
    const hasPersonalData = personalDataTerms.test(request.prompt);

    return {
      type: 'gdpr',
      passed: true, // Always pass but log if personal data is involved
      reason: hasPersonalData ? 'Personal data processing detected - ensure GDPR compliance' : 'No personal data processing detected',
      timestamp: new Date(),
      metadata: { personalDataDetected: hasPersonalData }
    };
  }

  private generateAuditId(): string {
    return `codex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeForAudit(data: any): any {
    // Remove sensitive information from audit logs
    const sanitized = JSON.parse(JSON.stringify(data));

    if (typeof sanitized === 'object' && sanitized !== null) {
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = sanitized[key].replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
          sanitized[key] = sanitized[key].replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CARD_REDACTED]');
        }
      });
    }

    return sanitized;
  }

  private async persistAuditEntry(entry: AuditEntry): Promise<void> {
    // Store audit entry in secure location
    const auditFile = `./logs/codex_audit_${new Date().toISOString().split('T')[0]}.json`;

    try {
      const fs = await import('fs/promises');
      await fs.appendFile(auditFile, JSON.stringify(entry) + '\n');
    } catch (error) {
      console.warn('Failed to persist audit entry:', error);
    }
  }

  private calculateCost(request: CLIRequest, response: any): number {
    const inputTokens = this.estimateTokens(request.prompt);
    const outputTokens = this.estimateTokens(response.output || '');

    // OpenAI GPT-4 pricing with enterprise overhead
    return (inputTokens * 0.00003) + (outputTokens * 0.00006);
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private async assessQuality(result: any, request: CLIRequest): Promise<number> {
    let quality = 0.85; // Base quality for Codex

    if (result.success && result.output.length > 50) quality += 0.05;
    if (request.task_type === 'generation' && result.output.includes('function')) quality += 0.05;
    if (this.config.complianceLevel === 'enterprise') quality += 0.03; // Enterprise features add value

    return Math.min(1.0, quality);
  }
}
```

---

## 5. UNIFIED CLI ORCHESTRATOR

### 5.1 Intelligent Tool Selection
```typescript
// File: src/tools/cliOrchestrator.ts
export class CLIOrchestrator {
  private groqCLI: GroqCLI;
  private codellmCLI: CodeLLMCLIWrapper;
  private codexCLI: CodexCLI;
  private healthStatus: Map<string, HealthStatus> = new Map();

  constructor() {
    this.groqCLI = new GroqCLI();
    this.codellmCLI = new CodeLLMCLIWrapper();
    this.codexCLI = new CodexCLI();
  }

  async initialize(): Promise<boolean> {
    const results = await Promise.allSettled([
      this.groqCLI.initialize(),
      this.codellmCLI.initialize(),
      this.codexCLI.initialize()
    ]);

    const availableTools = results.filter(result =>
      result.status === 'fulfilled' && result.value === true
    ).length;

    return availableTools > 0; // At least one tool must be available
  }

  async execute(request: CLIRequest): Promise<CLIResponse> {
    // Select optimal tool based on request characteristics
    const selectedTool = await this.selectOptimalTool(request);

    try {
      return await selectedTool.execute(request);
    } catch (error) {
      // Fallback to alternative tool
      const fallbackTool = await this.selectFallbackTool(selectedTool, request);

      if (fallbackTool) {
        console.warn(`Primary tool failed, using fallback: ${fallbackTool.name}`);
        return await fallbackTool.execute(request);
      }

      throw error;
    }
  }

  async selectOptimalTool(request: CLIRequest): Promise<CLIToolInterface> {
    // Decision matrix based on request characteristics

    // Speed priority: Groq
    if (request.priority === 'high' || request.timeout && request.timeout < 2000) {
      return this.groqCLI;
    }

    // Quality priority: CodeLLM
    if (request.task_type === 'refactoring' || request.language === 'typescript') {
      return this.codellmCLI;
    }

    // Enterprise/Compliance priority: Codex
    if (request.context?.some(ctx => ctx.includes('enterprise') || ctx.includes('compliance'))) {
      return this.codexCLI;
    }

    // Default: CodeLLM for balanced quality/speed
    return this.codellmCLI;
  }

  async selectFallbackTool(primaryTool: CLIToolInterface, request: CLIRequest): Promise<CLIToolInterface | null> {
    const tools = [this.groqCLI, this.codellmCLI, this.codexCLI];
    const availableTools = tools.filter(tool =>
      tool !== primaryTool && this.isToolHealthy(tool.name)
    );

    return availableTools.length > 0 ? availableTools[0] : null;
  }

  async performHealthChecks(): Promise<void> {
    const tools = [this.groqCLI, this.codellmCLI, this.codexCLI];

    const healthChecks = await Promise.allSettled(
      tools.map(tool => tool.healthCheck())
    );

    healthChecks.forEach((result, index) => {
      const toolName = tools[index].name;

      if (result.status === 'fulfilled') {
        this.healthStatus.set(toolName, result.value);
      } else {
        this.healthStatus.set(toolName, {
          healthy: false,
          latency: -1,
          lastChecked: new Date(),
          details: 'Health check failed'
        });
      }
    });
  }

  private isToolHealthy(toolName: string): boolean {
    const status = this.healthStatus.get(toolName);
    return status?.healthy ?? false;
  }

  getSystemStatus(): SystemStatus {
    return {
      tools: Object.fromEntries(this.healthStatus),
      lastHealthCheck: new Date(),
      availableTools: Array.from(this.healthStatus.entries())
        .filter(([_, status]) => status.healthy)
        .map(([name, _]) => name)
    };
  }
}
```

---

## 6. TYPE DEFINITIONS

```typescript
// File: src/types/cliTypes.ts
export interface HealthStatus {
  healthy: boolean;
  latency: number; // milliseconds
  lastChecked: Date;
  details: string;
  metadata?: Record<string, any>;
}

export interface CLICapabilities {
  maxTokens: number;
  supportedLanguages: string[];
  supportedTasks: string[];
  avgLatency: number; // milliseconds
  qualityRating: number; // 0-1 scale
  costPerToken: number; // EUR
  specialFeatures?: string[];
}

export interface SystemStatus {
  tools: Record<string, HealthStatus>;
  lastHealthCheck: Date;
  availableTools: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  request: any;
  response?: any;
  user: string;
  success?: boolean;
  error?: string;
  complianceChecks: ComplianceCheck[];
}

export interface ComplianceCheck {
  type: 'sensitive_data' | 'security' | 'gdpr';
  passed: boolean;
  reason: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ComplianceResult {
  passed: boolean;
  checks: ComplianceCheck[];
  failures: string[];
}
```

---

## 7. INTEGRATION TESTS

```typescript
// File: tests/cliIntegration.test.ts
import { CLIOrchestrator } from '../src/tools/cliOrchestrator';
import { GroqCLI } from '../src/tools/groqCLI';
import { CodeLLMCLIWrapper } from '../src/tools/codeLLMCLIWrapper';
import { CodexCLI } from '../src/tools/codexCLI';

describe('CLI Tools Integration', () => {
  let orchestrator: CLIOrchestrator;

  beforeAll(async () => {
    orchestrator = new CLIOrchestrator();
    await orchestrator.initialize();
  });

  test('should execute simple code generation request', async () => {
    const request = {
      prompt: 'Create a TypeScript interface for a User with name and email properties',
      language: 'typescript',
      task_type: 'generation' as const
    };

    const result = await orchestrator.execute(request);

    expect(result.success).toBe(true);
    expect(result.output).toContain('interface');
    expect(result.output).toContain('User');
    expect(result.executionTime).toBeGreaterThan(0);
  });

  test('should handle tool fallback on failure', async () => {
    // Mock primary tool failure
    const request = {
      prompt: 'Test fallback mechanism',
      task_type: 'generation' as const,
      timeout: 1 // Force timeout to trigger fallback
    };

    const result = await orchestrator.execute(request);

    // Should succeed via fallback even if primary fails
    expect(result.success).toBe(true);
    expect(result.tool).toBeDefined();
  });

  test('should perform health checks on all tools', async () => {
    await orchestrator.performHealthChecks();

    const status = orchestrator.getSystemStatus();

    expect(status.tools).toBeDefined();
    expect(status.availableTools.length).toBeGreaterThan(0);
    expect(status.lastHealthCheck).toBeInstanceOf(Date);
  });
});
```

---

## 8. DEPLOYMENT CONFIGURATION

```typescript
// File: src/config/cliConfig.ts
export const CLI_CONFIG = {
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    timeout: 30000,
    retryAttempts: 3
  },

  codellm: {
    apiKey: process.env.ABACUS_API_KEY,
    orgId: process.env.ABACUS_ORG_ID,
    projectRoot: process.cwd(),
    model: 'claude-sonnet-4'
  },

  codex: {
    apiKey: process.env.OPENAI_API_KEY,
    orgId: process.env.OPENAI_ORG_ID,
    model: 'gpt-4',
    auditMode: process.env.NODE_ENV === 'production',
    complianceLevel: 'enterprise' as const
  }
};
```

---

## 9. USAGE EXAMPLES FOR EUFM AGENTS

```typescript
// File: examples/eufmUsageExamples.ts
import { CLIOrchestrator } from '../src/tools/cliOrchestrator';

// Example 1: Fast funding opportunity analysis
async function quickFundingAnalysis(opportunity: string): Promise<string> {
  const orchestrator = new CLIOrchestrator();
  await orchestrator.initialize();

  const result = await orchestrator.execute({
    prompt: `Analyze this EU funding opportunity quickly: ${opportunity}`,
    task_type: 'analysis',
    priority: 'high', // Will route to Groq for speed
    timeout: 2000
  });

  return result.output;
}

// Example 2: High-quality proposal generation
async function generateProposal(requirements: string): Promise<string> {
  const orchestrator = new CLIOrchestrator();
  await orchestrator.initialize();

  const result = await orchestrator.execute({
    prompt: `Generate a comprehensive EU funding proposal for: ${requirements}`,
    language: 'markdown',
    task_type: 'generation', // Will route to CodeLLM for quality
    context: ['EU regulations', 'funding guidelines', 'compliance requirements']
  });

  return result.output;
}

// Example 3: Enterprise compliance validation
async function validateCompliance(proposalText: string): Promise<string> {
  const orchestrator = new CLIOrchestrator();
  await orchestrator.initialize();

  const result = await orchestrator.execute({
    prompt: `Review this proposal for GDPR and EU regulatory compliance: ${proposalText}`,
    task_type: 'analysis',
    context: ['enterprise compliance', 'GDPR requirements'], // Will route to Codex
    language: 'markdown'
  });

  return result.output;
}
```

---

## 10. ACCEPTANCE CRITERIA

### 10.1 Functional Requirements
- [ ] **Groq CLI**: Sub-second response times for simple requests
- [ ] **CodeLLM CLI**: Production-ready TypeScript code generation
- [ ] **Codex CLI**: Complete audit trail and compliance checking
- [ ] **Orchestrator**: Intelligent tool selection based on request characteristics
- [ ] **Fallback**: Automatic failover when primary tool is unavailable
- [ ] **Health Checks**: Real-time monitoring of all CLI tools
- [ ] **Integration**: Seamless integration with existing UBOS infrastructure

### 10.2 Performance Requirements
- [ ] **Groq**: Average response time < 1 second
- [ ] **CodeLLM**: Average response time < 5 seconds
- [ ] **Codex**: Average response time < 10 seconds (including audit)
- [ ] **System**: 99.9% availability across all tools
- [ ] **Fallback**: < 2 seconds additional latency on failover

### 10.3 Security Requirements
- [ ] **API Keys**: Secure storage and rotation
- [ ] **Audit Trail**: Complete logging for Codex operations
- [ ] **Compliance**: Automatic GDPR and security checks
- [ ] **Data Sanitization**: Remove sensitive data from logs
- [ ] **Access Control**: Role-based access to different tools

---

**IMPLEMENTATION NOTES FOR GEMINI:**

1. **Priority**: Focus on Groq and CodeLLM wrappers first - these are critical for the Sept 18 deadline
2. **Testing**: Each wrapper must pass integration tests before integration
3. **Error Handling**: Robust error handling is critical for production use
4. **Logging**: Use existing AgentActionLogger for all CLI operations
5. **Configuration**: Use environment variables for all API keys and settings
6. **Documentation**: Add JSDoc comments for all public methods
7. **TypeScript**: Maintain strict type safety throughout

This specification provides complete implementation details for integrating all three CLI tools into the UBOS 2.0 EUFM system. The wrappers are designed to work seamlessly with the 4-stage agent pipeline while providing enterprise-grade reliability, compliance, and performance monitoring.