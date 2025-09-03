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

  async scanAll(): Promise<FundingOpportunity[]> {
    const sources = [
      'Horizon Europe',
      'Digital Europe Programme', 
      'European Innovation Council',
      'EUREKA',
      'European Regional Development Fund'
    ];

    const opportunities: FundingOpportunity[] = [];
    
    for (const source of sources) {
      try {
        const sourceOpportunities = await this.scanSource(source);
        opportunities.push(...sourceOpportunities);
      } catch (error) {
        console.warn(`Failed to scan ${source}:`, error);
      }
    }

    // Save results
    await this.saveOpportunities(opportunities);
    
    return opportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
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
      const analysis = await geminiComplete(analysisPrompt, 'gemini-1.5-pro');
      const parsed = this.parseOpportunities(analysis, program);
      return parsed;
    } catch (error) {
      console.warn(`Analysis failed for ${program}:`, error);
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
      
      return opportunities.map((opp: any, index: number) => ({
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
    } catch (error) {
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

    return await geminiComplete(proposalPrompt, 'gemini-1.5-pro');
  }
}
