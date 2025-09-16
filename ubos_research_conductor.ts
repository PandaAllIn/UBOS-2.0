#!/usr/bin/env tsx

/**
 * UBOS 2.0 Comprehensive Research Conductor
 * Multi-Agent System Architecture Research for Constitutional AI Systems
 */

import { EnhancedPerplexityResearch, ResearchQuery } from './UBOS/src/tools/enhancedPerplexityResearch.js';
import { promises as fs } from 'fs';
import path from 'path';

interface ResearchArea {
  name: string;
  queries: ResearchQuery[];
}

class UBOS2ResearchConductor {
  private researcher: EnhancedPerplexityResearch;
  private outputDir: string;

  constructor() {
    this.researcher = new EnhancedPerplexityResearch();
    this.outputDir = '/Users/apple/Desktop/UBOS_2.0/research_output';
  }

  private async ensureOutputDirectory(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  private getResearchAreas(): ResearchArea[] {
    return [
      {
        name: "Multi-Agent System Architectures",
        queries: [
          {
            query: "Latest patterns for business adaptation agents that can understand any business context using AI in 2024-2025",
            domain: "AI Systems Architecture",
            researchDepth: "deep",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 4000
          },
          {
            query: "Gemini 2.5 Pro API integration best practices for intelligent agents multi-agent orchestration",
            domain: "AI Development",
            researchDepth: "comprehensive",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 3000
          },
          {
            query: "Agent orchestration and communication patterns for 4-stage pipelines constitutional AI systems",
            domain: "AI Architecture",
            researchDepth: "deep",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 4000
          },
          {
            query: "Constitutional AI system integration with governance principles EUR-backed credit systems",
            domain: "AI Governance",
            researchDepth: "comprehensive",
            sources: "academic",
            timeframe: "recent",
            maxTokens: 3000
          }
        ]
      },
      {
        name: "CLI Tool Integration Strategies",
        queries: [
          {
            query: "Groq CLI capabilities ultra-fast inference real-time decisions multi-agent systems 2024",
            domain: "AI Infrastructure",
            researchDepth: "comprehensive",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 3000
          },
          {
            query: "CodeLLM CLI enterprise code generation capabilities integration patterns with existing systems",
            domain: "Development Tools",
            researchDepth: "comprehensive",
            sources: "commercial",
            timeframe: "recent",
            maxTokens: 3000
          },
          {
            query: "Codex CLI deep integration patterns existing systems OpenAI API orchestration",
            domain: "AI Development",
            researchDepth: "comprehensive",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 3000
          },
          {
            query: "Tool routing algorithms complementary CLI usage performance optimization multi-CLI orchestration",
            domain: "System Architecture",
            researchDepth: "deep",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 4000
          }
        ]
      },
      {
        name: "SpecKit Specification Methodologies",
        queries: [
          {
            query: "SpecKit specification writing patterns implementation-ready specs automated generation 2024",
            domain: "Software Development",
            researchDepth: "comprehensive",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 3000
          },
          {
            query: "Automated spec generation techniques using AI template-to-detailed-spec transformation",
            domain: "AI Development",
            researchDepth: "comprehensive",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 3000
          },
          {
            query: "SpecKit command integration workflow automation specification-driven development",
            domain: "DevOps",
            researchDepth: "comprehensive",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 3000
          },
          {
            query: "Living specifications hot-reload systems metamorphosis integration constitutional governance specs",
            domain: "System Architecture",
            researchDepth: "deep",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 4000
          }
        ]
      },
      {
        name: "Constitutional Integration Patterns",
        queries: [
          {
            query: "EUR-backed credit systems for AI services transparent governance integration multi-agent systems",
            domain: "AI Governance",
            researchDepth: "deep",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 4000
          },
          {
            query: "Transparent governance integration for AI agents compliance audit patterns voting systems",
            domain: "AI Ethics",
            researchDepth: "comprehensive",
            sources: "academic",
            timeframe: "recent",
            maxTokens: 3000
          },
          {
            query: "Compliance and audit patterns for multi-agent systems action logging constitutional frameworks",
            domain: "AI Compliance",
            researchDepth: "comprehensive",
            sources: "mixed",
            timeframe: "recent",
            maxTokens: 3000
          },
          {
            query: "Action logging constitutional compliance frameworks intentocracy governance AI citizenship models",
            domain: "AI Governance",
            researchDepth: "deep",
            sources: "academic",
            timeframe: "recent",
            maxTokens: 4000
          }
        ]
      }
    ];
  }

  private async conductAreaResearch(area: ResearchArea): Promise<void> {
    console.log(`\n🔍 Starting research for: ${area.name}`);
    console.log(`📊 Conducting ${area.queries.length} research queries...`);

    const results = [];
    let totalCost = 0;

    for (let i = 0; i < area.queries.length; i++) {
      const query = area.queries[i];
      console.log(`\n   Query ${i + 1}/${area.queries.length}: ${query.query.substring(0, 60)}...`);

      try {
        const result = await this.researcher.conductResearch(query);
        results.push(result);
        totalCost += result.costUSD;

        console.log(`   ✅ Complete (${result.costUSD.toFixed(4)} USD, ${result.processingTimeMs}ms)`);

        // Small delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Error: ${error}`);
        results.push({ error: error, query: query });
      }
    }

    // Save consolidated area report
    const areaReport = this.generateAreaReport(area, results, totalCost);
    const filename = `${area.name.replace(/\s+/g, '_').toLowerCase()}_research_report.md`;
    const filepath = path.join(this.outputDir, filename);

    await fs.writeFile(filepath, areaReport);
    console.log(`\n📋 Area report saved: ${filepath}`);
    console.log(`💰 Total cost for ${area.name}: ${totalCost.toFixed(4)} USD`);
  }

  private generateAreaReport(area: ResearchArea, results: any[], totalCost: number): string {
    const timestamp = new Date().toISOString();

    let report = `# ${area.name} - Research Report\n\n`;
    report += `**Generated:** ${new Date(timestamp).toLocaleString()}\n`;
    report += `**Total Queries:** ${area.queries.length}\n`;
    report += `**Total Cost:** $${totalCost.toFixed(4)} USD\n\n`;

    report += `## Executive Summary\n\n`;
    report += `This report presents comprehensive research findings for ${area.name} as part of the UBOS 2.0 system development. `;
    report += `The research was conducted using the Enhanced Perplexity Research system with deep analysis capabilities.\n\n`;

    report += `## Research Findings\n\n`;

    results.forEach((result, index) => {
      if (result.error) {
        report += `### Query ${index + 1}: ERROR\n`;
        report += `**Query:** ${result.query.query}\n`;
        report += `**Error:** ${result.error}\n\n`;
        return;
      }

      report += `### Query ${index + 1}: ${result.query.query.substring(0, 80)}...\n\n`;
      report += `**Research Depth:** ${result.query.researchDepth}\n`;
      report += `**Domain:** ${result.query.domain}\n`;
      report += `**Confidence:** ${Math.round(result.confidence * 100)}%\n`;
      report += `**Cost:** $${result.costUSD.toFixed(4)}\n`;
      report += `**Processing Time:** ${result.processingTimeMs}ms\n\n`;

      report += `#### Research Results\n\n`;
      report += `${result.response}\n\n`;

      if (result.sources && result.sources.length > 0) {
        report += `#### Sources\n`;
        result.sources.forEach(source => {
          report += `- ${source}\n`;
        });
        report += `\n`;
      }

      report += `---\n\n`;
    });

    return report;
  }

  private async generateConsolidatedReport(): Promise<void> {
    console.log(`\n📊 Generating consolidated research report...`);

    const reportFiles = await fs.readdir(this.outputDir);
    const researchFiles = reportFiles.filter(f => f.endsWith('_research_report.md'));

    let consolidatedReport = `# UBOS 2.0 System - Comprehensive Research Report\n\n`;
    consolidatedReport += `**Generated:** ${new Date().toLocaleString()}\n`;
    consolidatedReport += `**Research Areas:** ${researchFiles.length}\n\n`;

    consolidatedReport += `## Executive Summary\n\n`;
    consolidatedReport += `This comprehensive report consolidates research findings across four critical areas for UBOS 2.0 system development:\n\n`;
    consolidatedReport += `1. **Multi-Agent System Architectures** - Latest patterns for business adaptation and constitutional AI integration\n`;
    consolidatedReport += `2. **CLI Tool Integration Strategies** - Performance optimization and tool orchestration patterns\n`;
    consolidatedReport += `3. **SpecKit Specification Methodologies** - Implementation-ready specification writing and automation\n`;
    consolidatedReport += `4. **Constitutional Integration Patterns** - EUR-backed credit systems and transparent governance\n\n`;

    consolidatedReport += `## Research Areas Summary\n\n`;

    for (const file of researchFiles) {
      const content = await fs.readFile(path.join(this.outputDir, file), 'utf-8');
      const areaName = file.replace('_research_report.md', '').replace(/_/g, ' ');

      consolidatedReport += `### ${areaName.toUpperCase()}\n\n`;

      // Extract key sections from individual reports
      const lines = content.split('\n');
      let inSummary = false;
      let summaryContent = '';

      for (const line of lines) {
        if (line.startsWith('## Executive Summary')) {
          inSummary = true;
          continue;
        }
        if (line.startsWith('## Research Findings')) {
          inSummary = false;
          break;
        }
        if (inSummary && line.trim()) {
          summaryContent += line + '\n';
        }
      }

      consolidatedReport += summaryContent + '\n';
      consolidatedReport += `[Full Report: ${file}]\n\n`;
    }

    consolidatedReport += `## Implementation Recommendations\n\n`;
    consolidatedReport += `Based on the comprehensive research across all areas, the following implementation recommendations are provided for UBOS 2.0:\n\n`;
    consolidatedReport += `### Architecture Priorities\n`;
    consolidatedReport += `1. **Constitutional AI Integration** - Implement governance frameworks with EUR-backed credit systems\n`;
    consolidatedReport += `2. **Multi-Agent Orchestration** - Deploy 4-stage pipeline with Gemini 2.5 Pro integration\n`;
    consolidatedReport += `3. **CLI Tool Optimization** - Implement Groq CLI for ultra-fast inference and CodeLLM for enterprise generation\n`;
    consolidatedReport += `4. **Specification Automation** - Deploy SpecKit with hot-reload and metamorphosis integration\n\n`;

    consolidatedReport += `### Next Steps\n`;
    consolidatedReport += `1. Review individual area reports for detailed technical specifications\n`;
    consolidatedReport += `2. Prioritize implementation based on constitutional framework requirements\n`;
    consolidatedReport += `3. Establish governance and compliance patterns before system deployment\n`;
    consolidatedReport += `4. Implement action logging and transparency measures from the start\n\n`;

    consolidatedReport += `---\n*Generated by Enhanced Perplexity Research System for UBOS 2.0*\n`;

    const consolidatedPath = path.join(this.outputDir, 'UBOS_2.0_CONSOLIDATED_RESEARCH_REPORT.md');
    await fs.writeFile(consolidatedPath, consolidatedReport);

    console.log(`\n📋 Consolidated report generated: ${consolidatedPath}`);
  }

  public async conductFullResearch(): Promise<void> {
    console.log(`🚀 UBOS 2.0 Comprehensive Research Session Starting...`);
    console.log(`📁 Output directory: ${this.outputDir}`);

    await this.ensureOutputDirectory();

    const researchAreas = this.getResearchAreas();
    let grandTotalCost = 0;

    for (const area of researchAreas) {
      try {
        await this.conductAreaResearch(area);

        // Calculate area cost from saved results
        const history = await this.researcher.getResearchHistory(50);
        const recentCost = await this.researcher.getTotalResearchCost(1); // Last day
        grandTotalCost += recentCost;

      } catch (error) {
        console.error(`❌ Failed to complete research for ${area.name}:`, error);
      }

      // Pause between areas to respect API limits
      console.log(`\n⏱️  Pausing 5 seconds before next research area...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    await this.generateConsolidatedReport();

    console.log(`\n🎉 UBOS 2.0 Research Session Complete!`);
    console.log(`💰 Grand Total Cost: ${grandTotalCost.toFixed(4)} USD`);
    console.log(`📊 All reports saved to: ${this.outputDir}`);
  }
}

// Execute research if run directly
if (require.main === module) {
  const conductor = new UBOS2ResearchConductor();
  conductor.conductFullResearch().catch(console.error);
}

export { UBOS2ResearchConductor };