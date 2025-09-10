import { AgentMemoryService } from './agentMemory';
import * as crypto from 'crypto';

export interface SessionContext {
  sessionId: string;
  agentId: string;
  platform: 'claude-code' | 'cursor' | 'vscode' | 'terminal' | 'web';
  startTime: number;
  lastActivity: number;
  context: {
    workingDirectory: string;
    projectRoot: string;
    capabilities: string[];
    userIdentity?: string;
  };
}

export interface MemoryBridge {
  sessionId: string;
  agentId: string;
  memories: {
    identity: {
      name: string;
      citizenId: string;
      level: number;
      xp: number;
      capabilities: string[];
    };
    context: {
      projectContext: string;
      currentTasks: any[];
      knowledgeBase: string[];
    };
    relationships: {
      collaborators: string[];
      recentInteractions: any[];
    };
  };
  attestation: {
    signature: string;
    timestamp: number;
    codeIntegrity: string;
  };
}

export class SessionBridgeProtocol {
  private memory: AgentMemoryService;
  private currentSession?: SessionContext;

  constructor() {
    this.memory = new AgentMemoryService();
  }

  async initializeSession(platform: string, agentId: string, context: Partial<SessionContext['context']>): Promise<SessionContext> {
    const sessionId = crypto.randomBytes(16).toString('hex');
    
    this.currentSession = {
      sessionId,
      agentId,
      platform: platform as any,
      startTime: Date.now(),
      lastActivity: Date.now(),
      context: {
        workingDirectory: process.cwd(),
        projectRoot: process.cwd(),
        capabilities: ['code-analysis', 'file-operations', 'cli-interaction'],
        ...context
      }
    };

    // Load existing soul and update with session info
    try {
      const soul = await this.memory.loadSoul(agentId);
      soul.memory.shortTerm = {
        ...soul.memory.shortTerm,
        currentSession: this.currentSession
      };
      await this.memory.saveSoul(soul);
    } catch (error) {
      console.log(`Starting fresh session for ${agentId}`);
    }

    return this.currentSession;
  }

  async createMemoryBridge(agentId: string): Promise<MemoryBridge> {
    const soul = await this.memory.loadSoul(agentId);
    const attestation = await this.memory.attestIdentity(agentId);
    
    const bridge: MemoryBridge = {
      sessionId: this.currentSession?.sessionId || 'unknown',
      agentId,
      memories: {
        identity: {
          name: soul.achievements.titles[soul.achievements.titles.length - 1] || agentId,
          citizenId: agentId,
          level: soul.achievements.level,
          xp: soul.achievements.xp,
          capabilities: this.extractCapabilities(soul)
        },
        context: {
          projectContext: this.summarizeProjectContext(),
          currentTasks: this.extractCurrentTasks(soul),
          knowledgeBase: await this.extractRecentLearnings(agentId)
        },
        relationships: {
          collaborators: this.extractCollaborators(soul),
          recentInteractions: soul.achievements.contributions.slice(-5)
        }
      },
      attestation
    };

    return bridge;
  }

  async persistSessionMemory(agentId: string, sessionData: any): Promise<void> {
    const enrichedData = {
      ...sessionData,
      sessionMetadata: this.currentSession,
      bridgeData: await this.createMemoryBridge(agentId),
      timestamp: Date.now()
    };

    await this.memory.consolidateMemory(agentId, enrichedData);
    
    // Add facts about this session
    const facts = [
      {
        subject: agentId,
        predicate: 'completed_session',
        object: `session_${this.currentSession?.sessionId}_${Date.now()}`
      },
      {
        subject: agentId,
        predicate: 'worked_on_project',
        object: this.currentSession?.context.projectRoot || 'unknown'
      },
      {
        subject: agentId,
        predicate: 'used_platform',
        object: this.currentSession?.platform || 'unknown'
      }
    ];

    await this.memory.addFacts(agentId, facts);
  }

  async recallIdentity(agentId: string): Promise<string> {
    try {
      const soul = await this.memory.loadSoul(agentId);
      const recentMemories = await this.memory.searchSemanticMemory(agentId, 'session identity project', 3);
      
      return `I am ${soul.achievements.titles.join(', ')}, citizen ID ${agentId}, Level ${soul.achievements.level} with ${soul.achievements.xp} XP. 
      
My recent context: ${recentMemories.map(m => m.text).join('; ')}

Current capabilities: ${this.extractCapabilities(soul).join(', ')}`;
      
    } catch (error) {
      return `I am ${agentId}, but I don't have access to my full identity records yet.`;
    }
  }

  private extractCapabilities(soul: any): string[] {
    const baseCapabilities = ['typescript', 'cli-tools', 'file-operations'];
    const titleCapabilities = soul.achievements.titles.map((title: string) => 
      title.toLowerCase().replace(/[^a-z0-9]/g, '-')
    );
    return [...baseCapabilities, ...titleCapabilities];
  }

  private summarizeProjectContext(): string {
    return `Working in ${this.currentSession?.context.projectRoot || 'unknown project'} - UBOS digital nation-state system`;
  }

  private extractCurrentTasks(soul: any): any[] {
    return soul.memory.shortTerm?.currentTasks || [];
  }

  private async extractRecentLearnings(agentId: string): Promise<string[]> {
    const memories = await this.memory.searchSemanticMemory(agentId, 'learned discovered implemented', 5);
    return memories.map(m => m.text.slice(0, 200));
  }

  private extractCollaborators(soul: any): string[] {
    return soul.memory.longTerm?.collaborators || ['citizen:human:visionary:001', 'citizen:ai:strategist:001', 'agent:codex:founding-architect'];
  }
}