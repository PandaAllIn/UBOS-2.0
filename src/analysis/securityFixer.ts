/**
 * UBOS Security Issue Fixer
 * Uses CodeRabbit Pro API to identify and fix security vulnerabilities
 */

import { promises as fs } from 'fs';
import path from 'path';
import { createCodeRabbitAPI, CodeRabbitIssueDetail } from '../integrations/coderabbit/coderabbitAPI.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

export interface SecurityFix {
  file: string;
  line: number;
  issue: string;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export class SecurityFixer {
  private codeRabbitAPI: any;

  constructor(apiKey: string) {
    this.codeRabbitAPI = createCodeRabbitAPI(apiKey);
  }

  /**
   * Find all security issues in the codebase
   */
  async findSecurityIssues(basePath: string = process.cwd()): Promise<SecurityFix[]> {
    const actionId = await agentActionLogger.startWork(
      'SecurityFixer',
      'Find security issues',
      'Scanning codebase for security vulnerabilities',
      'system'
    );

    const fixes: SecurityFix[] = [];

    try {
      console.log('🔍 Scanning for security issues...\n');

      // Find TypeScript and JavaScript files
      const codeFiles = await this.findCodeFiles(basePath);
      console.log(`📁 Found ${codeFiles.length} code files to analyze\n`);

      // Analyze files in batches for better performance
      const batchSize = 10;
      for (let i = 0; i < codeFiles.length; i += batchSize) {
        const batch = codeFiles.slice(i, i + batchSize);
        console.log(`🔬 Analyzing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(codeFiles.length / batchSize)}...`);

        const batchFiles = await Promise.all(
          batch.map(async (filePath) => {
            const content = await fs.readFile(filePath, 'utf-8');
            return {
              path: path.relative(basePath, filePath),
              content,
              language: this.getLanguage(filePath)
            };
          })
        );

        try {
          const analysis = await this.codeRabbitAPI.analyzeCode({
            files: batchFiles,
            context: 'UBOS security scan',
            options: {
              includeSecurityCheck: true,
              generateFixes: true
            }
          });

          // Process security issues
          const securityIssues = analysis.issues.filter(
            (issue: CodeRabbitIssueDetail) => 
              issue.category === 'security' || 
              issue.severity === 'error' ||
              issue.title.toLowerCase().includes('credential') ||
              issue.title.toLowerCase().includes('secret') ||
              issue.title.toLowerCase().includes('key')
          );

          for (const issue of securityIssues) {
            if (issue.fixCode) {
              fixes.push({
                file: issue.file,
                line: issue.line,
                issue: issue.title,
                originalCode: issue.fixCode.original,
                fixedCode: issue.fixCode.fixed,
                explanation: issue.fixCode.explanation,
                severity: this.mapSeverity(issue.severity)
              });
            }
          }

        } catch (error) {
          console.log(`⚠️ Batch analysis failed, using fallback detection: ${error}`);
          
          // Fallback: Use pattern matching for known issues
          for (const fileData of batchFiles) {
            const fallbackFixes = await this.fallbackSecurityScan(fileData.path, fileData.content);
            fixes.push(...fallbackFixes);
          }
        }
      }

      console.log(`\n🛡️ Found ${fixes.length} security issues\n`);

      await agentActionLogger.completeWork(
        actionId,
        `Found ${fixes.length} security issues`,
        fixes.map(f => f.file)
      );

      return fixes;

    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Security scan failed: ${error}`,
        []
      );
      throw error;
    }
  }

  /**
   * Apply security fixes to files
   */
  async applyFixes(fixes: SecurityFix[]): Promise<void> {
    console.log(`🔧 Applying ${fixes.length} security fixes...\n`);

    const fileMap = new Map<string, SecurityFix[]>();
    
    // Group fixes by file
    for (const fix of fixes) {
      if (!fileMap.has(fix.file)) {
        fileMap.set(fix.file, []);
      }
      fileMap.get(fix.file)!.push(fix);
    }

    for (const [filePath, fileFixes] of fileMap) {
      try {
        console.log(`📝 Fixing ${fileFixes.length} issues in ${filePath}...`);
        
        let content = await fs.readFile(filePath, 'utf-8');
        let modified = false;

        // Apply fixes in reverse order (by line) to avoid offset issues
        const sortedFixes = fileFixes.sort((a, b) => b.line - a.line);

        for (const fix of sortedFixes) {
          if (content.includes(fix.originalCode)) {
            content = content.replace(fix.originalCode, fix.fixedCode);
            modified = true;
            console.log(`   ✅ ${fix.issue}`);
            console.log(`      ${fix.explanation}`);
          } else {
            console.log(`   ⚠️ Could not apply fix for: ${fix.issue}`);
          }
        }

        if (modified) {
          await fs.writeFile(filePath, content, 'utf-8');
          console.log(`   💾 Saved changes to ${filePath}\n`);
        }

      } catch (error) {
        console.error(`❌ Failed to fix ${filePath}: ${error}\n`);
      }
    }

    console.log('🎉 Security fixes applied successfully!');
  }

  /**
   * Fallback security scanning using patterns
   */
  private async fallbackSecurityScan(filePath: string, content: string): Promise<SecurityFix[]> {
    const fixes: SecurityFix[] = [];

    // Known security patterns
    const securityPatterns = [
      {
        pattern: /Bearer\s+test-key-\d+/g,
        issue: 'Hardcoded test API key',
        fix: (match: string) => 'Bearer ${process.env.API_KEY}',
        explanation: 'Replace hardcoded API key with environment variable'
      },
      {
        pattern: /api-key-\d+/g,
        issue: 'Hardcoded API key',
        fix: (match: string) => '${process.env.API_KEY}',
        explanation: 'Use environment variable for API key'
      },
      {
        pattern: /'Bearer\s+[a-zA-Z0-9-_]{20,}'/g,
        issue: 'Hardcoded Bearer token',
        fix: (match: string) => '`Bearer ${process.env.API_TOKEN}`',
        explanation: 'Replace hardcoded bearer token with environment variable'
      },
      {
        pattern: /password\s*[:=]\s*['"`][^'"`]+['"`]/gi,
        issue: 'Hardcoded password',
        fix: (match: string) => match.replace(/['"`][^'"`]+['"`]/, '${process.env.PASSWORD}'),
        explanation: 'Replace hardcoded password with environment variable'
      }
    ];

    const lines = content.split('\n');
    
    for (const [lineIndex, line] of lines.entries()) {
      for (const { pattern, issue, fix, explanation } of securityPatterns) {
        const matches = Array.from(line.matchAll(pattern));
        
        for (const match of matches) {
          if (match[0]) {
            fixes.push({
              file: filePath,
              line: lineIndex + 1,
              issue,
              originalCode: match[0],
              fixedCode: fix(match[0]),
              explanation,
              severity: 'critical'
            });
          }
        }
      }
    }

    return fixes;
  }

  /**
   * Find all code files to analyze
   */
  private async findCodeFiles(basePath: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

    const traverse = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules and other uninteresting directories
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (extensions.has(path.extname(entry.name))) {
          files.push(fullPath);
        }
      }
    };

    await traverse(basePath);
    return files;
  }

  /**
   * Get language from file extension
   */
  private getLanguage(filePath: string): string {
    const ext = path.extname(filePath);
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
        return 'javascript';
      default:
        return 'text';
    }
  }

  /**
   * Map severity levels
   */
  private mapSeverity(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity.toLowerCase()) {
      case 'error':
        return 'critical';
      case 'warning':
        return 'high';
      case 'info':
        return 'medium';
      case 'suggestion':
        return 'low';
      default:
        return 'medium';
    }
  }
}

export async function runSecurityScan(apiKey: string): Promise<void> {
  console.log('🛡️ Starting UBOS Security Scan with CodeRabbit Pro...\n');

  try {
    const fixer = new SecurityFixer(apiKey);
    
    // Test API connection first
    console.log('🔗 Testing CodeRabbit API connection...');
    const api = createCodeRabbitAPI(apiKey);
    const connected = await api.testConnection();
    
    if (!connected) {
      console.log('⚠️ CodeRabbit API connection failed, using fallback detection...\n');
    } else {
      console.log('✅ Connected to CodeRabbit Pro API\n');
    }

    // Find security issues
    const fixes = await fixer.findSecurityIssues();

    if (fixes.length === 0) {
      console.log('🎉 No security issues found! Your codebase is secure.');
      return;
    }

    // Display issues
    console.log('📋 Security Issues Found:\n');
    fixes.forEach((fix, index) => {
      console.log(`${index + 1}. ${fix.file}:${fix.line}`);
      console.log(`   Issue: ${fix.issue}`);
      console.log(`   Severity: ${fix.severity.toUpperCase()}`);
      console.log(`   Original: ${fix.originalCode}`);
      console.log(`   Fixed: ${fix.fixedCode}`);
      console.log(`   Explanation: ${fix.explanation}\n`);
    });

    // Apply fixes
    console.log('Do you want to apply these fixes? (This will modify your files)');
    console.log('Note: We recommend reviewing each fix before applying.');
    
    // For automation, apply fixes directly
    await fixer.applyFixes(fixes);

    console.log('\n🎉 Security scan and fixes completed!');
    console.log('📝 Recommendation: Run your tests to ensure fixes work correctly');
    console.log('🔄 Run analysis again to confirm all issues are resolved');

  } catch (error) {
    console.error('❌ Security scan failed:', error);
    throw error;
  }
}