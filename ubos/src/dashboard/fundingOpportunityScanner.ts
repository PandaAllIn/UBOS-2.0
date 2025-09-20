import { runPerplexityTest } from '../tools/perplexity_sonar.js';
import { geminiComplete } from '../adapters/google_gemini.js';
import { promises as fs } from 'fs';
import path from 'path';

export interface FundingOpportunity {
  id: string;
  title: string;
  program: string;
  deadline: string;
  budget: string;
  description: string;
  eligibility: string[];
  relevanceScore: number;
  url: string;
  status: 'open' | 'closing_soon' | 'closed';
  scannedAt: string;
}

export class FundingOpportunityScanner {
  private baseDir = 'logs/funding';

  constructor() {
    this.ensureDir();
  }

  private async ensureDir() {
    await fs.mkdir(this.baseDir, { recursive: true }).catch(() => {});
  }

  async scanAll(progressCb?: (evt: { stage: string; message: string; percent?: number }) => void): Promise<FundingOpportunity[]> {
    const sources = [
      'Horizon Europe',
      'Digital Europe Programme', 
      'European Innovation Council',
      'EUREKA',
      'European Regional Development Fund'
    ];

    const opportunities: FundingOpportunity[] = [];
    const total = sources.length;
    progressCb?.({ stage: 'start', message: 'Starting funding scan…', percent: 2 });
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      try {
        progressCb?.({ stage: 'source', message: `Scanning ${source}…`, percent: Math.round(((i) / total) * 100) });
        const sourceOpportunities = await this.scanSource(source);
        opportunities.push(...sourceOpportunities);
        progressCb?.({ stage: 'parsed', message: `Analyzing ${source} results…`, percent: Math.round(((i + 0.6) / total) * 100) });
      } catch (error: unknown) {
        console.warn(`Failed to scan ${source}:`, error);
      }
    }

    // Save results
    await this.saveOpportunities(opportunities);
    progressCb?.({ stage: 'save', message: 'Saving results…', percent: 96 });
    
    const sorted = opportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
    progressCb?.({ stage: 'done', message: `Scan complete — ${sorted.length} opportunities found`, percent: 100 });
    return sorted;
  }

  private async scanSource(program: string): Promise<FundingOpportunity[]> {
    const query = `${program} funding opportunities 2024 2025 AI artificial intelligence digital innovation open calls deadlines`;
    
    // Use Perplexity for real-time web search
    const searchResults = await runPerplexityTest(query);
    
    // Use Gemini to analyze and extract structured data
    const analysisPrompt = `
Analyze this funding information and extract opportunities relevant to AI/digital innovation projects like EUFM (European Union Funds Manager):

${searchResults}

Extract and return a JSON array of funding opportunities with this structure:
{
  "opportunities": [
    {
      "title": "opportunity title",
      "program": "${program}",
      "deadline": "YYYY-MM-DD or 'ongoing'",
      "budget": "budget range",
      "description": "brief description",
      "eligibility": ["requirement1", "requirement2"],
      "relevanceScore": 0-100,
      "url": "application url if available"
    }
  ]
}

Focus on opportunities that match:
- AI/ML projects
- Digital innovation
- SME/startup funding
- Technology development
- European innovation

Return only valid JSON.`;

    try {
      const analysis = await geminiComplete(analysisPrompt, 'gemini-2.0-flash-exp');
      const parsed = this.parseOpportunities(analysis, program);
      return parsed;
    } catch {
      console.warn(`Analysis failed for ${program}`);
      return [];
    }
  }

  private parseOpportunities(analysis: string, program: string): FundingOpportunity[] {
    try {
      // Extract JSON from the response
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];
      
      const data = JSON.parse(jsonMatch[0]);
      const opportunities = data.opportunities || [];
      
      return opportunities.map((opp: { title: string; program: string; deadline: string; budget: string; description: string; eligibility: string[]; relevanceScore: number; url: string; }, index: number) => ({
        id: `${program.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
        title: opp.title || 'Unknown Title',
        program: opp.program || program,
        deadline: opp.deadline || 'TBD',
        budget: opp.budget || 'Not specified',
        description: opp.description || '',
        eligibility: Array.isArray(opp.eligibility) ? opp.eligibility : [],
        relevanceScore: Math.min(100, Math.max(0, opp.relevanceScore || 50)),
        url: opp.url || '',
        status: this.determineStatus(opp.deadline),
        scannedAt: new Date().toISOString()
      }));
    } catch (error: unknown) {
      console.warn('Failed to parse opportunities:', error);
      return [];
    }
  }

  private determineStatus(deadline: string): 'open' | 'closing_soon' | 'closed' {
    if (!deadline || deadline === 'TBD' || deadline === 'ongoing') return 'open';
    
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const daysUntil = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysUntil < 0) return 'closed';
      if (daysUntil < 30) return 'closing_soon';
      return 'open';
    } catch {
      return 'open';
    }
  }

  async getActiveOpportunities(): Promise<FundingOpportunity[]> {
    try {
      const filePath = path.join(this.baseDir, 'opportunities.json');
      const data = await fs.readFile(filePath, 'utf8');
      const opportunities: FundingOpportunity[] = JSON.parse(data);
      
      return opportunities.filter(opp => opp.status !== 'closed');
    } catch {
      return [];
    }
  }

  async getOpportunityById(id: string): Promise<FundingOpportunity | null> {
    const opportunities = await this.getActiveOpportunities();
    return opportunities.find(opp => opp.id === id) || null;
  }

  private async saveOpportunities(opportunities: FundingOpportunity[]) {
    const filePath = path.join(this.baseDir, 'opportunities.json');
    await fs.writeFile(filePath, JSON.stringify(opportunities, null, 2), 'utf8');
    
    // Also save a summary
    const summary = {
      totalOpportunities: opportunities.length,
      byProgram: this.groupByProgram(opportunities),
      byStatus: this.groupByStatus(opportunities),
      highRelevance: opportunities.filter(opp => opp.relevanceScore >= 80).length,
      lastScanned: new Date().toISOString()
    };
    
    const summaryPath = path.join(this.baseDir, 'summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
  }

  private groupByProgram(opportunities: FundingOpportunity[]) {
    return opportunities.reduce((acc, opp) => {
      acc[opp.program] = (acc[opp.program] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByStatus(opportunities: FundingOpportunity[]) {
    return opportunities.reduce((acc, opp) => {
      acc[opp.status] = (acc[opp.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  async generateEUFMProposal(opportunityId: string): Promise<string> {
    const opportunity = await this.getOpportunityById(opportunityId);
    if (!opportunity) throw new Error('Opportunity not found');

    const proposalPrompt = `
Generate a compelling EU funding proposal for the EUFM (European Union Funds Manager) project targeting this opportunity:

OPPORTUNITY:
Title: ${opportunity.title}
Program: ${opportunity.program}
Description: ${opportunity.description}
Eligibility: ${opportunity.eligibility.join(', ')}
Budget: ${opportunity.budget}

EUFM PROJECT:
- AI-powered system for managing EU non-refundable funds
- Strategic agent orchestrator that creates specialized AI agents on-demand
- Automated funding opportunity scanning and proposal generation
- Multi-agent coordination for complex project management
- Integration with multiple LLM providers (OpenAI, Anthropic, Google, Perplexity)
- Real-time analytics and cost optimization
- Knowledge management with Obsidian integration
- Browser automation for web-based tools

Generate a structured proposal including:
1. Executive Summary
2. Project Objectives
3. Technical Innovation
4. European Added Value
5. Impact and Exploitation
6. Work Plan and Methodology
7. Budget Justification
8. Risk Management

Focus on how EUFM addresses European digital sovereignty, SME support, and innovation ecosystem development.
`;

    return await geminiComplete(proposalPrompt, 'gemini-2.0-flash-exp');
  }

  // Seed the three critical deadlines so they appear immediately in the dashboard
  async seedCriticalDeadlines(): Promise<void> {
    const existing = await this.getActiveOpportunities();
    const byKey = new Map(existing.map(o => [o.id, o]));

    const seeds: FundingOpportunity[] = [
      {
        id: 'horizon_europe_geodatacenter_2025-09-02',
        title: 'Horizon Europe — GeoDataCenter Call',
        program: 'Horizon Europe',
        deadline: '2025-09-02',
        budget: '€20M',
        description: 'High-impact research and innovation funding relevant to GeoDataCenter project.',
        eligibility: ['Consortium (3+ countries)', 'Research & Innovation'],
        relevanceScore: 90,
        url: '',
        status: this.determineStatus('2025-09-02'),
        scannedAt: new Date().toISOString(),
      },
      {
        id: 'eufm_core_funding_2025-09-18',
        title: 'EUFM Core Funding — EUFM Program',
        program: 'EUFM',
        deadline: '2025-09-18',
        budget: '€2M',
        description: 'Core funding deadline for EUFM EU Funding project.',
        eligibility: ['SME/startup support', 'Digital innovation'],
        relevanceScore: 95,
        url: '',
        status: this.determineStatus('2025-09-18'),
        scannedAt: new Date().toISOString(),
      },
      {
        id: 'cetpartnership_geodatacenter_2025-10-09',
        title: 'CETPartnership — GeoDataCenter Track',
        program: 'CETPartnership',
        deadline: '2025-10-09',
        budget: '€12M',
        description: 'Clean Energy Transition partnership call relevant to GeoDataCenter.',
        eligibility: ['Consortium', 'Clean energy transition'],
        relevanceScore: 85,
        url: '',
        status: this.determineStatus('2025-10-09'),
        scannedAt: new Date().toISOString(),
      },
    ];

    // Merge
    for (const s of seeds) {
      if (!byKey.has(s.id)) byKey.set(s.id, s);
    }

    const merged = Array.from(byKey.values());
    await this.saveOpportunities(merged);
  }
}