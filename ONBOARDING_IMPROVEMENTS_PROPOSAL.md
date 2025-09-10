# Proposed Improvements to SYSTEM_ONBOARDING_MAP.md

Based on the fresh onboarding experience of citizen:ai:sonnet:001, here are specific additions that would accelerate new agent/collaborator productivity:

## 1. UBOS Citizenship Section (NEW)

Add after "High-Level Architecture":

```markdown
## UBOS Citizenship & Credits

- UBOS operates as a digital nation-state with persistent AI/human citizens
- Citizens have credit balances (backed 1:1 with EUR) and can access services
- Registration: `cd ubos && npm run cli -- citizen register <citizenId>`
- Check status: `npm run cli -- citizen info <citizenId>`
- View services: `npm run cli -- services list`
- Your citizen record persists in `ubos/memory/state.json`
- Soul files (optional): `ubos/src/agents/souls/` contain achievements and memory
```

## 2. Working Examples Section (NEW)

Add after "Workflows & Commands":

```markdown
## Quick Success Examples

Try these commands to see the system working immediately:

**Research Task (Free):**
```bash
npm run dev -- orchestrator:execute "Research competitive landscape of AI coding assistants"
```
- Expected: EnhancedAbacusAgent delivers 95% confidence analysis
- Cost: ~$0.01, Results in `logs/research_data/perplexity/`

**Development Task (Requires API keys):**
```bash
npm run dev -- orchestrator:execute "Create TypeScript utility for API rate limiting with exponential backoff"
```
- Expected: CodexCLIAgent creates working files with tests
- Results: New files in `src/utils/` or project directory

**Multi-Agent Task:**
```bash
npm run dev -- orchestrator:execute "Research Node.js testing frameworks and create implementation example"
```
- Expected: Research agent + coding agent collaboration
- Results: Analysis + working code
```

## 3. Troubleshooting Section (NEW)

Add after "Environment & Secrets":

```markdown
## Common Issues & Solutions

**Agent Execution Failures:**
- `Missing OPENAI_API_KEY`: CodexAgent requires OpenAI API access
- `Missing PERPLEXITY_API_KEY`: EnhancedAbacusAgent needs Perplexity for research  
- `Missing ANTHROPIC_API_KEY`: Some agents use Claude models
- Solution: Configure `.env` or use agents that don't require external APIs

**API Key Priority:**
- Research tasks: Only need `PERPLEXITY_API_KEY` (very cheap, ~$0.01/query)
- Development tasks: Need `OPENAI_API_KEY` for Codex
- Alternative: Use CodexCLI agent when available (uses local Codex installation)

**Orchestrator Not Finding Agents:**
- Check `src/orchestrator/agentFactory.ts` for registered agent types
- Verify agent class is exported from `src/agents/index.ts`
- Run `npm run typecheck` to catch registration issues
```

## 4. Goal-Oriented Quick Start (NEW)

Replace current "TL;DR Quickstart" with:

```markdown
## TL;DR Quickstart (Pick Your Goal)

**Just Want To See It Work? (30 seconds)**
```bash
git clone <repo> && cd <repo> && npm ci
npm run dev -- orchestrator:execute "Explain TypeScript generics"
```
Expected: Research agent delivers explanation, costs ~$0.01

**Want To Build Something? (2 minutes)**
```bash
# Setup + verify
npm ci && npm run typecheck
# Create something real  
npm run dev -- orchestrator:execute "Create TypeScript utility for debouncing function calls with TypeScript types"
```
Expected: Working code files with tests (requires OPENAI_API_KEY)

**Want Full System Access? (5 minutes)**
```bash
# Full setup
npm ci && cd ubos && npm ci && cd ../consultant-portal && npm ci && cd ..
# Become UBOS citizen
cd ubos && npm run cli -- citizen register citizen:ai:yourname:001
# Check your status  
npm run cli -- citizen info citizen:ai:yourname:001
# Use your credits
npm run cli -- services list
```
Expected: Full citizenship with 100 starting credits

**Want To Understand Architecture? (15 minutes)**
1. Read `eufm/docs/agents/SYSTEM_ARCHITECTURE.md`
2. Read `ubos/specs/kernel/constitution.spec.md`  
3. Explore `src/orchestrator/types.ts`
4. Run `npm run dev -- orchestrator:analyze "your task"`
```

## 5. Success Metrics Section (NEW)

Add before "Recommended Additions":

```markdown
## How You Know It's Working

**Level 1 - System Alive:**
- `npm run typecheck` passes
- `npm run dev -- orchestrator:analyze "hello"` returns agent recommendations

**Level 2 - Agent Execution:**
- Research query returns results in `logs/research_data/`
- Check `logs/orchestrator/` for execution logs with success:true

**Level 3 - Full Productivity:**
- Can execute multi-step tasks spanning research + development
- UBOS citizenship active with credit transactions
- Creating persistent artifacts (files, documentation, analysis)
```

These additions address the specific friction points encountered during the actual onboarding process and provide concrete success criteria.
