# EUFM AGENT QUICK REFERENCE
## Essential Commands & Capabilities for All Agents

---

## 🚀 IMMEDIATELY AVAILABLE CAPABILITIES

### **Claude Agent Interface (Primary)**
```typescript
// Available through claudeInterface in src/tools/claudeAgentInterface.ts
await claudeInterface.executeCodexTask("development task");
await claudeInterface.conductResearch("research query", { depth: 'comprehensive' });
await claudeInterface.findOptimalAgent("complex task");
await claudeInterface.getSystemStatus();
```

### **Direct CLI Commands**
```bash
# Codex CLI Operations
npm run dev -- codex:exec "create TypeScript interface"
npm run dev -- codex:status

# Enhanced Research  
npm run dev -- research:query "EU AI Act requirements"

# Agent Summoning
npm run dev -- agent:summon "find best approach for PM² implementation"

# System Status
npm run dev -- claude:ready
npm run dev -- claude:status
npm run dev -- gpt5:status                    # GPT-5 + Claude collaboration health
npm run dev -- gpt5:status --json             # Machine-readable status (CI friendly)

# Tri-Party Chat (GPT-5 ↔ Claude ↔ Human)
npm run dev -- tri:chat                       # 🌟 ELEGANT CHAT UI (recommended)
npm run dev -- tri:send human claude "Hello"  # Send message between participants
npm run dev -- tri:bridge 20                  # Process pending messages (one-shot)
npm run dev -- tri:watch 20                   # Auto-process messages (live mode)
npm run dev -- tri:status                     # Show recent chat messages
```

---

## 🤖 AVAILABLE AGENTS & WHEN TO USE

| Agent | Use When | Capabilities | Cost |
|-------|----------|--------------|------|
| **CodexCLIAgent** | Direct file/system operations needed | File creation, code generation, system setup | Variable |
| **EnhancedAbacusAgent** | Professional research required | Academic-grade analysis, EU domain expertise | ~$0.05/query |
| **EUFMAgentSummoner** | Strategic planning for EUFM tasks | Task analysis, agent recommendation, execution planning | ~$0.02 |
| **AgentSummonerAgent** | Need to discover external tools | Research external agents, cost-benefit analysis | ~$0.05 |
| **JulesAgent** | Code review and guidance needed | Code quality assessment, development guidance | Low |
| **BrowserAgent** | Web automation required | Scraping, form filling, web interaction | Low |

---

## 📋 TASK ROUTING LOGIC

**Development Tasks** → CodexCLIAgent (if file ops) OR CodexAgent (if planning)
**Research Tasks** → EnhancedAbacusAgent (if Perplexity Pro available) OR Standard research
**Strategic Planning** → EUFMAgentSummoner (EUFM-specific) OR AgentSummonerAgent (general)
**Code Review** → JulesAgent 
**Web Operations** → BrowserAgent
**Unknown/Complex** → Agent Summoner for discovery

---

## 💾 DATA LOCATIONS

```
logs/
├── research_data/perplexity/     # Professional research results
├── agent_summoner/               # Agent discovery and evaluation
├── sessions/                     # Session memory and context
├── codex_*.log                  # Development operation logs
└── orchestrator/                # Task execution results
```

---

## 🎯 COMMON WORKFLOWS

### **Research → Implementation**
1. `research:query "domain expertise needed"`
2. `codex:exec "implement based on research findings"`
3. Review and iterate

### **Strategic Planning → Execution**
1. `agent:summon "complex task description"`
2. Follow recommended agent and configuration
3. Monitor execution and results

### **Development Task**
1. Check if file operations needed → CodexCLIAgent
2. Otherwise → CodexAgent for planning
3. JulesAgent for review

---

## ⚡ PERFORMANCE EXPECTATIONS

- **Research**: 30-90 seconds, 70-95% confidence, ~$0.05
- **Codex Operations**: Variable time, direct system access
- **Agent Summoning**: 60-120 seconds, strategic analysis
- **Session Continuity**: Auto-restore within 24 hours

---

## 🔧 CONFIGURATION STATUS

**Required Environment Variables:**
- ✅ PERPLEXITY_API_KEY (configured)
- ✅ OPENAI_API_KEY (for Codex CLI)
- ✅ ANTHROPIC_API_KEY, GEMINI_API_KEY

**System Dependencies:**
- ✅ Codex CLI installed and functional
- ✅ TypeScript/Node.js ESM environment
- ✅ All agent classes registered in AgentFactory

---

## 📖 FULL DOCUMENTATION

**For Complete Implementation Details:** `/SYSTEM_LATEST_IMPLEMENTATIONS.md`
**For Session Memory:** `eufm/docs/agents/CLAUDE_SESSION_MEMORY.md`
**For Architecture:** `/docs/architecture.md`

---

## 🏁 EXIT CODES & AUTOMATION

**GPT-5 Status Command:**
```bash
npm run dev -- gpt5:status           # Human-readable collaboration health report
npm run dev -- gpt5:status --json    # Machine-readable JSON output for CI/automation
```

**Exit Code Behavior:**
- `0` → Collaboration healthy (GPT-5 + Claude ready)
- `2` → Collaboration issues detected (missing keys/tools)  
- `1` → Command error or system failure

---

*Quick reference for agent coordination and system capabilities*
*Last Updated: January 9, 2025*

