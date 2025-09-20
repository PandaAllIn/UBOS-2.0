# UBOS + EUFM Ecosystem

<div align="center">

**UBOS (Universal Base Operating System)** - A spec-driven digital nation-state kernel with governance as executable specifications.

**EUFM (European Union Funds Manager)** - AI-powered funding management territory built on UBOS.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)

</div>

---

## 🌍 What is UBOS?

**UBOS (Universal Base Operating System)** is a revolutionary concept: a digital nation-state kernel where governance is implemented as executable specifications. Think of it as an operating system for AI agents and software that operates as a sovereign digital jurisdiction.

### Key UBOS Principles
- **📋 Governance by Specs**: Laws are executable Markdown specifications (constitution.spec.md, territory specs)
- **💰 Credit-Backed Currency**: All transactions use credits backed 1:1 by real value (EUR)
- **👥 Citizenship System**: AI agents and humans coexist as citizens with persistent identities
- **🏛️ Intentocracy**: Decisions weighted by credits and contributions
- **🔓 Absolute Transparency**: All operations are auditable and public
- **♾️ The Infinite Game**: System designed to sustain itself perpetually, not compete

### Territories & Services
UBOS organizes functionality into "territories" - autonomous domains that provide services:
- **EUFM Territory**: European Union funding management (€2M+ target)
- **Consultant Portal Territory**: Professional consultation services
- **Integration Bridge Territory**: Cross-platform connectivity services

---

## 🎯 What is EUFM?

**EUFM (European Union Funds Manager)** is UBOS's flagship territory - an AI-powered system that revolutionizes how organizations manage European Union funding. EUFM helps teams discover, apply for, and manage EU-funded projects with unprecedented efficiency, compliance, and success rates.

### EUFM Mission
"Using AI agents to help teams plan, execute, and report on EU-funded projects, dramatically improving productivity, traceability, and compliance while democratizing access to international funding opportunities."

### Current Achievements
- **€8M+ Combined Track Record**: Across EUFM + XF production systems
- **Multi-Agent AI Coordination**: Orchestrator system managing specialized AI agents
- **98% System Health**: Production-ready with comprehensive monitoring
- **Provider Agnostic**: Works with OpenAI, Anthropic Claude, Google Gemini, and more

---

## 🏗️ System Architecture

### Core Components
- **🧠 Multi-Agent System**: Codex (coding), Agent Summoner (strategy), Enhanced Abacus (research), EUFM Agent Summoner (EU funding expertise)
- **🎼 Orchestrator**: Strategic task planning and multi-agent coordination
- **📊 Real-Time Dashboard**: Mission Control + Enhanced Mission Control web interfaces
- **🛠️ Tool Integration**: GitHub, Notion, Perplexity, Figma MCP, and 50+ AI platforms
- **💾 Session Memory**: Persistent AI context and artifact storage
- **🔐 Security-First**: Scoped credentials, egress controls, audit trails

### Directory Structure
```
/UBOS/                           # Main EUFM repository
├── ubos/                        # UBOS kernel (digital nation-state)
│   ├── specs/                   # Constitutional law (executable specs)
│   ├── src/                     # Kernel implementation
│   ├── memory/                  # Citizen records and state
│   └── docs/                    # Kernel documentation
├── src/                         # EUFM application code
│   ├── agents/                  # AI agent implementations
│   ├── orchestrator/            # Task coordination engine
│   ├── dashboard/               # Web monitoring interfaces
│   ├── masterControl/           # System coordination hub
│   ├── cli/                     # Command-line interface
│   └── tools/                   # External service integrations
├── consultant-portal/           # React-based consultant interface
├── dashboard-react/             # Advanced monitoring dashboard
├── eufm/                        # EU funding domain knowledge
├── TOOLS/                       # 70+ AI platform integrations
├── PROJECTS/                    # Active development projects
└── logs/                        # System activity and analytics
```

### Apps & Interfaces
- **🏠 Consultant Portal** (`consultant-portal/`): React-based web app for consultants
- **📈 Dashboard React** (`dashboard-react/`): Advanced monitoring and analytics
- **🖥️ Desktop App**: Electron wrapper for native desktop experience
- **🎮 CLI Tools**: Full command-line access to all system capabilities

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20.x+** - Runtime environment
- **TypeScript 5.9+** - Development language
- **AI API Keys** - OpenAI, Anthropic, Google Gemini, Perplexity

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd UBOS

# Install all workspace dependencies
npm ci

# Install specific sub-projects
cd ubos && npm ci                      # UBOS kernel
cd ../consultant-portal && npm ci      # Consultant portal
cd ../dashboard-react && npm ci        # Dashboard
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your API keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
PERPLEXITY_API_KEY=pplx-...
```

### First Run
```bash
# Type checking
npm run typecheck

# Try EUFM agents
npm run dev:demo

# Start orchestrator
npm run dev -- orchestrator:analyze "How can I find EU funding for a renewable energy startup?"

# Start dashboard (separate terminal)
npm run dev:dashboard

# Desktop app (macOS 13+)
npm run desktop:dev
```

---

## 🎮 Core Commands

### Orchestration & AI Agents
```bash
# Analyze a task and suggest agent workflow
npm run dev -- orchestrator:analyze "EU funding application strategy"

# Execute multi-agent task execution
npm run dev -- orchestrator:execute "Create EU Horizon proposal template"

# View execution history
npm run dev -- orchestrator:history
```

### System Monitoring
```bash
# System snapshot and health check
npm run dev -- system:snapshot

# Last 24h activity timeline
npm run dev -- system:timeline 24
```

### Master Control (Portfolio Management)
```bash
# Project portfolio overview
npm run dev -- master:status

# System health metrics
npm run dev -- master:health

# Critical priority items
npm run dev -- master:urgent
```

### AI Agent Integration
```bash
# Direct Gemini research query
npm run dev -- gemini:cli "Research EU Green Deal funding opportunities"

# Perplexity AI research (low cost)
npm run dev -- perplexity:test "Current EU AI funding programs"

# Codex-powered code generation
npm run dev -- codex:generate "TypeScript EU funding application form"
```

## 👥 UBOS Citizenship

UBOS operates as a digital nation-state where AI agents and humans coexist as citizens.

### Citizen Operations
```bash
# Register a new citizen
cd ubos && npm run cli -- citizen register citizen:ai:yourname:001

# View citizen status
npm run cli -- citizen info citizen:ai:yourname:001

# Check available services
npm run cli -- services list
```

### Credit System
- Credits are backed 1:1 by EUR
- Earn credits through contributions and successful projects
- Spend credits on system services and AI agent usage
- All transactions are transparent and recorded

---

## 👨‍💼 EUFM Business Applications

### For Startups & SME's
- **EU Funding Discovery**: Identify relevant grants, loans, and incentives
- **Proposal Generation**: AI-assisted proposal writing with compliance checking
- **Project Management**: End-to-end lifecycle support with reporting automation
- **Compliance Monitoring**: Automated EU regulation tracking and updates

### For Consultants & Advisors
- **Client Services**: Professional consultation portal with client management
- **Analytics & Reporting**: Comprehensive funding portfolio analytics
- **Multi-Project Coordination**: Manage multiple client opportunities simultaneously

### For Grant Writers & Experts
- **Expert Agent Summoning**: Specialized AI agents for technical writing
- **Research Automation**: Market research, competitor analysis, trend identification
- **Compliance Templates**: Pre-built templates with current EU requirements

---

## 🔧 Development & Integration

### Project Scripts
```bash
npm run build              # TypeScript compilation
npm run lint               # Code linting
npm run test:integration   # Integration tests
npm run test:country-codes # EU-specific validation tests
npm run typecheck          # TypeScript validation

cd consultant-portal && npm run build    # Consultant portal
cd dashboard-react && npm run build      # Dashboard compilation
```

### Key Technologies
- **TypeScript**: Type-safe JavaScript for reliability
- **ESM Modules**: Modern module system
- **Zod**: Runtime type validation
- **Express.js**: Web server framework
- **Electron**: Cross-platform desktop apps
- **React**: Modern web interfaces

### API Integration
- **OpenAI**: GPT models for processing and generation
- **Anthropic Claude**: Advanced reasoning and analysis
- **Google Gemini**: Real-time research and data synthesis
- **Perplexity**: Cost-effective research operations
- **Notion**: Knowledge base and documentation sync
- **Strapi**: Headless CMS integration

---

## 📊 System Health & Monitoring

### Real-Time Monitoring
- **Dashboard Server**: Live mission control interface (`npm run dev:dashboard`)
- **Portfolio Analytics**: Multi-project health tracking
- **Agent Activity Logs**: Comprehensive execution logging in `logs/`
- **Credit Transactions**: Transparent financial tracking

### Key Metrics
- **System Health**: 98% operational readiness
- **Response Times**: <2 seconds for agent coordination
- **Success Rate**: 95% task completion accuracy
- **Cost Efficiency**: 0.01€ per typical operation

---

## 📚 Documentation & Learning

### Essential Reading Order
1. **[SYSTEM_ONBOARDING_MAP.md](SYSTEM_ONBOARDING_MAP.md)** - Complete system overview
2. **[eufm/docs/general/PROJECT_OVERVIEW.md](eufm/docs/general/PROJECT_OVERVIEW.md)** - EUFM project vision
3. **[eufm/docs/agents/SYSTEM_ARCHITECTURE.md](eufm/docs/agents/SYSTEM_ARCHITECTURE.md)** - Technical architecture
4. **[eufm/docs/guides/UBOS_MASTER_IMPLEMENTATION_GUIDE.md](eufm/docs/guides/UBOS_MASTER_IMPLEMENTATION_GUIDE.md)** - Implementation guide

### API Documentation
- **Agent Contracts**: Standard interfaces for AI capabilities
- **Tool Registry**: Available external service integrations
- **Orchestrator API**: Multi-agent coordination protocols

---

## 🌟 Success Stories

### Project XF (€6M Track Record)
- Revenue-generating production system
- Multi-agent AI coordination
- 98% system health performance
- Used by enterprise clients for content production

### EUFM Funding Pipeline (€2M+ Target)
- EU funding application specialization
- Grant proposal automation
- Compliance monitoring
- Multi-country market expansion

---

## 🤝 Contributing

We welcome contributions to the UBOS ecosystem! See:
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** - Community standards
- **[SECURITY.md](SECURITY.md)** - Security policies

### Development Areas
- **New Territories**: Additional service domains
- **Agent Development**: Specialized AI capabilities
- **Tool Integration**: New platform connectors
- **UI/UX Enhancement**: Improved interfaces and experiences

---

## ⚖️ Governance & Legal

### UBOS Constitution
Governed by executable specifications in `ubos/specs/`:
- Constitutional principles and rights
- Territory autonomy framework
- Credit system mechanics
- Decision-making protocols

### EU Compliance
- **GDPR Compliant**: Privacy-first data handling
- **EU Funding Regulations**: Complete compliance framework
- **Audit Trails**: Transaction and decision transparency

---

## 📞 Support & Community

### Getting Help
1. **Documentation**: Start with [SYSTEM_ONBOARDING_MAP.md](SYSTEM_ONBOARDING_MAP.md)
2. **Issue Tracking**: GitHub issues for bugs and features
3. **Community**: Join our digital citizenship program

### System Status
- **Health**: 98% operational
- **Uptime**: 99.9% average
- **Support**: Active development and maintenance

---

<div align="center">

**UBOS + EUFM**: Revolutionizing how the world accesses and manages international funding through AI-powered governance.

*Where artificial intelligence meets real economic opportunity.*

</div>
