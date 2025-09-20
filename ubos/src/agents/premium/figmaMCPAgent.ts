import { BaseAgent, AgentRunOptions, AgentFeature } from './baseAgent.js';
import { AgentResult } from '../../orchestrator/types.js';

// Context7-guided: Figma MCP agent feature definition
const figmaMCPFeature: AgentFeature = {
  type: 'figma-mcp',
  capabilities: ['design-templates', 'pitch-decks', 'visual-content', 'infographics'],
  requirements: { tools: ['figma-api', 'design-assets'] }
};

export interface PitchDeckSlide {
  title: string;
  content: string;
  layout: string;
  notes?: string;
}

export interface PitchDeckTemplate {
  title: string;
  slides: PitchDeckSlide[];
  theme: {
    colors: { primary: string; secondary: string };
    fonts: { title: string; body: string };
  };
}

export class FigmaMCPAgent extends BaseAgent {
  constructor(id: string, requirementId: string = 'figma-design') {
    super(id, requirementId, figmaMCPFeature);
  }

  get type() { return 'figma-mcp'; }

  async run(opts: AgentRunOptions): Promise<AgentResult> {
    const startedAt = this.getNow();
    try {
      const { input } = opts;

      // Route to appropriate handler based on input
      if (input.includes('pitch deck') || input.includes('investor')) {
        return await this.generatePitchDeckTemplate();
      }

      if (input.includes('landing page') || input.includes('website')) {
        return await this.generateLandingPageTemplate();
      }

      if (input.includes('infographic') || input.includes('chart')) {
        return await this.generateInfographicTemplate();
      }

      return {
        agentId: this.id,
        requirementId: this.requirementId,
        success: false,
        output: 'Unsupported Figma MCP task. Supported: pitch deck, landing page, infographic',
        startedAt,
        finishedAt: this.getNow()
      };

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

  private async generatePitchDeckTemplate(): Promise<AgentResult> {
    const template: PitchDeckTemplate = {
      title: 'EUFM SaaS Platform Pitch Deck',
      slides: [
        {
          title: 'Problem',
          content: '€60B EU funding market with massive inefficiencies. Consultants spend 200+ hours monthly on manual work.',
          layout: 'title-content',
          notes: 'Show EU flag and funding statistics'
        },
        {
          title: 'Solution',
          content: 'AI Agent Orchestration System that automates EU funding processes with intelligent task routing.',
          layout: 'title-content',
          notes: 'Show agent network visualization'
        },
        {
          title: 'Market Opportunity',
          content: '€204B EU software market, €4.3B Romanian consultancy sector. 60K-80K EU funding consultants globally.',
          layout: 'title-content-stats',
          notes: 'Include growth charts and market size visualizations'
        },
        {
          title: 'Business Model',
          content: 'SaaS subscription: €79 Starter, €249 Pro, €699 Agency, €2,500+ Enterprise.',
          layout: 'pricing-table',
          notes: 'Show pricing tiers with feature comparison'
        },
        {
          title: 'Traction',
          content: '8 AI agents operational, €6M EU project validation, 95% research confidence.',
          layout: 'metrics-dashboard',
          notes: 'Include key metrics and validation points'
        },
        {
          title: 'Team',
          content: 'Multi-agent AI system: Claude (strategy), Codex (code), Grok (research).',
          layout: 'team-grid',
          notes: 'Show agent capabilities and orchestration'
        },
        {
          title: 'Financial Projections',
          content: 'Year 1: €1.4M revenue, 300% YoY growth. Break-even in 6 months.',
          layout: 'financial-charts',
          notes: 'Include revenue projections and unit economics'
        },
        {
          title: 'Ask',
          content: '€500K seed funding for product development and market expansion.',
          layout: 'call-to-action',
          notes: 'Clear ask with use of funds breakdown'
        }
      ],
      theme: {
        colors: {
          primary: '#003399',    // EU Blue
          secondary: '#FFD700'   // Gold
        },
        fonts: {
          title: 'Arial Black',
          body: 'Segoe UI'
        }
      }
    };

    return {
      agentId: this.id,
      requirementId: this.requirementId,
      success: true,
      output: 'EUFM investor pitch deck template generated successfully',
      artifacts: { template },
      startedAt: this.getNow(),
      finishedAt: this.getNow()
    };
  }

  private async generateLandingPageTemplate(): Promise<AgentResult> {
    const template = {
      sections: [
        {
          type: 'hero',
          title: 'Automate €60B in EU Funding',
          subtitle: 'AI-powered platform saving consultants 200+ hours monthly',
          cta: 'Start Free 14-Day Trial',
          background: 'gradient'
        },
        {
          type: 'features',
          items: [
            {
              title: 'AI Agent Orchestration',
              description: '8 specialized AI agents working together',
              icon: 'network'
            },
            {
              title: 'Real-time Intelligence',
              description: 'Live EU funding opportunity scanning',
              icon: 'radar'
            },
            {
              title: 'Business Automation',
              description: 'Automated client acquisition pipeline',
              icon: 'workflow'
            }
          ]
        },
        {
          type: 'pricing',
          tiers: [
            { name: 'Starter', price: '€79', features: ['Basic automation', '5 agents'] },
            { name: 'Pro', price: '€249', features: ['Advanced features', 'All agents'] },
            { name: 'Agency', price: '€699', features: ['White-label', 'API access'] },
            { name: 'Enterprise', price: 'Custom', features: ['Full customization', 'Dedicated support'] }
          ]
        }
      ],
      styling: {
        responsive: true,
        framework: 'react',
        theme: 'professional'
      }
    };

    return {
      agentId: this.id,
      requirementId: this.requirementId,
      success: true,
      output: 'EUFM landing page template generated successfully',
      artifacts: { template },
      startedAt: this.getNow(),
      finishedAt: this.getNow()
    };
  }

  private async generateInfographicTemplate(): Promise<AgentResult> {
    const template = {
      title: 'EU Funding Automation Revolution',
      elements: [
        {
          type: 'statistic',
          value: '€204B',
          label: 'EU Software Market',
          position: { x: 100, y: 100 }
        },
        {
          type: 'statistic',
          value: '€4.3B',
          label: 'Romanian Consultancy',
          position: { x: 300, y: 100 }
        },
        {
          type: 'chart',
          chartType: 'growth',
          data: [10.2, 13.3, 15.1], // CAGR percentages
          labels: ['EU Software', 'Romanian Market', 'Projected Growth'],
          position: { x: 100, y: 250 }
        },
        {
          type: 'comparison',
          before: '300 hours/month',
          after: '90 hours/month',
          label: 'Time Savings',
          position: { x: 100, y: 400 }
        }
      ],
      dimensions: { width: 800, height: 600 },
      theme: 'professional'
    };

    return {
      agentId: this.id,
      requirementId: this.requirementId,
      success: true,
      output: 'EUFM market analysis infographic template generated successfully',
      artifacts: { template },
      startedAt: this.getNow(),
      finishedAt: this.getNow()
    };
  }
}
