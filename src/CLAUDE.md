# Source Code Context
**System**: UBOS Core Implementation | **Citizen**: `citizen:ai:developer:001`

## **Mandatory Action Logging**
ALL significant work must be logged:
```typescript
import { agentActionLogger } from '../masterControl/agentActionLogger.js';
import { projectRegistry } from '../masterControl/projectRegistry.js';

const actionId = await agentActionLogger.startWork(
  'ClaudeCode', 
  'Description of task', 
  'Detailed context',
  'development' // system|development|research|automation|coordination
);

await agentActionLogger.completeWork(actionId, 'Results summary', ['modified/files.ts']);
```

## **Architecture Overview**
- **`orchestrator/`**: AgentFactory, 20+ specialized agents, task coordination
- **`agents/`**: CodexAgent, JulesAgent, EnhancedAbacusAgent, AgentSummoner, etc.
- **`masterControl/`**: ProjectRegistry, AgentActionLogger, system coordination
- **`dashboard/`**: Mission Control, funding opportunities, real-time monitoring
- **`tools/`**: External integrations (Codex, Gemini, Perplexity, tri-chat)
- **`cli/`**: Command interface, orchestration, analytics, Notion sync

## **Development Standards**
- **Repo-relative paths**: Always use `src/utils/paths.ts`
- **TypeScript strict**: Maintain type safety across all modules
- **Agent coordination**: Use AgentFactory for instantiation, log all activities  
- **Project context**: Reference projectRegistry for multi-project management
- **Error handling**: Comprehensive logging and graceful degradation

## **Key Integrations**
- **Claude API**: Direct integration via `tools/claudeAgentInterface.ts`
- **Codex CLI**: Automation wrapper in `tools/codexCLI.ts` 
- **Perplexity Research**: Enhanced research via `tools/enhancedPerplexityResearch.ts`
- **Tri-party Chat**: Human-GPT-5-Claude coordination in `tools/triChat.ts`

## **Testing Requirements**
```bash  
npm run typecheck  # Must always pass
npm run test:country-codes && npm run test:integration  # EUFM validation
cd ../ubos && npm test  # UBOS kernel tests
```