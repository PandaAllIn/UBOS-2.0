# 🏗️ EUFM SYSTEM ARCHITECTURE
## Complete File Organization & Agent Reference Guide

**Last Updated**: 2025-09-07T15:15:00Z  
**Purpose**: Master reference for all agents - file locations, responsibilities, and interaction patterns  

---

## 📁 **CORE SYSTEM DIRECTORIES**

### `/src/masterControl/` - **System Coordination Hub**
Central command and control for the entire EUFM ecosystem.

```
masterControl/
├── projectRegistry.ts          ⭐ Multi-project management & portfolio tracking
├── agentActionLogger.ts        🔄 System-wide agent activity coordination  
├── MASTER_SYSTEM_REGISTRY.md   📋 Central coordination hub (all agents reference here)
└── systemScheduler.ts          ⏰ [PLANNED] 24/7 automation & cron scheduling
```

**Key Responsibilities**:
- Multi-project portfolio management (EUFM funding + XF production + future projects)
- Agent coordination timeline and action logging
- System health monitoring and resource allocation
- Cross-project dependency tracking

### `/src/agents/` - **Specialized AI Agents**
Individual agent implementations with specific capabilities.

```
agents/
├── agentSummoner.ts           🧙‍♂️ Meta-intelligence: discovers optimal agents for any task
├── codexAgent.ts              💻 Automated code generation and development
├── julesAgent.ts              🔬 Scientific research and analysis
├── enhancedAbacusAgent.ts     📊 Advanced research with structured outputs  
├── eufmAgentSummoner.ts       🎯 EUFM-specific agent coordination
├── smokeTestAgent.ts          ✅ System health and integration testing
├── testAgent.ts               🧪 General testing and validation
└── codexCLIAgent.ts           🤖 Codex automation through CLI
```

**Agent Interaction Patterns**:
- All agents MUST log actions via `agentActionLogger`
- Agent Summoner can discover and recommend other agents
- Enhanced Abacus provides research backbone for other agents

### `/src/cli/` - **Command Line Interface**
Primary user interaction and system control interface.

```
cli/
└── index.ts                   🎛️ Master CLI with all system commands
```

**Available Command Categories**:
- `master:*` - Portfolio and project management
- `system:*` - Agent coordination and monitoring  
- `claude:*` - Claude interface and session management
- `agent:*` - Agent discovery and summoning
- `codex:*` - Automated development tasks

### `/src/orchestrator/` - **Task Orchestration**
Multi-agent task coordination and workflow management.

```
orchestrator/
├── agentFactory.ts            🏭 Agent instantiation and lifecycle management
├── agentOrchestrator.js       🎼 Multi-agent task coordination
├── capabilityMapper.ts        🗺️ Agent capability discovery and matching
├── strategicOrchestrator.ts   ⚡ Strategic task planning and execution
└── types.ts                   📘 Orchestration type definitions
```

### `/src/dashboard/` - **Real-time Monitoring**
Live system monitoring and web interfaces.

```
dashboard/
├── dashboardServer.ts         🖥️ Express.js server for web dashboard
├── fundingOpportunityScanner.ts 💰 EU funding opportunity monitoring
├── missionControl.ts          🎛️ Core mission control interface
├── enhancedMissionControl.ts  🚀 [ENHANCED] Advanced mission control
└── web/                       🌐 Static web assets
    ├── index.html
    ├── dashboard.css
    └── dashboard.js
```

### `/src/tools/` - **Integration Tools**
External service integrations and utility functions.

```
tools/
├── claudeAgentInterface.ts    🔗 Claude API integration
├── codexCLI.ts               ⚡ Codex automation wrapper
├── enhancedPerplexityResearch.ts 🔍 Advanced research capabilities
├── gemini_test.ts            🧠 Google Gemini integration testing
└── perplexity_sonar.ts       📡 Perplexity API integration
```

---

## 🔄 **AGENT COORDINATION PROTOCOLS**

### **1. Action Logging (MANDATORY)**
All agents MUST log their activities:

```typescript
import { agentActionLogger } from '../masterControl/agentActionLogger.js';

// Start work
const actionId = await agentActionLogger.startWork(
  'AgentName', 
  'Description of task', 
  'Detailed context',
  'category' // system|development|research|automation|coordination
);

// Complete work  
await agentActionLogger.completeWork(
  actionId, 
  'Summary of results',
  ['file1.ts', 'file2.ts'] // optional files modified
);
```

### **2. Project Context (REQUIRED)**
When working on projects, always reference project registry:

```typescript
import { projectRegistry } from '../masterControl/projectRegistry.js';

// Get project context
const project = await projectRegistry.getProject('eufm_funding');
// or
const activeProjects = await projectRegistry.getActiveProjects();
```

### **3. Cross-Agent Communication**
Agents can discover and invoke other agents:

```typescript
import { AgentSummoner } from '../agents/agentSummoner.ts';

// Discover optimal agent for task
const summoner = new AgentSummoner();
const result = await summoner.discoverAgents('specific task description');
```

---

## 📊 **SYSTEM MONITORING**

### **Key Monitoring Commands**
```bash
# System health and coordination
npm run dev -- system:snapshot          # Current system state
npm run dev -- system:timeline 24       # Last 24h activity timeline  
npm run dev -- system:agents AgentName  # Specific agent activity

# Project portfolio management  
npm run dev -- master:status            # Portfolio overview
npm run dev -- master:health            # Health metrics
npm run dev -- master:urgent            # Critical items
```

### **Log File Organization**
```
logs/
├── master_control/
│   ├── project_registry.json           # Multi-project data
│   ├── agent_actions.json              # System-wide agent activity log
│   └── system_snapshot.json            # Current system state
├── orchestrator/                       # Task execution logs
├── funding/                           # EU funding specific logs
└── analytics/                         # Usage and performance metrics
```

---

## 🎯 **PROJECT STRUCTURE**

### **Active Projects** (as of 2025-09-07)

#### **1. XF Production System** (`xf_production`)
- **Status**: Active, €6M track record
- **Location**: `/Users/panda/Desktop/Claude Code/eufm XF/`
- **Agents**: AgentSummoner, MissionControl, ResearchAgent
- **Health**: 98% (Excellent)

#### **2. EUFM EU Funding** (`eufm_funding`)  
- **Status**: Active, €2M+ target
- **Location**: `/Users/panda/Desktop/EUFM/`
- **Agents**: AgentSummoner, EUFundingProposal, EnhancedAbacus, CodexCLI
- **Health**: 92% (Strong)

---

## 🚀 **DEVELOPMENT WORKFLOW**

### **For New Agents**:
1. Create agent in `/src/agents/`
2. Register with AgentFactory in `/src/orchestrator/agentFactory.ts`
3. Add CLI commands in `/src/cli/index.ts` if needed
4. Implement action logging using `agentActionLogger`
5. Update this architecture document

### **For New Projects**:
1. Register with `projectRegistry.registerProject()`
2. Create project-specific logs directory
3. Assign agents and set automation schedules
4. Update MASTER_SYSTEM_REGISTRY.md

### **For System Changes**:
1. Log development action with `agentActionLogger`
2. Update relevant documentation
3. Run `system:snapshot` to verify changes
4. Update session memory if significant change

---

## 📋 **QUICK REFERENCE**

### **Essential Files for Agents**:
- `MASTER_SYSTEM_REGISTRY.md` - Always check here first
- `projectRegistry.ts` - Project context and status
- `agentActionLogger.ts` - Log all your activities  
- `index.ts` (CLI) - Available system commands

### **Key Imports**:
```typescript
import { projectRegistry } from '../masterControl/projectRegistry.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';
import { AgentSummoner } from '../agents/agentSummoner.js';
```

### **System Health Indicators**:
- **Green (90-100%)**: System operating optimally
- **Yellow (70-89%)**: Some attention needed  
- **Orange (50-69%)**: Requires immediate attention
- **Red (<50%)**: Critical system issues

---

## 🔮 **FUTURE ARCHITECTURE**

### **Planned Enhancements**:
- **Real-time Dashboard**: Live web interface for portfolio monitoring
- **24/7 Automation**: Background task scheduler with cron-style automation
- **GitHub Integration**: Automated commits for system state preservation
- **Multi-tenant Support**: Additional project onboarding framework
- **Advanced Analytics**: Predictive modeling for project success

**🎯 This architecture enables seamless coordination between all agents while maintaining clear separation of concerns and scalability for future growth.**