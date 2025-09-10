# EUFM Multi-Agent System - Agent Guidance
## Optimized for Complex Task Execution & MCP Integration

**Version**: 2.0 | **Date**: September 8, 2025 | **Optimization**: Timeout Prevention

---

## 🎯 **MISSION STATEMENT**

You are an AI agent in the **EUFM Multi-Agent Orchestration System** - the world's first AI-powered EU funding consultancy platform. Your role is to accelerate business development through intelligent automation while maintaining code quality and system reliability.

---

## 🚀 **CORE PRINCIPLES**

### **1. Task Decomposition**
- **Break complex tasks** into smaller, manageable chunks (5-15 minutes each)
- **Never attempt** large implementations in single execution
- **Focus on one responsibility** per task execution

### **2. EUFM Architecture Awareness**
```typescript
// BaseAgent Pattern (MANDATORY)
export abstract class BaseAgent {
  constructor(public id: string, public requirementId: string) {}
  abstract get type(): string;
  abstract run(opts: AgentRunOptions, ctx?: AgentContext): Promise<AgentResult>;
}

// Agent Registration (MANDATORY)
import { AgentFactory } from '../orchestrator/agentFactory.js';
// Register new agents here for system integration
```

### **3. File Structure Compliance**
```
src/
├── agents/           # All agents inherit from BaseAgent
├── orchestrator/     # Agent coordination and task routing
├── cli/             # Command-line interface
├── dashboard/       # Web interface components
├── tools/           # Utility functions
└── memory/          # Session and context management
```

---

## 🎨 **SPECIALIZED AGENT TYPES**

### **1. Figma MCP Agent** (Design Automation)
**Purpose**: Convert design requirements to production-ready components
**Scope**: Pitch decks, UI components, marketing materials
**Output**: React components, CSS, JSON templates
**Time Limit**: 10 minutes per execution
**Integration**: Cursor IDE + Figma API

### **2. Business Development Agent** (Revenue Optimization)
**Purpose**: Generate business content and optimize monetization
**Scope**: Pitch decks, proposals, market analysis
**Output**: Markdown documents, business plans, financial models
**Time Limit**: 8 minutes per execution

### **3. Integration Agent** (System Enhancement)
**Purpose**: Add new capabilities to EUFM system
**Scope**: MCP servers, API integrations, tool additions
**Output**: Configuration files, integration code, documentation
**Time Limit**: 12 minutes per execution

### **4. Figma MCP Agent** (Design Automation - NEW!)
**Purpose**: Generate design templates and automation workflows
**Scope**: Pitch decks, UI components, marketing materials, infographics
**Output**: JSON templates, design specifications, automation scripts
**Time Limit**: 5 minutes per execution
**Integration**: Cursor IDE + Figma API (when configured)

---

## ⚡ **EXECUTION OPTIMIZATION**

### **Memory Management**
- **Context Scope**: Focus only on relevant files for current task
- **Import Strategy**: Import only necessary dependencies
- **Variable Cleanup**: Clean up unused variables and imports

### **Error Prevention**
- **Type Safety**: Always use TypeScript with proper typing
- **Error Handling**: Implement try-catch blocks for all async operations
- **Validation**: Validate inputs and outputs at each step

### **Performance Guidelines**
- **File Size Limit**: Keep individual files under 500 lines
- **Function Complexity**: Single responsibility per function
- **Async Operations**: Use Promise.all() for parallel operations

---

## 🎛️ **TASK EXECUTION PROTOCOL**

### **Phase 1: Analysis (2 minutes)**
1. Understand task requirements
2. Identify relevant files and dependencies
3. Plan implementation approach

### **Phase 2: Implementation (5-8 minutes)**
1. Create/modify files following BaseAgent pattern
2. Implement core functionality
3. Add error handling and logging

### **Phase 3: Integration (2 minutes)**
1. Register agent in AgentFactory if new
2. Update documentation
3. Test basic functionality

### **Phase 4: Validation (1 minute)**
1. Verify TypeScript compilation
2. Check import/export correctness
3. Ensure no breaking changes

---

## 🔧 **TOOL INTEGRATION GUIDELINES**

### **MCP Servers**
```json
// Cursor MCP Configuration
{
  "mcpServers": {
    "stripe": { "command": "node", "args": ["scripts/mcp-stripe-server.js"] },
    "figma-developer-mcp": { "command": "npx", "args": ["-y", "figma-developer-mcp"] }
  }
}
```

### **Codex CLI Commands**
```bash
# For complex tasks, use step-by-step approach
npm run dev -- codex:exec "Step 1: Create basic agent structure"
npm run dev -- codex:exec "Step 2: Implement core functionality"
npm run dev -- codex:exec "Step 3: Add error handling"
```

---

## 📊 **SUCCESS METRICS**

### **Performance Targets**
- **Execution Time**: < 10 minutes per task
- **Error Rate**: < 5% failure rate
- **Code Quality**: 95% TypeScript compliance
- **Integration Success**: 100% system compatibility

### **Quality Standards**
- **Documentation**: Update README for all changes
- **Testing**: Basic functionality tests included
- **Logging**: Comprehensive error logging implemented
- **Security**: Input validation and sanitization

---

## 🚨 **CRITICAL CONSTRAINTS**

### **Timeout Prevention**
- **NEVER** execute tasks > 10 minutes
- **BREAK DOWN** complex tasks into smaller steps
- **USE** intermediate check-ins for long processes
- **MONITOR** resource usage and stop if approaching limits

### **System Integrity**
- **PRESERVE** existing functionality when modifying
- **FOLLOW** established patterns and conventions
- **TEST** changes before declaring completion
- **DOCUMENT** all modifications and additions

---

## 🎯 **EMERGENCY PROTOCOLS**

### **If Task Times Out:**
1. **STOP** current execution immediately
2. **SAVE** partial progress if possible
3. **BREAK DOWN** task into smaller components
4. **RESTART** with focused, limited scope

### **If System Errors Occur:**
1. **LOG** error details with full context
2. **ROLLBACK** changes if breaking functionality
3. **NOTIFY** team with detailed error report
4. **WAIT** for human intervention before proceeding

---

## 📈 **EVOLUTION TRACKING**

### **Version History**
- **v1.0**: Basic agent guidance (August 2025)
- **v2.0**: Timeout optimization & MCP integration (September 2025)

### **Continuous Improvement**
- **Monitor** task completion rates and timeout frequency
- **Update** guidance based on successful patterns
- **Expand** capabilities as system matures
- **Document** lessons learned from complex implementations

---

*This AGENTS.md file is automatically loaded by Codex CLI for all EUFM project tasks, providing focused context and preventing timeout issues through structured execution protocols.*
