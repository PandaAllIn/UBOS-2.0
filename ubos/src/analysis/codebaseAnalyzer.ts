/**
 * UBOS Codebase Analyzer
 * Comprehensive analysis and organization tool for the entire UBOS codebase
 */

import { promises as fs, Stats } from 'fs';
import path from 'path';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

export interface FileAnalysis {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
  category: 'core' | 'agent' | 'integration' | 'config' | 'test' | 'docs' | 'legacy' | 'unknown';
  importance: 'critical' | 'important' | 'useful' | 'unused' | 'legacy';
  dependencies: string[];
  exports: string[];
  imports: string[];
  complexity: number;
  issues: string[];
  recommendations: string[];
}

export interface ComponentAnalysis {
  name: string;
  type: 'service' | 'agent' | 'integration' | 'utility' | 'config' | 'ui';
  files: FileAnalysis[];
  status: 'active' | 'deprecated' | 'legacy' | 'broken';
  usage: 'high' | 'medium' | 'low' | 'none';
  dependencies: string[];
  dependents: string[];
  description: string;
  lastActivity: Date;
}

export interface CodebaseOverview {
  totalFiles: number;
  totalLines: number;
  languages: Record<string, number>;
  components: ComponentAnalysis[];
  unusedFiles: FileAnalysis[];
  criticalIssues: string[];
  recommendations: string[];
  architectureMap: {
    core: ComponentAnalysis[];
    agents: ComponentAnalysis[];
    integrations: ComponentAnalysis[];
    utilities: ComponentAnalysis[];
    legacy: ComponentAnalysis[];
  };
}

export class CodebaseAnalyzer {
  private basePath: string;
  private excludePatterns: string[] = [
    'node_modules',
    '.git',
    'dist',
    'build', 
    '*.log',
    '.env*',
    '*.tsbuildinfo'
  ];

  constructor(basePath: string = process.cwd()) {
    this.basePath = basePath;
  }

  /**
   * Analyze the entire UBOS codebase
   */
  async analyzeCodebase(): Promise<CodebaseOverview> {
    const actionId = await agentActionLogger.startWork(
      'CodebaseAnalyzer',
      'Full codebase analysis',
      'Analyzing entire UBOS codebase for organization and optimization',
      'system'
    );

    try {
      console.log('🔍 Starting comprehensive UBOS codebase analysis...\n');

      // Step 1: Discover all files
      console.log('📁 Discovering files...');
      const allFiles = await this.discoverFiles();
      console.log(`   Found ${allFiles.length} files\n`);

      // Step 2: Analyze each file
      console.log('🔬 Analyzing file contents...');
      const fileAnalyses = await Promise.all(
        allFiles.map(filePath => this.analyzeFile(filePath))
      );
      console.log(`   Analyzed ${fileAnalyses.length} files\n`);

      // Step 3: Group into components
      console.log('🧩 Grouping into components...');
      const components = await this.groupIntoComponents(fileAnalyses);
      console.log(`   Identified ${components.length} components\n`);

      // Step 4: Analyze dependencies
      console.log('🔗 Analyzing dependencies...');
      await this.analyzeDependencies(components);
      console.log('   Dependency analysis complete\n');

      // Step 5: Generate overview
      console.log('📊 Generating overview...');
      const overview = await this.generateOverview(fileAnalyses, components);
      console.log('   Overview generated\n');

      await agentActionLogger.completeWork(
        actionId,
        `Analyzed ${allFiles.length} files, found ${components.length} components`,
        ['codebase-analysis.json']
      );

      return overview;

    } catch {
      await agentActionLogger.completeWork(
        actionId,
        `Analysis failed`,
        []
      );
      throw new Error('Analysis failed');
    }
  }

  /**
   * Discover all relevant files in the codebase
   */
  private async discoverFiles(): Promise<string[]> {
    const files: string[] = [];

    const traverse = async (dirPath: string): Promise<void> => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip excluded patterns
        if (this.shouldExclude(fullPath)) continue;

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };

    await traverse(this.basePath);
    return files;
  }

  /**
   * Analyze individual file
   */
  private async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const relativePath = path.relative(this.basePath, filePath);
    const stats = await fs.stat(filePath);
    const extension = path.extname(filePath);
    const name = path.basename(filePath);

    let content = '';
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      // Binary file or permission issue
    }

    const analysis: FileAnalysis = {
      path: relativePath,
      name,
      extension,
      size: stats.size,
      lastModified: stats.mtime,
      category: this.categorizeFile(relativePath),
      importance: this.assessImportance(relativePath, content, stats),
      dependencies: this.extractDependencies(content),
      exports: this.extractExports(content),
      imports: this.extractImports(content),
      complexity: this.calculateComplexity(content),
      issues: this.findIssues(relativePath, content),
      recommendations: this.generateRecommendations(relativePath, content)
    };

    return analysis;
  }

  /**
   * Categorize file based on path and content
   */
  private categorizeFile(filePath: string): FileAnalysis['category'] {
    const pathLower = filePath.toLowerCase();

    // Core system files
    if (pathLower.includes('/kernel/') || pathLower.includes('/mastercontrol/') || pathLower.includes('server.ts')) {
      return 'core';
    }

    // Agent files
    if (pathLower.includes('/agents/') || pathLower.includes('agent.ts') || pathLower.includes('agent.js')) {
      return 'agent';
    }

    // Integration files
    if (pathLower.includes('/integrations/') || pathLower.includes('/api/') || pathLower.includes('/middleware/')) {
      return 'integration';
    }

    // Configuration files
    if (pathLower.includes('config') || filePath.endsWith('.json') || filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      return 'config';
    }

    // Test files
    if (pathLower.includes('test') || pathLower.includes('spec') || pathLower.includes('__tests__')) {
      return 'test';
    }

    // Documentation
    if (filePath.endsWith('.md') || pathLower.includes('/docs/')) {
      return 'docs';
    }

    // Legacy indicators
    if (pathLower.includes('legacy') || pathLower.includes('deprecated') || pathLower.includes('old')) {
      return 'legacy';
    }

    return 'unknown';
  }

  /**
   * Assess file importance
   */
  private assessImportance(filePath: string, content: string, stats: Stats): FileAnalysis['importance'] {
    const pathLower = filePath.toLowerCase();
    const age = Date.now() - stats.mtime.getTime();
    const ageInDays = age / (1000 * 60 * 60 * 24);

    // Critical files
    if (pathLower.includes('package.json') || pathLower.includes('tsconfig') || pathLower.includes('/kernel/') || pathLower.includes('server.ts')) {
      return 'critical';
    }

    // Recently modified = likely important
    if (ageInDays < 30 && content.length > 100) {
      return 'important';
    }

    // Has imports/exports = being used
    if (content.includes('import ') || content.includes('export ') || content.includes('module.exports')) {
      return 'useful';
    }

    // Old and no recent changes
    if (ageInDays > 180) {
      return 'legacy';
    }

    // Small files with no clear purpose
    if (stats.size < 100) {
      return 'unused';
    }

    return 'useful';
  }

  /**
   * Extract dependencies from file content
   */
  private extractDependencies(content: string): string[] {
    const deps: string[] = [];
    const importRegex = /import.*from ['"`]([^'"`]+)['"`]/g;
    const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }
    while ((match = requireRegex.exec(content)) !== null) {
      deps.push(match[1]);
    }

    return [...new Set(deps)];
  }

  /**
   * Extract exports from file content
   */
  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportRegex = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
    const namedExportRegex = /export\s+\{([^}]+)\}/g;

    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    while ((match = namedExportRegex.exec(content)) !== null) {
      const named = match[1].split(',').map(n => n.trim().split(' as ')[0]);
      exports.push(...named);
    }

    return [...new Set(exports)];
  }

  /**
   * Extract imports from file content
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:\{([^}]+)\}|\w+|\*\s+as\s+\w+)/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        const named = match[1].split(',').map(n => n.trim().split(' as ')[0]);
        imports.push(...named);
      }
    }

    return [...new Set(imports)];
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexity(content: string): number {
    let complexity = 1; // Base complexity

    // Count control structures
    complexity += (content.match(/if\s*\(/g) || []).length;
    complexity += (content.match(/for\s*\(/g) || []).length;
    complexity += (content.match(/while\s*\(/g) || []).length;
    complexity += (content.match(/switch\s*\(/g) || []).length;
    complexity += (content.match(/catch\s*\(/g) || []).length;
    complexity += (content.match(/\?\s*.*:/g) || []).length; // Ternary operators

    return complexity;
  }

  /**
   * Find potential issues
   */
  private findIssues(filePath: string, content: string): string[] {
    const issues: string[] = [];

    // Security issues
    if (content.includes('Bearer test-key') || content.includes('${process.env.API_KEY}')) {
      issues.push('Hardcoded credentials detected');
    }

    // Performance issues
    if (content.includes('console.log') && !filePath.includes('test')) {
      issues.push('Debug statements in production code');
    }

    // Maintenance issues
    if (content.includes('TODO') || content.includes('FIXME')) {
      issues.push('Unresolved TODOs/FIXMEs');
    }

    // Structure issues
    if (filePath.endsWith('.ts') && !content.includes('export') && !content.includes('import')) {
      issues.push('TypeScript file with no imports/exports');
    }

    return issues;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(filePath: string, content: string): string[] {
    const recommendations: string[] = [];

    // File size recommendations
    if (content.split('\n').length > 500) {
      recommendations.push('Consider breaking down large file into smaller modules');
    }

    // Naming recommendations  
    if (filePath.includes('untitled') || filePath.includes('temp')) {
      recommendations.push('Rename file to better reflect its purpose');
    }

    // Documentation recommendations
    if (content.includes('export class') && !content.includes('/**')) {
      recommendations.push('Add JSDoc documentation for exported classes');
    }

    return recommendations;
  }

  /**
   * Group files into logical components
   */
  private async groupIntoComponents(files: FileAnalysis[]): Promise<ComponentAnalysis[]> {
    const components: ComponentAnalysis[] = [];
    const grouped = new Map<string, FileAnalysis[]>();

    // Group by directory structure
    for (const file of files) {
      const parts = file.path.split('/');
      const componentKey = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
      
      if (!grouped.has(componentKey)) {
        grouped.set(componentKey, []);
      }
      grouped.get(componentKey)!.push(file);
    }

    // Convert to ComponentAnalysis
    for (const [key, groupFiles] of grouped) {
      if (groupFiles.length === 0) continue;

      const component: ComponentAnalysis = {
        name: key === 'root' ? 'Root Files' : path.basename(key),
        type: this.determineComponentType(key, groupFiles),
        files: groupFiles,
        status: this.determineComponentStatus(groupFiles),
        usage: this.determineComponentUsage(groupFiles),
        dependencies: [],
        dependents: [],
        description: this.generateComponentDescription(key, groupFiles),
        lastActivity: new Date(Math.max(...groupFiles.map(f => f.lastModified.getTime())))
      };

      components.push(component);
    }

    return components;
  }

  /**
   * Determine component type
   */
  private determineComponentType(path: string, files: FileAnalysis[]): ComponentAnalysis['type'] {
    const pathLower = path.toLowerCase();

    if (pathLower.includes('agent')) return 'agent';
    if (pathLower.includes('integration') || pathLower.includes('api')) return 'integration';
    if (pathLower.includes('service') || pathLower.includes('kernel')) return 'service';
    if (pathLower.includes('util') || pathLower.includes('helper')) return 'utility';
    if (pathLower.includes('dashboard') || pathLower.includes('ui')) return 'ui';
    
    // Check file extensions
    const hasUI = files.some(f => f.extension === '.html' || f.extension === '.css' || f.extension === '.jsx' || f.extension === '.tsx');
    if (hasUI) return 'ui';

    const hasConfig = files.some(f => f.extension === '.json' || f.extension === '.yaml' || f.extension === '.yml');
    if (hasConfig) return 'config';

    return 'utility';
  }

  /**
   * Determine component status
   */
  private determineComponentStatus(files: FileAnalysis[]): ComponentAnalysis['status'] {
    const hasIssues = files.some(f => f.issues.length > 0);
    const isOld = files.every(f => {
      const age = Date.now() - f.lastModified.getTime();
      return age > (180 * 24 * 60 * 60 * 1000); // 180 days
    });

    if (hasIssues) return 'broken';
    if (isOld) return 'legacy';
    
    const hasLegacyMarkers = files.some(f => 
      f.path.includes('legacy') || f.path.includes('deprecated') || f.category === 'legacy'
    );
    
    if (hasLegacyMarkers) return 'deprecated';
    return 'active';
  }

  /**
   * Determine component usage
   */
  private determineComponentUsage(files: FileAnalysis[]): ComponentAnalysis['usage'] {
    const totalImports = files.reduce((sum, f) => sum + f.imports.length, 0);
    const totalExports = files.reduce((sum, f) => sum + f.exports.length, 0);
    const avgComplexity = files.reduce((sum, f) => sum + f.complexity, 0) / files.length;

    if (totalExports > 10 && totalImports > 5) return 'high';
    if (totalExports > 3 || avgComplexity > 10) return 'medium';
    if (totalExports > 0) return 'low';
    return 'none';
  }

  /**
   * Generate component description
   */
  private generateComponentDescription(path: string, files: FileAnalysis[]): string {
    const fileTypes = [...new Set(files.map(f => f.extension))].join(', ');
    const categories = [...new Set(files.map(f => f.category))].join(', ');
    
    return `Component in ${path} containing ${files.length} files (${fileTypes}). Categories: ${categories}`;
  }

  /**
   * Analyze dependencies between components
   */
  private async analyzeDependencies(components: ComponentAnalysis[]): Promise<void> {
    // This would analyze import/export relationships between components
    // For now, we'll do a simplified version
    
    for (const component of components) {
      const allDeps = component.files.flatMap(f => f.dependencies);
      component.dependencies = [...new Set(allDeps)];
    }
  }

  /**
   * Generate final overview
   */
  private async generateOverview(files: FileAnalysis[], components: ComponentAnalysis[]): Promise<CodebaseOverview> {
    const totalLines = await this.countTotalLines(files);
    const languages = this.analyzeLangages(files);
    const unusedFiles = files.filter(f => f.importance === 'unused');
    const criticalIssues = files.flatMap(f => f.issues).filter(i => i.includes('security') || i.includes('credential'));

    return {
      totalFiles: files.length,
      totalLines,
      languages,
      components,
      unusedFiles,
      criticalIssues,
      recommendations: this.generateGlobalRecommendations(files, components),
      architectureMap: {
        core: components.filter(c => c.type === 'service'),
        agents: components.filter(c => c.type === 'agent'),
        integrations: components.filter(c => c.type === 'integration'),
        utilities: components.filter(c => c.type === 'utility'),
        legacy: components.filter(c => c.status === 'legacy' || c.status === 'deprecated')
      }
    };
  }

  /**
   * Count total lines of code
   */
  private async countTotalLines(files: FileAnalysis[]): Promise<number> {
    let totalLines = 0;
    
    for (const file of files) {
      if (file.extension === '.ts' || file.extension === '.js' || file.extension === '.tsx' || file.extension === '.jsx') {
        try {
          const content = await fs.readFile(path.join(this.basePath, file.path), 'utf-8');
          totalLines += content.split('\n').length;
        } catch {
          // Skip files that can't be read
        }
      }
    }
    
    return totalLines;
  }

  /**
   * Analyze languages used
   */
  private analyzeLangages(files: FileAnalysis[]): Record<string, number> {
    const languages: Record<string, number> = {};
    
    for (const file of files) {
      const ext = file.extension || 'no-extension';
      languages[ext] = (languages[ext] || 0) + 1;
    }
    
    return languages;
  }

  /**
   * Generate global recommendations
   */
  private generateGlobalRecommendations(files: FileAnalysis[], components: ComponentAnalysis[]): string[] {
    const recommendations: string[] = [];

    // Unused files
    const unusedCount = files.filter(f => f.importance === 'unused').length;
    if (unusedCount > 0) {
      recommendations.push(`Remove ${unusedCount} unused files to reduce clutter`);
    }

    // Legacy components
    const legacyCount = components.filter(c => c.status === 'legacy').length;
    if (legacyCount > 0) {
      recommendations.push(`Evaluate ${legacyCount} legacy components for removal or modernization`);
    }

    // Security issues
    const securityIssues = files.flatMap(f => f.issues).filter(i => i.includes('credential')).length;
    if (securityIssues > 0) {
      recommendations.push(`Address ${securityIssues} security issues immediately`);
    }

    // Documentation
    const undocumentedComponents = components.filter(c => c.files.every(f => !f.path.endsWith('.md'))).length;
    if (undocumentedComponents > 5) {
      recommendations.push('Add documentation for major components');
    }

    return recommendations;
  }

  /**
   * Check if file should be excluded
   */
  private shouldExclude(filePath: string): boolean {
    const relativePath = path.relative(this.basePath, filePath);
    
    return this.excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(relativePath);
      }
      return relativePath.includes(pattern);
    });
  }
}

export const codebaseAnalyzer = new CodebaseAnalyzer();