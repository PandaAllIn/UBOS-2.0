import { AgentSpec } from './types.js';
import { BaseAgent } from '../agents/baseAgent.js';
import { CodexAgent } from '../agents/codexAgent.js';
import { CodexCLIAgent } from '../agents/codexCLIAgent.js';
import { JulesAgent } from '../agents/julesAgent.js';
import { AbacusAgent } from '../agents/abacusAgent.js';
import { BrowserAgent } from '../agents/browserAgent.js';
import { MemoryAgent } from '../agents/memoryAgent.js';
import { AgentSummonerAgent } from '../agents/agentSummonerAgent.js';
import { AgentSummoner } from '../agents/agentSummoner.js';
import { EnhancedAbacusAgent } from '../agents/enhancedAbacusAgent.js';
import { EUFMAgentSummoner } from '../agents/eufmAgentSummoner.js';
import { SmokeTestAgent } from '../agents/smokeTestAgent.js';
import { TestAgent } from '../agents/testAgent.js';
import { EUFundingProposalAgent } from '../agents/euFundingProposalAgent.js';
import { FigmaMCPAgent } from '../agents/figmaMCPAgent.js';
import { SpecKitCodexAgent } from '../agents/specKitCodexAgent.js';

export class AgentFactory {
  create(spec: AgentSpec): BaseAgent {
    const { id, type, requirementId } = spec;
    switch (type) {
      case 'CodexAgent': return new CodexAgent(id, requirementId);
      case 'CodexCLIAgent': return new CodexCLIAgent(id, requirementId);
      case 'JulesAgent': return new JulesAgent(id, requirementId);
      case 'AbacusAgent': return new AbacusAgent(id, requirementId);
      case 'EnhancedAbacusAgent': return new EnhancedAbacusAgent(id, requirementId);
      case 'AgentSummonerAgent': return new AgentSummonerAgent(id, requirementId);
      case 'AgentSummoner': return new AgentSummoner(id, requirementId);
      case 'EUFMAgentSummoner': return new EUFMAgentSummoner(id, requirementId);
      case 'SmokeTestAgent': return new SmokeTestAgent(id, requirementId);
      case 'BrowserAgent': return new BrowserAgent(id, requirementId);
      case 'MemoryAgent': return new MemoryAgent(id, requirementId);
      case 'EUFundingProposalAgent': return new EUFundingProposalAgent(id, requirementId);
      case 'TestAgent': return new TestAgent(id, requirementId);
      case 'figma-mcp': return new FigmaMCPAgent(id, requirementId);
      case 'spec-kit-codex': return new SpecKitCodexAgent(id, requirementId);
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}
