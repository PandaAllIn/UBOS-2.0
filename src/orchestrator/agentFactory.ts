import { AgentSpec } from './types.js';
import { BaseAgent } from '../agents/baseAgent.js';
import { CodexAgent } from '../agents/codexAgent.js';
import { JulesAgent } from '../agents/julesAgent.js';
import { AbacusAgent } from '../agents/abacusAgent.js';
import { BrowserAgent } from '../agents/browserAgent.js';
import { MemoryAgent } from '../agents/memoryAgent.js';

export class AgentFactory {
  create(spec: AgentSpec): BaseAgent {
    const { id, type, requirementId } = spec;
    switch (type) {
      case 'CodexAgent': return new CodexAgent(id, requirementId);
      case 'JulesAgent': return new JulesAgent(id, requirementId);
      case 'AbacusAgent': return new AbacusAgent(id, requirementId);
      case 'BrowserAgent': return new BrowserAgent(id, requirementId);
      case 'MemoryAgent': return new MemoryAgent(id, requirementId);
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}

