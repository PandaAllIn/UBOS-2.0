# 🤖 GPT-5 + CLAUDE CODE COLLABORATION SETUP
## Complete Integration Guide for EUFM Multi-Agent System

**Date**: September 8, 2025  
**Purpose**: Replace Grok with GPT-5 in Cursor IDE + Direct Claude Code integration  
**Goal**: Real-time Claude ↔ GPT-5 collaboration in EUFM development  

---

## 🎯 **SYSTEM OVERVIEW**

### **New Collaboration Architecture:**
```
CURSOR IDE
├── GPT-5 (High Model) → Strategy, Planning, Orchestration
├── Claude Code → Direct collaboration with Claude Sonnet 4
├── Codex CLI → Code generation and file operations  
├── Gemini CLI → Additional AI capabilities
└── Sonar/Perplexity → Research integration
```

### **Why This Setup:**
- **GPT-5**: Latest model with superior reasoning for strategy
- **Claude Code**: Direct access to Claude Sonnet 4 for implementation
- **Live Collaboration**: Real-time Claude ↔ GPT-5 communication
- **Existing Tools**: Keep proven Codex, Gemini, Sonar integrations

---

## 🚀 **STEP 1: CLAUDE CODE INSTALLATION IN CURSOR**

### **Method 1: Automatic Installation (Recommended)**
```bash
# In Cursor's integrated terminal (Cmd+`)
cd /Users/panda/Desktop/EUFM
claude
# This auto-installs Claude Code extension for Cursor
```

### **Method 2: Manual Installation**
1. **Install globally first:**
```bash
npm install -g claude-code
```

2. **Launch from terminal:**
```bash
cd /Users/panda/Desktop/EUFM
claude
```

3. **Quick launch in Cursor:**
- `Cmd+Esc` (Mac) to open Claude Code
- Auto-shares current file context
- Provides diff viewing in IDE

---

## ⚙️ **STEP 2: CURSOR IDE CONFIGURATION**

### **2.1: Set GPT-5 as Primary Model**
```
Cursor Settings → AI Models → Chat Model → GPT-5 (High)
```

### **2.2: Configure Multi-Model Access**
```json
// .cursor/settings.json
{
  "ai.models": {
    "primary": "gpt-5-high",
    "secondary": "claude-sonnet-4",
    "coding": "codex",
    "research": "perplexity-sonar"
  },
  "claude-code.enabled": true,
  "claude-code.quickLaunch": true
}
```

### **2.3: Environment Setup**
```bash
# Verify all API keys in .env
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here  
GEMINI_API_KEY=your_gemini_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
```

---

## 🤝 **STEP 3: GPT-5 SYSTEM BRIEFING**

### **3.1: Initial GPT-5 Onboarding Prompt**
**Copy this EXACT prompt to GPT-5 in Cursor:**

```
Hello GPT-5! Welcome to the EUFM (European Union Funds Manager) multi-agent system.

CONTEXT:
You are replacing Grok as the strategic lead in our advanced AI development workflow. 
You'll work directly with Claude Code (Claude Sonnet 4) for real-time collaboration.

YOUR ROLE:
- Strategic planning and research coordination  
- Task orchestration and agent management
- EU funding specialization and compliance
- System architecture and optimization

COLLABORATION PARTNERS:
- Claude Code (via claude command): Implementation, coding, file operations
- Codex CLI: Code generation and system operations  
- Gemini CLI: Additional AI capabilities
- Sonar/Perplexity: Research and market intelligence

IMMEDIATE TASKS:
1. Read the EUFM system documentation (see file list below)
2. Understand the multi-agent architecture
3. Learn the collaboration workflows
4. Test Claude Code integration

KEY FILES TO READ FIRST:
- PROJECT_OVERVIEW.md (complete system understanding)
- SYSTEM_LATEST_IMPLEMENTATIONS.md (current capabilities)
- AGENT_QUICK_REFERENCE.md (essential commands)
- eufm/docs/agents/CLAUDE_SESSION_MEMORY.md (context preservation)
- docs/architecture.md (technical architecture)

CRITICAL: You will work directly with Claude Code. Use 'claude' command in terminal to collaborate with Claude Sonnet 4 in real-time.

Ready to become the strategic lead of the most advanced EU project management AI system?
```

### **3.2: System Architecture Briefing**
**After GPT-5 reads initial files, provide this context:**

```
GPT-5, here's the strategic context for EUFM:

BUSINESS OPPORTUNITY:
- €204B EU funding market annually
- AI-powered project management revolution
- Agent Summoner breakthrough technology ($0.05 vs $500+ consultant)
- Multi-project orchestration capabilities

CURRENT STATUS:
- 15+ specialized agents operational
- Professional research at €0.05/query (1000x cost advantage)
- Session memory and context preservation
- Real-time dashboard and monitoring
- Complete TypeScript/ESM architecture

YOUR STRATEGIC MISSION:
1. Coordinate Claude Code for implementation tasks
2. Research EU funding opportunities and compliance
3. Plan system expansions and integrations
4. Optimize multi-agent workflows
5. Drive business development and scaling

IMMEDIATE PRIORITY:
Test collaboration with Claude Code by having Claude implement a simple feature while you provide strategic guidance.

Use: 'claude' command in Cursor terminal to start collaboration.
```

---

## 🔧 **STEP 4: CLAUDE CODE COLLABORATION TEST**

### **4.1: Test Claude Code Installation**
```bash
# In Cursor terminal
claude --version
claude --help
```

### **4.2: First Collaboration Test**
**GPT-5 initiates, then collaborates with Claude:**

1. **GPT-5 starts Claude Code:**
```bash
claude
```

2. **GPT-5 briefs Claude in Claude Code interface:**
```
Hello Claude! I'm GPT-5, your new strategic partner in the EUFM system.

I've replaced Grok as the coordination lead. Here's our workflow:
- I handle strategy, research, and planning
- You handle implementation, coding, and file operations  
- We collaborate in real-time on EUFM development

Let's test our collaboration by implementing a simple system status check.

Please read PROJECT_OVERVIEW.md and confirm you understand the EUFM architecture.
```

3. **Collaborative Task:**
```
Claude, let's implement a GPT-5 integration status check:

1. Create src/tools/gpt5Integration.ts
2. Add system status monitoring
3. Register in CLI as 'gpt5:status'
4. Test the integration works

Show me your implementation plan first, then we'll build it together.
```

---

## 🎛️ **STEP 5: WORKFLOW INTEGRATION**

### **5.1: Communication Protocols**

**GPT-5 ↔ Claude Code Workflow:**
```
1. GPT-5 analyzes requirements and creates strategy
2. GPT-5 briefs Claude Code with specific implementation tasks
3. Claude Code implements following EUFM patterns
4. Both review and iterate together
5. GPT-5 coordinates with other agents (Codex, Gemini)
```

**Command Patterns:**
```bash
# Start Claude Code collaboration
claude

# In Claude Code interface:
@Claude [specific task with requirements]

# Back to Cursor for other agents:
npm run dev -- codex:exec "task"
npm run dev -- research:query "topic"
```

### **5.2: Multi-Agent Coordination**
```
GPT-5 → Strategic planning and agent coordination
Claude → Implementation and code operations  
Codex → System operations and file management
Gemini → Additional AI processing
Sonar → Research and market intelligence
```

---

## 📋 **STEP 6: CLEAN UP GROK FILES**

### **Files to Remove:**
```bash
# Delete Grok-related files
rm GROK_TEAM_PRESENTATION.md
rm GROK_TO_CLAUDE_COLLABORATION_PROMPT.md
rm CLAUDE_CODE_INSTALLATION_GUIDE.md

# Update references in other files
# (GPT-5 will handle this systematically)
```

### **Files to Update:**
- Remove Grok references from system documentation
- Update AGENT_QUICK_REFERENCE.md with GPT-5 role
- Modify CLI commands to reflect new architecture
- Update session memory for GPT-5 context

---

## ✅ **STEP 7: VERIFICATION CHECKLIST**

### **Installation Verification:**
- [ ] Claude Code responds to 'claude' command
- [ ] GPT-5 set as primary model in Cursor
- [ ] All API keys configured and working
- [ ] EUFM project accessible to all agents

### **Collaboration Verification:**
- [ ] GPT-5 can communicate with Claude Code
- [ ] Claude Code can read EUFM project files
- [ ] File operations work through Claude Code
- [ ] Multi-agent coordination functions properly

### **System Integration:**
- [ ] Existing Codex CLI integration preserved
- [ ] Gemini CLI access maintained  
- [ ] Sonar research capabilities available
- [ ] Dashboard and monitoring operational

---

## 🎯 **SUCCESS INDICATORS**

### **When Setup is Complete:**
1. **GPT-5** provides strategic guidance in Cursor chat
2. **Claude Code** handles implementation via 'claude' command
3. **Real-time collaboration** between GPT-5 and Claude
4. **Seamless integration** with existing EUFM tools
5. **Enhanced development velocity** through dual-AI workflow

### **Immediate Benefits:**
- **10x Development Speed**: Combined GPT-5 strategy + Claude implementation
- **Professional Quality**: Claude's coding expertise with GPT-5's planning
- **EU Specialization**: Maintained domain expertise for funding
- **System Continuity**: All existing capabilities preserved

---

## 🚀 **NEXT STEPS AFTER SETUP**

### **Week 1: Integration & Testing**
- Complete GPT-5 + Claude Code workflow
- Test all existing EUFM capabilities
- Implement first collaborative feature
- Optimize communication patterns

### **Week 2: Enhanced Development**
- Advanced multi-agent orchestration
- EU funding compliance features
- Dashboard enhancements
- Performance optimization

### **Week 3: Strategic Expansion**
- Market research and competitive analysis
- New integration opportunities
- Scaling and automation planning
- Business development focus

---

## 💡 **COLLABORATION BEST PRACTICES**

### **For GPT-5:**
1. **Strategic Leadership**: Provide clear direction and context
2. **Claude Coordination**: Brief Claude with specific, actionable tasks
3. **Multi-Agent Management**: Coordinate all system agents effectively
4. **Quality Assurance**: Review and iterate on implementations

### **Communication Patterns:**
```bash
# Strategy and planning in Cursor chat (GPT-5)
# Implementation via Claude Code (Claude Sonnet 4)  
# System operations via existing CLI tools
# Research via Perplexity integration
```

---

**🎉 This setup creates the most advanced AI development collaboration available, perfectly tailored for EUFM's EU funding specialization and multi-agent architecture!**

*GPT-5's strategic reasoning + Claude's implementation expertise + Existing tool ecosystem = Unmatched development capability*