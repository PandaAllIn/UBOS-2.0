import fetch from 'node-fetch';
import { trackLLMUsage } from '../analytics/autoTracker.js';
import { promises as fs } from 'fs';
import path from 'path';

export interface ResearchQuery {
  query: string;
  domain?: string;
  researchDepth?: 'quick' | 'comprehensive' | 'deep';
  sources?: 'academic' | 'commercial' | 'mixed';
  timeframe?: 'recent' | 'year' | 'all';
  maxTokens?: number;
}

export interface ResearchResult {
  queryId: string;
  timestamp: string;
  query: ResearchQuery;
  response: string;
  sources?: string[];
  confidence: number;
  costUSD: number;
  tokensUsed: number;
  processingTimeMs: number;
}

export interface ResearchSession {
  sessionId: string;
  queries: ResearchResult[];
  totalCostUSD: number;
  startedAt: string;
  lastQueryAt: string;
}

export class EnhancedPerplexityResearch {
  private readonly endpoint = 'https://api.perplexity.ai/chat/completions';
  private readonly dataDir = 'logs/research_data/perplexity';
  
  constructor(private apiKey?: string) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY;
    // Fallback: load from XF credentials if present
    if (!this.apiKey) {
      const credPath = path.resolve(process.cwd(), '_external/eufm_XF/.perplexity_sonar_credentials.json');
      try {
        // Best-effort, do not throw on failure
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const raw = require('fs').readFileSync(credPath, 'utf-8');
        const json = JSON.parse(raw);
        if (json?.sonar_api_key && typeof json.sonar_api_key === 'string') {
          this.apiKey = json.sonar_api_key;
        }
      } catch {} // Ignore errors during fallback credential loading
    }
  }

  async conductResearch(query: ResearchQuery): Promise<ResearchResult> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const startTime = Date.now();
    const queryId = `research_${Date.now()}`;
    const model = this.selectModel(query.researchDepth || 'comprehensive');
    
    const prompt = this.buildResearchPrompt(query);
    
    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt(query)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: query.researchDepth === 'deep' ? 0.1 : 0.2,
      max_tokens: query.maxTokens || 2000,
      top_p: 0.9
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as { choices: { message: { content: string } }[], usage: { total_tokens: number } };
      const content = data?.choices?.[0]?.message?.content ?? '';
      const usage = data?.usage;
      
      const processingTimeMs = Date.now() - startTime;
      const costUSD = this.calculateCost(model, usage);

      const result: ResearchResult = {
        queryId,
        timestamp: new Date().toISOString(),
        query,
        response: content,
        sources: this.extractSources(content),
        confidence: this.assessConfidence(content, query),
        costUSD,
        tokensUsed: usage?.total_tokens || 0,
        processingTimeMs
      };

      // Save research result
      await this.saveResearchResult(result);
      
      // Track usage for analytics
      try {
        await trackLLMUsage('perplexity', model, prompt, content, usage);
      } catch (error: unknown) {
        console.warn('Failed to track usage:', error);
      }

      return result;

    } catch (error: unknown) {
      throw new Error(`Research failed: ${(error as Error).message}`);
    }
  }

  private selectModel(depth: string): string {
    switch (depth) {
      case 'quick': return 'sonar';
      case 'comprehensive': return 'sonar-pro';
      case 'deep': return 'sonar-reasoning';
      default: return 'sonar-pro';
    }
  }

  private buildSystemPrompt(query: ResearchQuery): string {
    const domainContext = query.domain ? `Focus on ${query.domain} domain. ` : '';
    const sourcePreference = query.sources === 'academic' ? 
      'Prioritize peer-reviewed academic sources, research papers, and scientific journals. ' :
      query.sources === 'commercial' ?
      'Focus on commercial sources, industry reports, and business intelligence. ' :
      'Use a balanced mix of academic, commercial, and authoritative sources. ';

    return `You are an expert research assistant specializing in comprehensive information gathering and analysis.

${domainContext}${sourcePreference}

Research Depth: ${query.researchDepth || 'comprehensive'}
Timeframe: Focus on ${query.timeframe === 'recent' ? 'the most recent information' : 
  query.timeframe === 'year' ? 'information from the past year' : 'all relevant timeframes'}.

Provide detailed, factual responses with:
1. Comprehensive coverage of the topic
2. Specific data points and statistics when available
3. Clear source attribution
4. Current status and recent developments
5. Relevant context and background
6. Actionable insights where applicable

Format your response with clear structure and highlight key findings.`;
  }

  private buildResearchPrompt(query: ResearchQuery): string {
    const depthInstructions = {
      'quick': 'Provide a concise but informative overview with key facts and current status.',
      'comprehensive': 'Conduct thorough research covering multiple perspectives, current developments, key players, and relevant data. Include specific examples and case studies where applicable.',
      'deep': 'Perform extensive analysis including historical context, current trends, technical details, market dynamics, competitive landscape, regulatory considerations, and future outlook. Provide specific data, statistics, and detailed technical information.'
    };

    const instruction = depthInstructions[query.researchDepth || 'comprehensive'];

    return `Research Query: "${query.query}"

${instruction}

Please ensure your research includes:
- Current status and recent developments
- Key statistics and data points
- Relevant examples and case studies
- Sources and references
- Practical implications and applications

Organize your response with clear headings and bullet points for easy scanning.`;
  }

  private calculateCost(model: string, usage: { total_tokens: number }): number {
    // Approximate pricing (should be updated with actual Perplexity pricing)
    const pricingPer1K = {
      'sonar': 0.0005,
      'sonar-pro': 0.001,
      'sonar-reasoning': 0.002
    } as Record<string, number>;

    const tokensUsed = usage?.total_tokens || 1000;
    const pricePerToken = (pricingPer1K[model] || 0.001) / 1000;
    
    return Math.round(tokensUsed * pricePerToken * 100) / 100; // Round to cents
  }

  private extractSources(content: string): string[] {
    // Extract potential sources from content
    const sources: string[] = [];
    const urlRegex = /https?:[^\s)]+/g;
    const urls = content.match(urlRegex) || [];
    
    sources.push(...urls);
    
    // Extract other source indicators
    const sourceIndicators = [
      /according to ([^,\n]+)/gi,
      /reported by ([^,\n]+)/gi,
      /study by ([^,\n]+)/gi,
      /research from ([^,\n]+)/gi
    ];
    
    sourceIndicators.forEach(regex => {
      const matches = content.match(regex) || [];
      sources.push(...matches.map(match => match.replace(regex, '$1')));
    });
    
    return [...new Set(sources)].slice(0, 10); // Unique sources, max 10
  }

  private assessConfidence(content: string, query: ResearchQuery): number {
    // Simple confidence assessment based on response quality indicators
    let confidence = 0.7; // Base confidence
    
    // Length indicator (more detailed responses generally more confident)
    if (content.length > 2000) confidence += 0.1;
    if (content.length > 4000) confidence += 0.1;
    
    // Source indicators
    const sourceCount = this.extractSources(content).length;
    confidence += Math.min(0.15, sourceCount * 0.03);
    
    // Specific data indicators
    const dataIndicators = [
      /\d+%/g, // Percentages
      /\$[\d,]+/g, // Dollar amounts
      /\d{4}/, // Years
      /according to/gi,
      /study/gi,
      /research/gi
    ];
    
    const dataMatches = dataIndicators.reduce((count, regex) => {
      return count + (content.match(regex) || []).length;
    }, 0);
    
    confidence += Math.min(0.1, dataMatches * 0.01);
    
    return Math.min(0.95, Math.max(0.5, confidence));
  }

  private async saveResearchResult(result: ResearchResult): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    
    const filename = `research_${result.queryId}.json`;
    const filepath = path.join(this.dataDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(result, null, 2));
    
    // Also save a human-readable markdown version
    const markdownContent = this.formatAsMarkdown(result);
    const markdownPath = path.join(this.dataDir, `research_${result.queryId}.md`);
    await fs.writeFile(markdownPath, markdownContent);
  }

  private formatAsMarkdown(result: ResearchResult): string {
    const { query, response, sources, confidence, costUSD, processingTimeMs, timestamp } = result;
    
    return `# Research Result: ${query.query}` +
`
**Research ID:** ${result.queryId}` +
`**Timestamp:** ${new Date(timestamp).toLocaleString()}` +
`**Research Depth:** ${query.researchDepth || 'comprehensive'}` +
`**Domain:** ${query.domain || 'General'}` +
`**Confidence:** ${Math.round(confidence * 100)}%` +
`**Cost:** ${costUSD.toFixed(4)}` +
`**Processing Time:** ${processingTimeMs}ms` +
`
## Query Details` +
`- **Query:** ${query.query}` +
`- **Sources Preference:** ${query.sources || 'mixed'}` +
`- **Timeframe:** ${query.timeframe || 'all'}` +
`
## Research Results` +
`
${response}` +
`
## Sources Found` +
`${sources && sources.length > 0 ? sources.map(source => `- ${source}`).join('\n') : 'No specific sources extracted'}` +
`
## Metadata` +
`- **Tokens Used:** ${result.tokensUsed}` +
`- **Model:** Based on research depth` +
`- **API Response Time:** ${processingTimeMs}ms` +
`
---
*Generated by Enhanced Perplexity Research System*
`;
  }

  async getResearchHistory(limit: number = 10): Promise<ResearchResult[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      const jsonFiles = files
        .filter(f => f.startsWith('research_') && f.endsWith('.json'))
        .sort()
        .slice(-limit);
      
      const results: ResearchResult[] = [];
      for (const file of jsonFiles) {
        const content = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
        results.push(JSON.parse(content));
      }
      
      return results.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch {
      return [];
    }
  }

  async getTotalResearchCost(days: number = 30): Promise<number> {
    const history = await this.getResearchHistory(1000); // Get all recent
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return history
      .filter(r => new Date(r.timestamp) > cutoffDate)
      .reduce((total, r) => total + r.costUSD, 0);
  }
}

// Convenience function for backward compatibility and simple usage
export async function runEnhancedPerplexityResearch(
  query: string,
  options: Omit<ResearchQuery, 'query'> = {}
): Promise<string> {
  const researcher = new EnhancedPerplexityResearch();
  const result = await researcher.conductResearch({
    query,
    ...options
  });
  
  return result.response;
}

// Advanced research function for complex queries
export async function conductDeepResearch(
  query: string,
  domain: string,
  followUpQueries?: string[]
): Promise<{
  primary: ResearchResult;
  followUps?: ResearchResult[];
  synthesis: string;
  totalCost: number;
}> {
  const researcher = new EnhancedPerplexityResearch();
  
  // Primary research
  const primary = await researcher.conductResearch({
    query,
    domain,
    researchDepth: 'deep',
    sources: 'mixed'
  });
  
  let totalCost = primary.costUSD;
  let followUps: ResearchResult[] = [];

  // Follow-up research if specified
  if (followUpQueries && followUpQueries.length > 0) {
    for (const followUpQuery of followUpQueries.slice(0, 3)) { // Limit to 3 follow-ups
      const followUp = await researcher.conductResearch({
        query: followUpQuery,
        domain,
        researchDepth: 'comprehensive'
      });
      totalCost += followUp.costUSD;
      followUps.push(followUp);
    }
  }

  const synthesisParts: string[] = [
    `Primary insights for "${query}":\n${primary.response}`,
  ];

  if (followUps.length) {
    synthesisParts.push('\nFollow-up highlights:');
    followUps.forEach((res, index) => {
      synthesisParts.push(`\n${index + 1}. ${res.response}`);
    });
  }

  return {
    primary,
    followUps: followUps.length ? followUps : undefined,
    synthesis: synthesisParts.join('\n'),
    totalCost,
  };
}
