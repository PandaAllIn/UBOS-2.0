#!/usr/bin/env md

# UBOS + EUFM Master Onboarding & System Map

This document bootstraps any new agent, tool, or collaborator with a fast, complete understanding of the system: architecture, projects, directories, specs, agents, workflows, commands, and key docs. Use this as the starting point in any new session.

## TL;DR Quickstart

- Clone and install:
  - Node 20.x; run `npm ci` at repo root.
  - For UBOS subproject: `cd ubos && npm ci`.
  - For Consultant Portal: `cd consultant-portal && npm ci`.
- Common commands (repo root):
  - Typecheck: `npm run -s typecheck`
  - EUFM tests: `npm run -s test:country-codes && npm run -s test:integration`
  - UBOS tests: `cd ubos && npm -s test`
  - Consultant Portal build: `cd consultant-portal && npm run -s build`
- Orchestration CLI: `npm run -s dev -- orchestrator:analyze "<task>"` then `orchestrator:execute`.
- Dashboard (local): `npm run -s dev:dashboard` (see `src/dashboard/dashboardServer.ts`).
- Notion sync (if configured): `npm run -s dev -- notion:sync-all` (see commands list below).

## High-Level Architecture

- UBOS (Universal Base Operating System): A spec-driven “digital nation-state” kernel.
  - Governance as executable specifications (constitution, territories, services).
  - Spec Interpreter converts Markdown specs + metadata into runtime behavior.
  - Session/memory primitives for persistence and provenance.
- EUFM (European Union Funding Management): A territory/business layer on UBOS.
  - Portfolio of projects (XF, GeoDataCenter, Portal Oradea, Monetization Projects).
  - Agents, orchestration, research, and operational guides.
- SessionBridge & Memory: Persist AI context, actions, and artifacts in `logs/` and memory repo constructs.

## Project Portfolio

- UBOS (Prime)
  - Specs: `ubos/specs/` (kernel, constitution, territories)
  - Source: `ubos/src/`
  - Docs: `ubos/docs/`
- EUFM (Program)
  - Core docs: `eufm/docs/core/`
  - Guides: `eufm/docs/guides/`
  - Agents docs: `eufm/docs/agents/`
  - Subprojects:
    - XF: `eufm/docs/xf/`
    - GeoDataCenter: `eufm/docs/geodatacenter/` (legacy path symlinked from `PROJECTS/GeoDataCenter/Claude Geo.md`)
    - Portal Oradea: `eufm/docs/portal-oradea/`
    - Monetization: `eufm/docs/monetization-projects/` (specs/templates)
- Consultant Portal app: `consultant-portal/`

## Directory Map (Key Paths)

- Root CLI + scripts
  - `package.json` — scripts, typecheck, tests
  - `src/cli/index.ts` — CLI commands (Notion sync, analytics, orchestrator, memory)
  - `src/orchestrator/` — planner/executor, `agentFactory.ts`, `types.ts`
  - `src/agents/` — runtime agents (coding, research, summoning, etc.)
  - `src/tools/` — helpers (Codex CLI, Gemini CLI, research adapters, tri-chat UI)
  - `src/dashboard/` — Mission Control + Enhanced Mission Control + web
  - `src/masterControl/` — project registry, agent action logger
  - `src/utils/paths.ts` — `repoRoot()`/`repoPath()` helpers (no absolute paths)
- UBOS Kernel
  - `ubos/specs/kernel/constitution.spec.md` — kernel constitution
  - `ubos/specs/territories/*.spec.md` — territory specs
  - `ubos/src/kernel/spec-interpreter.ts` — spec interpreter
  - `ubos/src/kernel/kernel.ts` — kernel boot sequence
- EUFM Docs (Core Reading)
  - `eufm/docs/agents/SYSTEM_ARCHITECTURE.md`
  - `eufm/docs/guides/UBOS_MASTER_IMPLEMENTATION_GUIDE.md`
  - `eufm/docs/core/EUFM_TECHNICAL_ARCHITECTURE_EU_FUNDING.md`
  - `eufm/docs/agents/AGENT_QUICK_REFERENCE.md`

## Agents & Orchestration

- Agent types (selected):
  - Coding: `CodexAgent`, `CodexCLIAgent`
  - Review/Assist: `JulesAgent`
  - Research: `EnhancedAbacusAgent`
  - Meta: `AgentSummoner`, `EUFMAgentSummoner`
  - Utility: `BrowserAgent`, `MemoryAgent`, `EUFundingProposalAgent`, `FigmaMCPAgent`, `SpecKitCodexAgent`, `TestAgent`, `SmokeTestAgent`
- Where agents are wired:
  - `src/orchestrator/agentFactory.ts` — maps `type` → agent class
  - `src/orchestrator/types.ts` — `AgentSpec`, `AgentResult`, `Capability` enums
- Memory & logging:
  - `src/masterControl/agentActionLogger.ts` — action logging to `logs/master_control`
  - `src/masterControl/projectRegistry.ts` — project metadata & automation

## Specs & Governance

- UBOS specs
  - `ubos/specs/kernel/constitution.spec.md` — core law
  - `ubos/specs/territories/*.spec.md` — territory/service catalogs
  - Interpreter: `ubos/src/kernel/spec-interpreter.ts`
- Implementation guidance
  - `eufm/docs/guides/UBOS_MASTER_IMPLEMENTATION_GUIDE.md`

## Workflows & Commands

- Development
  - Typecheck: `npm run -s typecheck`
  - EUFM tests: `npm run -s test:country-codes && npm run -s test:integration`
  - UBOS tests: `cd ubos && npm -s test`
  - Portal build: `cd consultant-portal && npm run -s build`
- Orchestrator
  - Analyze: `npm run -s dev -- orchestrator:analyze "<task>"`
  - Execute: `npm run -s dev -- orchestrator:execute "<task>"` (`DRY_RUN=true` optional)
  - History: `npm run -s dev -- orchestrator:history`
- Notion sync (if configured)
  - `npm run -s dev -- notion:sync-projects`
  - `npm run -s dev -- notion:sync-agents`
  - `npm run -s dev -- notion:sync-funding`
  - `npm run -s dev -- notion:daily-update`
  - `npm run -s dev -- notion:sync-all`
- Tools
  - Codex CLI wrapper: `src/tools/codexCLI.ts`
  - Gemini CLI: `npm run -s dev -- gemini:cli`
  - Research adapters: `src/tools/enhancedPerplexityResearch.ts`

## Environment & Secrets

- Configure `.env` using `.env.example` at repo root.
- Typical keys (as needed by agents/adapters): `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`.
- Usage toggles: e.g., `EUFM_TRACK_USAGE=true` (see `src/analytics/autoTracker.ts`).

## Observability & Data

- Logs & sessions: `logs/` (orchestrator runs, agent actions, research data, session memory)
- Project registry DB (JSON): `logs/master_control/project_registry.json`
- Research outputs: `logs/research_data/`

## Contribution & CI

- Repo meta
  - `CODE_OF_CONDUCT.md`
  - `CONTRIBUTING.md`
  - `SECURITY.md`
- CI: `.github/workflows/ci.yml` — typecheck, tests, builds on PR/push
- PR template & ownership
  - `.github/pull_request_template.md`
  - `.github/CODEOWNERS`

## Path Conventions

- Use repo-relative utilities: `src/utils/paths.ts` → `repoRoot()`, `repoPath(...)`.
- Avoid absolute local paths (e.g., `~/Desktop/...`).

## Suggested Reading Order (New Agent/Tool)

1) Architecture overview:
   - `eufm/docs/agents/SYSTEM_ARCHITECTURE.md`
   - `eufm/docs/guides/UBOS_MASTER_IMPLEMENTATION_GUIDE.md`
2) UBOS kernel & specs:
   - `ubos/specs/kernel/constitution.spec.md`
   - `ubos/src/kernel/spec-interpreter.ts`
3) Orchestration & agents:
   - `src/orchestrator/types.ts`
   - `src/orchestrator/agentFactory.ts`
   - `src/agents/` (skim types and capabilities)
4) EUFM program & subprojects:
   - `eufm/docs/core/` + `eufm/docs/guides/`
   - `eufm/docs/portal-oradea/` + `eufm/docs/geodatacenter/` + `eufm/docs/xf/`
5) Operations & dashboards:
   - `src/dashboard/missionControl.ts`
   - `src/masterControl/projectRegistry.ts`

## Minimal Context to Start Executing

- Run typecheck + tests to validate environment.
- Use `orchestrator:analyze` → `orchestrator:execute` for any scoped task.
- Log actions via `agentActionLogger` as part of agent runs.
- Persist context/outputs under `logs/` for continuity.

## Recommended Additions (Optional)

- “Capabilities Matrix” per agent: input/output contracts, cost profiles, provider dependencies.
- “Spec Change Playbook”: how to introduce/validate constitutional or territory amendments (schema diff, invariants, rollback).
- “Security Checklist”: sandboxing, input validation, secrets handling, and auditing steps for any new agent/tool.
- “Release Process”: cut, tag, and artifact publishing (with CI/CD hooks if needed).
- “Data Governance” brief: GDPR-first data handling by territory; retention windows; PII boundaries.

---
If you’re a tool/agent, the key to working smoothly here is: read specs → respect types/contracts → use repo-relative paths → log actions → keep context in `logs/` so the next session has continuity.

