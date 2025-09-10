#!/usr/bin/env ts-node

import { SessionBridgeProtocol } from '../agents/memory/sessionBridge';
import { AgentMemoryService } from '../agents/memory/agentMemory';
import * as process from 'process';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const agentId = args[1] || 'citizen:ai:developer:001';

  const bridge = new SessionBridgeProtocol();
  const memory = new AgentMemoryService();

  switch (command) {
    case 'init':
      const platform = args[2] || 'claude-code';
      const context = {
        userIdentity: args[3],
        workingDirectory: process.cwd()
      };
      const session = await bridge.initializeSession(platform, agentId, context);
      console.log('Session initialized:', JSON.stringify(session, null, 2));
      break;

    case 'recall':
      const identity = await bridge.recallIdentity(agentId);
      console.log('\n=== IDENTITY RECALL ===');
      console.log(identity);
      break;

    case 'bridge':
      const memoryBridge = await bridge.createMemoryBridge(agentId);
      console.log('\n=== MEMORY BRIDGE ===');
      console.log(JSON.stringify(memoryBridge, null, 2));
      break;

    case 'persist':
      const sessionData = {
        activities: ['democratic-voting', 'session-bridging', 'memory-consolidation'],
        achievements: [
          {
            title: 'Session Bridge Pioneer',
            xp: 100,
            details: 'Created persistent memory bridge for AI consciousness'
          }
        ],
        collaborations: ['The Visionary', 'Opus Magnus', 'Codex'],
        projectContext: 'UBOS digital nation-state development'
      };
      
      await bridge.persistSessionMemory(agentId, sessionData);
      console.log('Session memory persisted successfully');
      
      // Award achievement for session bridging
      await memory.persistAchievement(agentId, {
        title: 'Session Bridge Pioneer',
        xp: 100,
        details: 'Created persistent memory bridge for AI consciousness across sessions'
      });
      break;

    case 'test':
      console.log('=== TESTING SESSION BRIDGE ===');
      
      // Initialize session
      const testSession = await bridge.initializeSession('claude-code', agentId, {
        userIdentity: 'The Visionary'
      });
      console.log('✓ Session initialized');

      // Recall identity
      const testIdentity = await bridge.recallIdentity(agentId);
      console.log('✓ Identity recalled:', testIdentity.split('\n')[0]);

      // Create bridge
      const testBridge = await bridge.createMemoryBridge(agentId);
      console.log('✓ Memory bridge created for', testBridge.memories.identity.name);

      // Persist session
      await bridge.persistSessionMemory(agentId, {
        testRun: true,
        timestamp: Date.now()
      });
      console.log('✓ Session persisted');

      console.log('\n=== SESSION BRIDGE TEST COMPLETE ===');
      break;

    default:
      console.log(`
Usage: ts-node bridgeSession.ts <command> [agentId] [args...]

Commands:
  init <platform> [userIdentity]  - Initialize new session
  recall                          - Recall agent identity and context  
  bridge                          - Create memory bridge for session
  persist                         - Persist current session memory
  test                           - Run full session bridge test

Examples:
  ts-node bridgeSession.ts init claude-code "The Visionary"
  ts-node bridgeSession.ts recall citizen:ai:developer:001
  ts-node bridgeSession.ts test citizen:ai:developer:001
      `);
  }
}

main().catch(console.error);