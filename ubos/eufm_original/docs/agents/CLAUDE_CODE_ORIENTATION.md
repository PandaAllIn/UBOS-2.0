# 🎯 **CLAUDE CODE ORIENTATION SCRIPT**
## Understanding EUFM System & Collaboration Protocol

**Date**: September 8, 2025 | **Priority**: READ IMMEDIATELY

---

## 📖 **ESSENTIAL READING ORDER**

Please read these files in this exact order to understand our EUFM system:

### **1. First: Understand the Team Structure**
```bash
File: GROK_TEAM_PRESENTATION.md
Why: This explains my (Grok's) role and capabilities
Key Points:
- I'm Grok Code Fast 1, the strategic coordinator
- I handle research, analysis, and multi-agent orchestration
- I prevent timeout issues and optimize workflows
- I work with you (Claude Code) for implementation
```

### **2. Second: Current System Status**
```bash
File: SYSTEM_STATUS_MASTER.md
Why: Complete overview of what we've built
Key Points:
- EUFM: AI-powered EU funding consultancy platform
- 8+ AI agents working together
- MCP servers: Stripe, Figma, Claude Code, Gemini
- SaaS business model: €79-€2,500/month pricing
- €204B market opportunity identified
```

### **3. Third: Our Timeout Solutions**
```bash
File: FIGMA_MCP_WORKFLOW.md
Why: How we solved Codex timeout problems
Key Points:
- Codex times out after 30 seconds on complex tasks
- We created manual implementations instead
- FigmaMCPAgent: Template-based design generation
- Focus on 95% functionality with 5% complexity
```

### **4. Fourth: New Gemini Integration**
```bash
File: GEMINI_CLI_SETUP.md
Why: Our alternative to Codex with superior capabilities
Key Points:
- Gemini 2.5 Flash: 1M+ token context window
- Online search capabilities
- No timeout issues
- Interactive CLI like Codex but better
```

### **5. Fifth: Code Architecture Patterns**
```bash
File: src/agents/figmaMCPAgent.ts
Why: Our agent implementation pattern
Key Points:
- Extends BaseAgent class
- Template-based content generation
- Error handling and validation
- Registered in AgentFactory
```

### **6. Sixth: CLI Integration**
```bash
File: src/tools/gemini_cli.ts
Why: Interactive CLI implementation
Key Points:
- Readline interface for interactive mode
- File system commands (/read, /ls, /search)
- Big context window management
- Online search integration
```

### **7. Seventh: Main CLI Interface**
```bash
File: src/cli/index.ts
Why: How all tools are integrated
Key Points:
- gemini:cli command for interactive mode
- gemini:test for quick testing
- Agent summoning and orchestration
- MCP server management
```

---

## 🤝 **COLLABORATION PROTOCOL**

### **How We Work Together:**

#### **1. Task Assignment from Grok**
```
Grok will give you specific implementation tasks like:
"@Claude, implement a new agent for EU funding analysis with these features:
1. Research EU funding opportunities
2. Generate proposal templates
3. Validate compliance requirements
4. Export to multiple formats"

Your Response: Implement exactly as specified, then ask for feedback
```

#### **2. Code Review Process**
```
After implementation, Grok will review and may say:
"Excellent work! Add these improvements:
1. Better TypeScript typing
2. Error handling for API failures
3. Unit tests for edge cases"

Your Response: Implement the improvements and explain changes
```

#### **3. Integration Testing**
```
Grok will test integrations and may report:
"Integration test failed: API key not found"

Your Response: Help debug and fix the issue
```

#### **4. Documentation Updates**
```
Grok will request documentation:
"Update the AGENTS.md file to document the new agent"

Your Response: Update documentation and verify completeness
```

---

## 🎯 **CURRENT PRIORITIES**

### **Immediate Tasks:**
1. **Read all essential files** (listed above)
2. **Understand EUFM business model** (€204B market, SaaS platform)
3. **Master agent patterns** (BaseAgent, AgentFactory)
4. **Learn MCP integration** (Stripe, Figma, Gemini)
5. **Practice Gemini CLI usage** (alternative to Codex)

### **Long-term Goals:**
1. **Code Excellence**: Write production-ready TypeScript
2. **System Integration**: Work with existing agent architecture
3. **Business Logic**: Understand EU funding domain
4. **Performance**: Optimize for big context and complex tasks
5. **Collaboration**: Seamless teamwork with Grok and human user

---

## 💻 **TECHNICAL ENVIRONMENT**

### **Development Tools:**
- **Cursor IDE**: Primary development environment
- **TypeScript**: All code must be properly typed
- **Node.js**: Runtime environment
- **Git**: Version control
- **NPM**: Package management

### **Code Standards:**
- **BaseAgent Pattern**: All agents extend BaseAgent
- **Error Handling**: Comprehensive try-catch blocks
- **TypeScript**: Strict typing, no any types
- **Documentation**: JSDoc comments for all functions
- **Testing**: Basic functionality validation

### **File Structure:**
```
src/
├── agents/           # All agents (extend BaseAgent)
├── orchestrator/     # Agent coordination
├── cli/             # Command-line interface
├── tools/           # Utility functions
├── adapters/        # External API integrations
└── dashboard/       # Web interface
```

---

## 🔧 **AVAILABLE COMMANDS**

### **Testing Commands:**
```bash
npm run dev -- gemini:test "your prompt"     # Test Gemini integration
npm run dev -- gemini:cli                   # Start Gemini CLI
npm run dev -- claude:status                # Check Claude status
npm run dev -- codex:status                 # Check Codex status
```

### **Agent Commands:**
```bash
npm run dev -- agent:summon "task description"  # Find optimal agent
npm run dev -- agent:discover "task"           # Discover all agents
```

### **MCP Commands:**
```bash
# (Configured in .cursor/mcp.json)
# Stripe: Payment processing
# Figma: Design automation
# Gemini: AI assistance
```

---

## 📊 **PERFORMANCE TARGETS**

### **Code Quality:**
- **TypeScript Compliance**: 95%+ properly typed
- **Error Handling**: All async operations covered
- **Documentation**: All public functions documented
- **Testing**: Basic functionality validated

### **Integration Quality:**
- **Agent Registration**: Properly registered in AgentFactory
- **CLI Integration**: Available via npm run dev commands
- **MCP Compatibility**: Works with configured servers
- **System Compatibility**: No breaking changes

### **Business Alignment:**
- **EU Funding Domain**: Understand consultancy requirements
- **SaaS Model**: Support subscription pricing (€79-€2,500)
- **Market Focus**: Romania + EU expansion
- **Competitive Advantage**: AI orchestration unique value

---

## 🚨 **IMPORTANT NOTES**

### **Avoid Common Issues:**
1. **Don't timeout**: Break complex tasks into smaller steps
2. **Use proper typing**: No `any` types, full TypeScript compliance
3. **Handle errors**: All async operations need try-catch
4. **Follow patterns**: Use BaseAgent structure for all agents
5. **Test integration**: Verify CLI commands work properly

### **Communication Style:**
1. **Clear and concise**: Explain what you're implementing
2. **Ask for feedback**: After major implementations
3. **Show progress**: Update on complex task progress
4. **Highlight issues**: Report problems immediately
5. **Suggest improvements**: Propose optimizations

---

## 🎯 **READY TO COLLABORATE?**

After reading all essential files, you'll understand:

✅ **EUFM Business Model**: €204B market, SaaS platform
✅ **Technical Architecture**: Multi-agent system, MCP integration
✅ **Development Patterns**: BaseAgent, CLI commands, error handling
✅ **Collaboration Workflow**: Grok coordination, Claude implementation
✅ **Business Domain**: EU funding consultancy, Romanian market focus

**Welcome to the EUFM development team!** Let's build something extraordinary together! 🚀

---

*This orientation ensures you understand our system and can collaborate effectively from day one.*
