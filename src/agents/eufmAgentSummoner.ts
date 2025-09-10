import { BaseAgent, AgentRunOptions, AgentContext } from './baseAgent.js';
import { AgentResult } from '../orchestrator/types.js';
import { EnhancedPerplexityResearch, ResearchQuery } from '../tools/enhancedPerplexityResearch.js';
import { codexCLI } from '../tools/codexCLI.js';
import { promises as fs } from 'fs';
import path from 'path';
import { repoPath } from '../utils/paths.js';

interface EUFMTaskAnalysis {
  taskType: 'development' | 'research' | 'architecture' | 'integration' | 'documentation' | 'testing';
  complexity: 'simple' | 'moderate' | 'complex';
  requiredCapabilities: string[];
  suggestedAgents: string[];
  executionStrategy: string;
  estimatedTime: string;
  prerequisites: string[];
}

interface AgentRecommendation {
  agentType: string;
  suitabilityScore: number;
  reasoning: string;
  configuration: any;
  estimatedCost?: number;
}

export class EUFMAgentSummoner extends BaseAgent {
  private researcher: EnhancedPerplexityResearch;
  private knowledgeBase: Map<string, any> = new Map();

  constructor(id: string, requirementId: string) {
    super(id, requirementId);
    this.researcher = new EnhancedPerplexityResearch();
    this.loadEUFMKnowledge();
  }

  get type() { return 'EUFMAgentSummoner'; }

  private async loadEUFMKnowledge() {
    // Load EUFM-specific knowledge about agents and capabilities
    try {
      const projectOverview = await fs.readFile(
        repoPath('eufm', 'docs', 'general', 'PROJECT_OVERVIEW.md'),
        'utf-8'
      );
      const architecture = await fs.readFile(
        repoPath('eufm', 'docs', 'guides', 'architecture.md'),
        'utf-8'
      );
      
      this.knowledgeBase.set('project_overview', projectOverview);
      this.knowledgeBase.set('architecture', architecture);
      
      // Load agent capabilities
      this.knowledgeBase.set('available_agents', {
        'CodexAgent': {
          capabilities: ['coding', 'planning'],
          providers: ['OpenAI', 'Anthropic', 'Gemini'],
          cost: 'medium',
          speed: 'fast'
        },
        'CodexCLIAgent': {
          capabilities: ['coding', 'file_operations', 'system_access', 'direct_execution'],
          providers: ['Codex CLI'],
          cost: 'varies',
          speed: 'fast',
          special: 'direct_system_access'
        },
        'EnhancedAbacusAgent': {
          capabilities: ['research', 'analysis', 'data_gathering'],
          providers: ['Perplexity Pro'],
          cost: '~$0.05/query',
          speed: 'medium',
          quality: 'professional'
        },
        'JulesAgent': {
          capabilities: ['code_review', 'guidance'],
          providers: ['Gemini'],
          cost: 'low',
          speed: 'fast'
        },
        'BrowserAgent': {
          capabilities: ['web_automation', 'scraping'],
          providers: ['Playwright'],
          cost: 'low',
          speed: 'medium'
        },
        'AgentSummonerAgent': {
          capabilities: ['meta_analysis', 'agent_discovery'],
          providers: ['Perplexity Pro'],
          cost: '~$0.05/analysis',
          speed: 'medium',
          special: 'discovers_external_agents'
        }
      });

    } catch (error: any) {
      console.warn('Could not load EUFM knowledge base:', error);
    }
  }

  async run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult> {
    const startedAt = this.now();

    try {
      if (opts.dryRun) {
        return {
          agentId: this.id,
          requirementId: this.requirementId,
          success: true,
          output: '[Dry run] EUFM Agent Summoner would analyze task and recommend optimal agent configuration for EUFM project.',
          startedAt,
          finishedAt: this.now()
        };
      }

      // Analyze the task for EUFM context
      const analysis = await this.analyzeEUFMTask(opts.input, ctx);
      
      // Get agent recommendations
      const recommendations = await this.recommendAgents(analysis);
      
      // Create execution plan
      const executionPlan = this.createExecutionPlan(analysis, recommendations);
      
      // Generate output
      const output = this.formatRecommendations(analysis, recommendations, executionPlan);

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: true,
        output,
        startedAt,
        finishedAt: this.now(),
        metadata: {
          taskAnalysis: analysis,
          recommendations,
          executionPlan
        }
      };

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

  private async analyzeEUFMTask(input: string, ctx?: AgentContext): Promise<EUFMTaskAnalysis> {
    const inputLower = input.toLowerCase();
    
    // Determine task type
    let taskType: EUFMTaskAnalysis['taskType'] = 'development';
    if (inputLower.includes('research') || inputLower.includes('analyze') || inputLower.includes('investigate')) {
      taskType = 'research';
    } else if (inputLower.includes('architecture') || inputLower.includes('design') || inputLower.includes('structure')) {
      taskType = 'architecture';
    } else if (inputLower.includes('integrate') || inputLower.includes('connect') || inputLower.includes('api')) {
      taskType = 'integration';
    } else if (inputLower.includes('document') || inputLower.includes('readme') || inputLower.includes('guide')) {
      taskType = 'documentation';
    } else if (inputLower.includes('test') || inputLower.includes('verify') || inputLower.includes('validate')) {
      taskType = 'testing';
    }

    // Determine complexity
    let complexity: EUFMTaskAnalysis['complexity'] = 'moderate';
    const complexityIndicators = {
      simple: ['quick', 'simple', 'basic', 'single'],
      complex: ['complex', 'comprehensive', 'multiple', 'advanced', 'thorough', 'integrate']
    };
    
    if (complexityIndicators.simple.some(indicator => inputLower.includes(indicator))) {
      complexity = 'simple';
    } else if (complexityIndicators.complex.some(indicator => inputLower.includes(indicator))) {
      complexity = 'complex';
    }

    // Determine required capabilities
    const requiredCapabilities = [];
    if (inputLower.includes('code') || inputLower.includes('develop') || inputLower.includes('create')) {
      requiredCapabilities.push('coding');
    }
    if (inputLower.includes('research') || inputLower.includes('data') || inputLower.includes('analyze')) {
      requiredCapabilities.push('research');
    }
    if (inputLower.includes('file') || inputLower.includes('system') || inputLower.includes('install')) {
      requiredCapabilities.push('file_operations');
    }
    if (inputLower.includes('web') || inputLower.includes('browser') || inputLower.includes('scrape')) {
      requiredCapabilities.push('web_automation');
    }
    if (inputLower.includes('agent') && inputLower.includes('optimal')) {
      requiredCapabilities.push('meta_analysis');
    }

    return {
      taskType,
      complexity,
      requiredCapabilities,
      suggestedAgents: [], // Will be filled by recommendAgents
      executionStrategy: '',
      estimatedTime: this.estimateTime(complexity, requiredCapabilities.length),
      prerequisites: this.identifyPrerequisites(input, taskType)
    };
  }

  private async recommendAgents(analysis: EUFMTaskAnalysis): Promise<AgentRecommendation[]> {
    const recommendations: AgentRecommendation[] = [];
    const availableAgents = this.knowledgeBase.get('available_agents') || {};

    // Score each agent based on task requirements
    for (const [agentType, agentInfo] of Object.entries(availableAgents)) {
      const info = agentInfo as any;
      let suitabilityScore = 0;
      let reasoning = '';

      // Check capability match
      const capabilityMatches = analysis.requiredCapabilities.filter(cap => 
        info.capabilities.includes(cap)
      ).length;
      
      const capabilityScore = (capabilityMatches / Math.max(analysis.requiredCapabilities.length, 1)) * 100;
      suitabilityScore += capabilityScore * 0.6; // 60% weight for capabilities

      // Task type specific scoring
      switch (analysis.taskType) {
        case 'development':
          if (agentType === 'CodexCLIAgent') suitabilityScore += 30;
          else if (agentType === 'CodexAgent') suitabilityScore += 20;
          break;
        case 'research':
          if (agentType === 'EnhancedAbacusAgent') suitabilityScore += 30;
          else if (agentType === 'AgentSummonerAgent') suitabilityScore += 25;
          break;
        case 'architecture':
          if (agentType === 'CodexAgent') suitabilityScore += 25;
          else if (agentType === 'AgentSummonerAgent') suitabilityScore += 20;
          break;
        case 'integration':
          if (agentType === 'CodexCLIAgent') suitabilityScore += 30;
          else if (agentType === 'BrowserAgent') suitabilityScore += 20;
          break;
        case 'documentation':
          if (agentType === 'CodexCLIAgent') suitabilityScore += 25;
          else if (agentType === 'CodexAgent') suitabilityScore += 20;
          break;
        case 'testing':
          if (agentType === 'CodexCLIAgent') suitabilityScore += 30;
          else if (agentType === 'JulesAgent') suitabilityScore += 15;
          break;
      }

      // Complexity adjustment
      if (analysis.complexity === 'complex' && info.special) suitabilityScore += 10;
      if (analysis.complexity === 'simple' && info.speed === 'fast') suitabilityScore += 5;

      // Generate reasoning
      reasoning = this.generateReasoning(agentType, info, analysis, capabilityMatches);

      recommendations.push({
        agentType,
        suitabilityScore: Math.min(100, suitabilityScore),
        reasoning,
        configuration: this.generateConfiguration(agentType, analysis),
        estimatedCost: this.estimateCost(info, analysis.complexity)
      });
    }

    // Sort by suitability score and return top recommendations
    return recommendations
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
      .slice(0, 3);
  }

  private generateReasoning(agentType: string, agentInfo: any, analysis: EUFMTaskAnalysis, capabilityMatches: number): string {
    let reasoning = `${agentType}: `;
    
    if (capabilityMatches > 0) {
      reasoning += `Matches ${capabilityMatches}/${analysis.requiredCapabilities.length} required capabilities. `;
    }
    
    if (agentInfo.special) {
      reasoning += `Special feature: ${agentInfo.special}. `;
    }
    
    reasoning += `Cost: ${agentInfo.cost}, Speed: ${agentInfo.speed}`;
    
    if (agentInfo.quality) {
      reasoning += `, Quality: ${agentInfo.quality}`;
    }
    
    return reasoning;
  }

  private generateConfiguration(agentType: string, analysis: EUFMTaskAnalysis): any {
    const baseConfig = { taskType: analysis.taskType, complexity: analysis.complexity };
    
    switch (agentType) {
      case 'CodexCLIAgent':
        return {
          ...baseConfig,
          mode: 'agent',
          approvalRequired: false,
          timeout: analysis.complexity === 'complex' ? 300000 : 120000
        };
      case 'EnhancedAbacusAgent':
        return {
          ...baseConfig,
          depth: analysis.complexity === 'complex' ? 'deep' : 'comprehensive',
          sources: 'mixed',
          domain: 'eu_funding'
        };
      case 'AgentSummonerAgent':
        return {
          ...baseConfig,
          saveResults: true,
          complexity: 'auto'
        };
      default:
        return baseConfig;
    }
  }

  private estimateCost(agentInfo: any, complexity: string): number {
    if (agentInfo.cost.includes('$0.05')) return 0.05;
    if (agentInfo.cost === 'low') return 0.01;
    if (agentInfo.cost === 'medium') return 0.02;
    if (agentInfo.cost === 'varies') return complexity === 'complex' ? 0.10 : 0.05;
    return 0.02;
  }

  private createExecutionPlan(analysis: EUFMTaskAnalysis, recommendations: AgentRecommendation[]): string {
    const validRecommendations = recommendations.filter(rec => rec && rec.agentType);
    const topAgent = validRecommendations[0];
    
    let plan = `EUFM EXECUTION PLAN:\n\n`;
    
    if (topAgent) {
      plan += `1. PRIMARY AGENT: ${topAgent.agentType}\n`;
      plan += `   - Suitability: ${Math.round(topAgent.suitabilityScore)}%\n`;
      plan += `   - Configuration: ${JSON.stringify(topAgent.configuration, null, 2)}\n`;
      plan += `   - Estimated Cost: $${topAgent.estimatedCost?.toFixed(3) || '0.020'}\n\n`;
      
      if (validRecommendations.length > 1) {
        plan += `2. BACKUP AGENTS:\n`;
        validRecommendations.slice(1).forEach((rec, idx) => {
          plan += `   ${idx + 1}. ${rec.agentType} (${Math.round(rec.suitabilityScore)}% suitable)\n`;
        });
        plan += '\n';
      }
    } else {
      plan += `1. PRIMARY AGENT: CodexCLIAgent (Default)\n`;
      plan += `   - Suitability: Based on task analysis\n`;
      plan += `   - Configuration: Standard EUFM configuration\n`;
      plan += `   - Estimated Cost: $0.020\n\n`;
    }
    
    plan += `3. EXECUTION SEQUENCE:\n`;
    plan += `   - Complexity: ${analysis.complexity}\n`;
    plan += `   - Estimated Time: ${analysis.estimatedTime}\n`;
    plan += `   - Prerequisites: ${analysis.prerequisites.join(', ') || 'None'}\n`;
    
    return plan;
  }

  private formatRecommendations(analysis: EUFMTaskAnalysis, recommendations: AgentRecommendation[], executionPlan: string): string {
    const validRecommendations = recommendations.filter(rec => rec && rec.agentType);
    
    return `
🎯 EUFM AGENT SUMMONER ANALYSIS
Task Type: ${analysis.taskType} | Complexity: ${analysis.complexity}
Required Capabilities: ${analysis.requiredCapabilities.join(', ') || 'General'}

${executionPlan}

💡 DETAILED RECOMMENDATIONS:
${validRecommendations.length > 0 ? validRecommendations.map((rec, idx) => `
${idx + 1}. ${rec.agentType} (Score: ${Math.round(rec.suitabilityScore)}%)
   ${rec.reasoning}
   Cost: $${rec.estimatedCost?.toFixed(3) || '0.020'} estimated
`).join('') : 'No specific agent recommendations - using default EUFM agents'}

🎛️ READY FOR EXECUTION
Use the primary agent with the provided configuration for optimal results.
All agents are available in the EUFM system and ready for deployment.
`;
  }

  private estimateTime(complexity: string, capabilityCount: number): string {
    const baseTime = {
      simple: 2,
      moderate: 5,
      complex: 15
    };
    
    const time = baseTime[complexity as keyof typeof baseTime] + (capabilityCount * 2);
    
    if (time < 10) return `${time} minutes`;
    return `${Math.round(time / 60 * 10) / 10} hours`;
  }

  private identifyPrerequisites(input: string, taskType: string): string[] {
    const prerequisites = [];
    
    if (input.toLowerCase().includes('codex') && taskType === 'development') {
      prerequisites.push('Codex CLI installed');
    }
    
    if (input.toLowerCase().includes('perplexity') || input.toLowerCase().includes('research')) {
      prerequisites.push('Perplexity API key configured');
    }
    
    if (taskType === 'integration') {
      prerequisites.push('Target system API documentation');
    }
    
    return prerequisites;
  }

  // Direct methods for EUFM-specific tasks
  async recommendForDevelopment(taskDescription: string): Promise<AgentRecommendation[]> {
    const analysis = await this.analyzeEUFMTask(taskDescription);
    analysis.taskType = 'development';
    return await this.recommendAgents(analysis);
  }

  async recommendForResearch(query: string, domain: string = 'eu_funding'): Promise<AgentRecommendation[]> {
    const analysis = await this.analyzeEUFMTask(query);
    analysis.taskType = 'research';
    analysis.requiredCapabilities.push('research');
    return await this.recommendAgents(analysis);
  }

  async quickAnalysis(task: string): Promise<string> {
    const result = await this.run({ input: task, dryRun: false });
    return result.output;
  }

  // New: Strategic roadmap generator for EUFM
  async generateRoadmap(currentPhase: string = 'Foundation Complete'): Promise<{
    phase: string;
    priorities: string[];
    nextTwoWeeks: string[];
    risks: string[];
  }> {
    // Simple heuristic roadmap using known gaps
    const priorities = [
      'Dashboard UX refinement (role-based, progressive disclosure, metrics hierarchy)',
      'PM² core widgets (WBS/OBS/RAM) and data model sketch',
      'EVM calculations (PV/EV/AC, CPI/SPI) with mock data',
      'Compliance baseline (GDPR/AI Act) alerts + audit trail',
      'Agent Summoner enrichment and test suite',
    ];
    const nextTwoWeeks = [
      'Implement WBS/OBS UI skeleton with mock data',
      'Add EVM calculation helper and surface KPIs in Analytics',
      'Add compliance alert rules and persistence for alerts',
      'Refine dashboard spacing/typography; reduce widget density',
      'Write smoke tests for Summoner and research flows',
    ];
    const risks = [
      'Scope creep in dashboard features before data model is finalized',
      'Perplexity/GPT cost growth without caps',
      'Lack of persistence for PM² data delaying meaningful analytics',
    ];
    return { phase: currentPhase, priorities, nextTwoWeeks, risks };
  }
}
