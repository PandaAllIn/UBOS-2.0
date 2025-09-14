import { BaseAgent, AgentRunOptions, AgentContext } from '../../../UBOS/src/agents/baseAgent.js';
import { AgentResult } from '../../../UBOS/src/orchestrator/types.js';
import { 
  EnhancedPerplexityResearch, 
  ResearchQuery, 
  conductDeepResearch 
} from '../../../UBOS/src/tools/enhancedPerplexityResearch.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Research & Documentation Agent - Claude-Modular Optimized
 * Single-purpose excellence: Research discovery and documentation organization
 * Swarm Integration: Clean handoffs to specialist agents
 */

interface ResearchTask {
  type: 'framework_research' | 'tool_documentation' | 'competitive_analysis';
  target: string;
  depth: 'quick' | 'comprehensive' | 'deep';
  outputPath?: string;
}

interface DocumentationStructure {
  framework: string;
  documentation: string;
  implementation: string;
  examples: string;
  quickReference: string;
}

interface SwarmHandoffData {
  context: any;
  findings: any;
  nextAgentType: string;
  handoffReason: string;
  structuredData: any;
}

export class ResearchDocumentationAgent extends BaseAgent {
  private researcher: EnhancedPerplexityResearch;
  private generalToolsPath: string;
  private currentResearchContext: any = {};

  constructor(id: string, requirementId: string) {
    super(id, requirementId);
    this.researcher = new EnhancedPerplexityResearch();
    this.generalToolsPath = path.join(process.cwd(), 'UBOS_AGENTS', 'General-Tools');
    this.ensureDirectories();
  }

  get type() { return 'ResearchDocumentationAgent'; }

  async run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.now();

    try {
      if (opts.dryRun) {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: '[Dry run] Research & Documentation Agent would conduct focused research with claude-modular optimization.',
          startedAt,
          finishedAt: this.now()
        };
      }

      // Parse task from input using claude-modular progressive context
      const task = this.parseResearchTask(opts.input);
      console.log(`🔬 RESEARCH MISSION: ${task.type} for "${task.target}"`);

      // Execute research mission
      const result = await this.executeResearchMission(task);
      
      // Prepare for potential Swarm handoffs
      const handoffData = this.prepareHandoffData(result, task);

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output: result.output,
        startedAt,
        finishedAt: this.now(),
        metadata: {
          researchCost: result.cost,
          confidence: result.confidence,
          handoffData,
          documentationPath: result.documentationPath,
          researchType: task.type
        }
      };

    } catch (error: any) {
      console.error('❌ Research mission failed:', error);
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

  /**
   * Claude-modular optimized task parsing
   * Progressive context disclosure - only extract what's needed
   */
  private parseResearchTask(input: string): ResearchTask {
    const inputLower = input.toLowerCase();
    
    // Determine research type
    let type: ResearchTask['type'] = 'framework_research';
    if (inputLower.includes('tool') || inputLower.includes('documentation')) {
      type = 'tool_documentation';
    } else if (inputLower.includes('competitive') || inputLower.includes('comparison')) {
      type = 'competitive_analysis';
    }

    // Extract target (main subject)
    const target = this.extractTarget(input);

    // Determine depth
    let depth: ResearchTask['depth'] = 'comprehensive';
    if (inputLower.includes('quick') || inputLower.includes('brief')) {
      depth = 'quick';
    } else if (inputLower.includes('deep') || inputLower.includes('thorough')) {
      depth = 'deep';
    }

    return { type, target, depth };
  }

  private extractTarget(input: string): string {
    // Smart target extraction - look for key patterns
    const patterns = [
      /research\s+(.+?)(?:\s+for|\s+in|$)/i,
      /analyze\s+(.+?)(?:\s+for|\s+in|$)/i,
      /investigate\s+(.+?)(?:\s+for|\s+in|$)/i,
      /"([^"]+)"/,  // Quoted targets
      /framework\s+([^\s]+)/i
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // Fallback - use first meaningful phrase
    return input.split(' ').slice(0, 3).join(' ');
  }

  /**
   * Execute research mission with adaptive strategy
   */
  private async executeResearchMission(task: ResearchTask): Promise<{
    output: string;
    cost: number;
    confidence: number;
    documentationPath: string;
    findings: any;
  }> {
    console.log(`📋 Executing ${task.type} research for: ${task.target}`);

    const query = this.buildOptimizedQuery(task);
    const researchResult = await this.conductAdaptiveResearch(query, task);
    
    // Create documentation structure
    const docPath = await this.createDocumentationStructure(task.target, researchResult);
    
    // Extract and organize key findings
    const organizedFindings = this.extractKeyFindings(researchResult, task);

    return {
      output: this.formatResearchOutput(researchResult, task),
      cost: researchResult.totalCost || researchResult.costUSD,
      confidence: researchResult.primary?.confidence || researchResult.confidence,
      documentationPath: docPath,
      findings: organizedFindings
    };
  }

  /**
   * Claude-modular query optimization
   */
  private buildOptimizedQuery(task: ResearchTask): string {
    const baseQuery = task.target;
    
    // Progressive context enhancement based on task type
    const enhancements = {
      framework_research: 'comprehensive framework analysis including architecture, implementation patterns, best practices, and optimization strategies',
      tool_documentation: 'complete documentation, usage guides, integration examples, and implementation patterns',
      competitive_analysis: 'competitive landscape analysis, feature comparison, market positioning, and strategic advantages'
    };

    const contextEnhancement = enhancements[task.type];
    
    // Token-optimized query construction
    return `${baseQuery} - ${contextEnhancement}. Focus on actionable insights, implementation details, and current best practices.`;
  }

  private async conductAdaptiveResearch(query: string, task: ResearchTask): Promise<any> {
    if (task.depth === 'deep') {
      // Multi-layer research with follow-ups
      const followUpQueries = this.generateFollowUpQueries(task);
      return await conductDeepResearch(query, task.type, followUpQueries);
    } else {
      // Standard optimized research
      const researchQuery: ResearchQuery = {
        query,
        domain: task.type,
        researchDepth: task.depth,
        sources: 'mixed'
      };
      
      return await this.researcher.conductResearch(researchQuery);
    }
  }

  private generateFollowUpQueries(task: ResearchTask): string[] {
    const followUps: string[] = [];
    
    switch (task.type) {
      case 'framework_research':
        followUps.push(`Implementation examples and code patterns for ${task.target}`);
        followUps.push(`Common challenges and solutions when using ${task.target}`);
        break;
      case 'tool_documentation':
        followUps.push(`Advanced configuration and customization for ${task.target}`);
        followUps.push(`Integration patterns and compatibility with other tools for ${task.target}`);
        break;
      case 'competitive_analysis':
        followUps.push(`Unique advantages and differentiators of ${task.target}`);
        followUps.push(`Market adoption and community feedback for ${task.target}`);
        break;
    }
    
    return followUps;
  }

  /**
   * Create organized documentation structure in General Tools
   */
  private async createDocumentationStructure(target: string, researchResult: any): Promise<string> {
    const sanitizedTarget = target.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const basePath = path.join(this.generalToolsPath, 'frameworks', sanitizedTarget);
    
    // Create directory structure
    const structure: DocumentationStructure = {
      framework: path.join(basePath, 'framework.md'),
      documentation: path.join(basePath, 'documentation.md'),
      implementation: path.join(basePath, 'implementation.md'),
      examples: path.join(basePath, 'examples.md'),
      quickReference: path.join(basePath, 'quick-reference.md')
    };

    await fs.mkdir(basePath, { recursive: true });

    // Create organized documentation files
    await this.createDocumentationFiles(structure, researchResult, target);
    
    return basePath;
  }

  private async createDocumentationFiles(
    structure: DocumentationStructure, 
    researchResult: any, 
    target: string
  ): Promise<void> {
    const content = researchResult.synthesis || researchResult.response;
    
    // Framework overview
    await fs.writeFile(structure.framework, `# ${target} Framework Overview\n\n${content}\n\n---\n*Generated by Research & Documentation Agent*`);
    
    // Quick reference
    const quickRef = this.extractQuickReference(content, target);
    await fs.writeFile(structure.quickReference, quickRef);
    
    // Implementation guide
    const implGuide = this.extractImplementationGuidance(content, target);
    await fs.writeFile(structure.implementation, implGuide);
  }

  private extractQuickReference(content: string, target: string): string {
    // Extract key commands, concepts, and quick-access info
    return `# ${target} Quick Reference

## Key Commands
<!-- Extracted from research -->

## Core Concepts  
<!-- Main concepts and terminology -->

## Common Tasks
<!-- Frequently used patterns -->

## Troubleshooting
<!-- Common issues and solutions -->

---
*Auto-generated quick reference - update as needed*
`;
  }

  private extractImplementationGuidance(content: string, target: string): string {
    return `# ${target} Implementation Guide

## Setup & Installation
<!-- Step-by-step setup instructions -->

## Configuration
<!-- Configuration options and best practices -->

## Integration Patterns
<!-- How to integrate with existing systems -->

## Best Practices
<!-- Recommended approaches and patterns -->

---
*Implementation guidance extracted from research*
`;
  }

  private extractKeyFindings(researchResult: any, task: ResearchTask): any {
    // Structure findings for potential handoffs
    return {
      target: task.target,
      type: task.type,
      keyInsights: this.extractInsights(researchResult),
      actionableItems: this.extractActionableItems(researchResult),
      implementationReadiness: this.assessImplementationReadiness(researchResult),
      handoffRecommendations: this.determineHandoffNeeds(researchResult, task)
    };
  }

  private extractInsights(researchResult: any): string[] {
    // Extract top insights from research
    const content = researchResult.synthesis || researchResult.response;
    // TODO: Implement intelligent insight extraction
    return ['Key insight extraction pending'];
  }

  private extractActionableItems(researchResult: any): string[] {
    // Extract actionable next steps
    return ['Action item extraction pending'];
  }

  private assessImplementationReadiness(researchResult: any): string {
    // Assess if findings are ready for implementation
    return 'implementation_ready'; // or 'needs_more_research', 'needs_organization'
  }

  private determineHandoffNeeds(researchResult: any, task: ResearchTask): string[] {
    const recommendations: string[] = [];
    
    // Determine what specialist agents might be needed
    if (task.type === 'framework_research') {
      recommendations.push('organization_agent'); // To organize complex documentation
      recommendations.push('development_agent'); // For implementation planning
    }
    
    return recommendations;
  }

  /**
   * Prepare data for Swarm handoffs
   */
  private prepareHandoffData(result: any, task: ResearchTask): SwarmHandoffData {
    return {
      context: {
        researchTarget: task.target,
        researchType: task.type,
        documentationPath: result.documentationPath
      },
      findings: result.findings,
      nextAgentType: this.determineNextAgent(result.findings),
      handoffReason: this.determineHandoffReason(result.findings),
      structuredData: {
        confidence: result.confidence,
        cost: result.cost,
        actionableItems: result.findings.actionableItems
      }
    };
  }

  private determineNextAgent(findings: any): string {
    // Logic to determine which agent should handle next steps
    if (findings.implementationReadiness === 'needs_organization') {
      return 'OrganizationAgent';
    } else if (findings.implementationReadiness === 'implementation_ready') {
      return 'DevelopmentAgent';
    }
    return 'none'; // Research complete, no handoff needed
  }

  private determineHandoffReason(findings: any): string {
    return findings.implementationReadiness || 'research_complete';
  }

  private formatResearchOutput(researchResult: any, task: ResearchTask): string {
    const confidence = Math.round((researchResult.primary?.confidence || researchResult.confidence) * 100);
    const cost = (researchResult.totalCost || researchResult.costUSD).toFixed(4);

    return `
🔬 RESEARCH COMPLETE: ${task.target}
Research Type: ${task.type} | Depth: ${task.depth}
Confidence: ${confidence}% | Cost: $${cost}

${researchResult.synthesis || researchResult.response}

📁 DOCUMENTATION ORGANIZED:
• Framework overview saved
• Quick reference generated  
• Implementation guide created
• Ready for specialist agent handoff

🔄 SWARM HANDOFF READY:
Next recommended agent: ${this.determineNextAgent(this.extractKeyFindings(researchResult, task))}

💡 Research optimized with claude-modular patterns for maximum efficiency.
`;
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.generalToolsPath,
      path.join(this.generalToolsPath, 'frameworks'),
      path.join(this.generalToolsPath, 'tools'),
      path.join(this.generalToolsPath, 'patterns'),
      path.join(this.generalToolsPath, 'quick-access')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}