#!/usr/bin/env node

import { geminiComplete } from '../adapters/google_gemini.js';
import { promises as fs } from 'fs';
import path from 'path';
import { repoRoot } from '../utils/paths.js';
// Using simple fs operations instead of glob

const ROOT = repoRoot();

async function readFilesSafely(filePaths: string[]): Promise<{[key: string]: string}> {
  const files: {[key: string]: string} = {};
  
  for (const filePath of filePaths) {
    try {
      const fullPath = path.join(ROOT, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      files[filePath] = content.slice(0, 8000) + (content.length > 8000 ? '\n... [truncated]' : '');
    } catch {
      // Skip files that can't be read
    }
  }
  
  return files;
}

async function getAllSourceFiles(): Promise<string[]> {
  
  // Key files to analyze
  const keyFiles = [
    'README.md',
    'PROJECT_OVERVIEW.md', 
    'SYSTEM_LATEST_IMPLEMENTATIONS.md',
    'AGENT_QUICK_REFERENCE.md',
    'SIMPLE_CHAT_GUIDE.md',
    'package.json',
    'tsconfig.json',
    'src/cli/index.ts',
    'src/tools/triChat.ts',
    'src/tools/triChatUI.ts',
    'src/tools/claudeAgentInterface.ts',
    'src/tools/codexCLI.ts',
    'src/tools/gpt5Status.ts'
  ];
  
  // Add agents
  try {
    const agentFiles = await fs.readdir(path.join(ROOT, 'src/agents'));
    keyFiles.push(...agentFiles.filter(f => f.endsWith('.ts')).map(f => `src/agents/${f}`));
  } catch (e) { console.error(e) }
  
  // Add adapters  
  try {
    const adapterFiles = await fs.readdir(path.join(ROOT, 'src/adapters'));
    keyFiles.push(...adapterFiles.filter(f => f.endsWith('.ts')).map(f => `src/adapters/${f}`));
  } catch (e) { console.error(e) }
  
  return keyFiles;
}

async function generateSystemAnalysis(): Promise<string> {
  console.log('🔍 Collecting EUFM system files...');
  
  const filePaths = await getAllSourceFiles();
  const files = await readFilesSafely(filePaths);
  const fileCount = Object.keys(files).length;
  console.log(`📁 Collected ${fileCount} files for analysis`);
  
  // Create comprehensive context for Gemini
  let context = `# EUFM SYSTEM ANALYSIS REQUEST

## INSTRUCTION:
You are Gemini 2.5 Flash with 1M+ context window. Analyze the complete EUFM (European Union Funds Manager) system from above and provide a comprehensive briefing.

## YOUR MISSION:
Provide a detailed analysis covering:

### 1. SYSTEM ARCHITECTURE OVERVIEW
- Core components and their relationships
- Multi-agent orchestration patterns
- Provider abstraction layers (OpenAI, Anthropic, Gemini, Perplexity)
- CLI and dashboard interfaces

### 2. CURRENT CAPABILITIES ANALYSIS  
- What agents are implemented and their specializations
- Working features and tools
- Integration status (Codex CLI, tri-party chat, research, etc.)
- Recent enhancements and implementations

### 3. DEVELOPMENT STATUS
- What's fully functional vs. in-progress
- Technical debt and areas needing improvement
- Code quality and architecture patterns
- ESM/TypeScript implementation status

### 4. TRI-PARTY CHAT SYSTEM ANALYSIS
- GPT-5 ↔ Claude ↔ Human collaboration setup
- Current implementation strengths and weaknesses
- Communication flow and user experience

### 5. STRATEGIC RECOMMENDATIONS
- Priority improvements for better user experience
- System reliability and performance optimizations
- Feature gaps and enhancement opportunities
- Scalability considerations for EU project management

### 6. TECHNICAL INSIGHTS
- Code patterns and architectural decisions
- Integration complexity and dependencies  
- Configuration and deployment considerations
- Security and best practices implementation

## CONTEXT DATA:
Below are all the key files from the EUFM system:

`;

  // Add all files to context
  for (const [filePath, content] of Object.entries(files)) {
    context += `

### FILE: ${filePath}
\`\`\`
${content.slice(0, 8000)} ${content.length > 8000 ? '\n... [truncated]' : ''}
\`\`\`
`;
  }
  
  context += `

## ANALYSIS REQUEST:
Based on all the above files and context, provide your comprehensive analysis and briefing about the EUFM system. Focus on actionable insights and strategic recommendations.
`;

  return context;
}

export async function runSystemAnalysis(): Promise<void> {
  try {
    console.log('🚀 Starting comprehensive EUFM system analysis with Gemini 2.5 Flash...');
    console.log('⏱️  This will take 1-2 minutes due to the large context...\n');
    
    const analysisPrompt = await generateSystemAnalysis();
    
    console.log('🤖 Sending to Gemini 2.5 Flash for analysis...');
    const analysis = await geminiComplete(analysisPrompt, 'gemini-2.0-flash-exp');
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 GEMINI 2.5 FLASH SYSTEM ANALYSIS - EUFM PROJECT');
    console.log('='.repeat(80));
    console.log(analysis);
    console.log('='.repeat(80));
    
    // Save the analysis
    const analysisFile = path.join(ROOT, 'logs', `gemini_system_analysis_${Date.now()}.md`);
    await fs.mkdir(path.dirname(analysisFile), { recursive: true });
    await fs.writeFile(analysisFile, `# Gemini 2.5 Flash System Analysis - EUFM\n\nGenerated: ${new Date().toISOString()}\n\n${analysis}`);
    
    console.log(`\n💾 Analysis saved to: ${analysisFile}`);
    
  } catch (error: unknown) {
    console.error('❌ System analysis failed:', (error as Error).message);
    process.exit(1);
  }
}

// CLI usage
if (typeof require !== 'undefined' && require.main === module) {
  void runSystemAnalysis();
}
