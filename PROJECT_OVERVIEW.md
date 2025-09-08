# EUFM — Project Overview

This document is the single source of truth for understanding EUFM. It consolidates details from README, docs/, and src/ into a concise, actionable overview.

## 1) Vision & Goals
- Purpose: Use AI agents to help teams plan, execute, and report on projects funded by the European Union (EU), improving productivity, traceability, and compliance.
- Principles: Modular, provider‑agnostic, secure‑by‑default, observable, future‑LLM ready, and simple to operate.
- Outcomes: Faster grant workflows, auditable decisions, consistent documentation, and safer integrations with common tools.
- Impact framing (funding‑aligned): Public‑benefit AI infrastructure supporting governance, cybersecurity, and delivery (see docs/funding_eu.md).

## 2) Current Status (What’s Working)
- TypeScript workspace with CLI entrypoint
  - Scripts: `npm run dev` (tsx), `npm run build` (tsc), `npm start` (dist), `npm run typecheck`, `npm run lint`.
  - Config: `tsconfig.json` (ESNext modules, strict), project is ESM (`"type": "module"`).
- Provider adapters (LLM Abstraction Layer)
  - OpenAI chat completions: `src/adapters/openai.ts` → `openaiComplete(...)`.
  - Google Gemini: `src/adapters/google_gemini.ts` → `geminiComplete(...)`.
  - Anthropic Claude: `src/adapters/anthropic.ts` → `anthropicComplete(...)`.
- Tool(s) and simple agent flows
  - Perplexity Sonar test tool: `src/tools/perplexity_sonar.ts` → `runPerplexityTest(...)`.
  - Gemini test wrapper: `src/tools/gemini_test.ts` → `runGeminiTest(...)`.
  - CLI commands in `src/cli/index.ts`:
    - `gemini:test "<prompt>"` — calls Gemini via adapter.
    - `perplexity:test "<prompt>"` — calls Perplexity Sonar test tool.
- Credentials & env
  - `.env.example` lists required keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`.
- Documentation set (docs/)
  - Architecture overview, adapter and tool interfaces, browser‑capable agent plan, tools index, EU funding notes.

What’s not yet built
- Orchestrator (planner/executor loop), tool registry with capability graph, memory/vector store, CI tests, and browser automation are designed but not implemented.

## 3) System Architecture (Components, Tools, Integrations)
Guiding doc: `docs/architecture.md`. Current code implements the early slice of these layers.

- LLM Abstraction Layer
  - Adapters expose completion‑style primitives to unify providers.
  - Implemented: OpenAI, Anthropic, Gemini. Planned: Perplexity via tool wrapper, batch/stream APIs.
- Tool Registry & Capability Graph
  - Design: tools are named, schema‑validated units with scoped permissions and standard results.
  - Current state: individual tools exist (Perplexity test), centralized registry not yet coded.
- Orchestrator (Planner/Executor)
  - Design: manages multi‑step plans, retries, guardrails, and tool calls.
  - Current state: not implemented; CLI directly invokes specific tests.
- Memory & Storage
  - Design: Markdown knowledge base; optional vector store.
  - Current state: documentation lives in `docs/`; no vector store in code yet.
- Connectors
  - Design: webhooks, schedulers, queues for automation.
  - Current state: not yet implemented.
- Agent UI/CLI
  - Current: Node/TS CLI (`src/cli/index.ts`) for local runs; future web console.
- Observability
  - Design: structured logs, traces, cost/time metrics.
  - Current: minimal console logging; `logs/` folder present but no structured logger.
- Security
  - Design: secrets manager, per‑tool scoped credentials, egress controls.
  - Current: env‑var keys only; no runtime policy enforcement yet.

Integrations inventory (docs/tools/*.md)
- Providers: OpenAI, Anthropic Claude, Google Gemini, Perplexity Sonar.
- Dev & knowledge tools: GitHub, Obsidian, Sonar, Codex IDE, Jules AI.
- Status: High‑level notes and links captured; programmatic integrations will arrive via adapters/tools.

## 4) Development Timeline / Roadmap
Short‑term (from docs/architecture.md)
- Sprint 1
  - Write docs (done), finalize adapter spec (done), tool registry skeleton (spec done), GitHub App design (doc‑level).
- Sprint 2
  - Implement core adapters (OpenAI/Anthropic/Gemini) (done), evaluator harness (pending), initial agent loop (pending).
  - CI: start with docs/link checks; add unit/integration tests as code lands (pending).

Next milestones (proposed)
- M1: Minimal Orchestrator
  - Message state machine, function/tool calling, retries and guardrails.
  - Central tool registry with Zod schemas; basic permissions model.
- M2: Observability & CI
  - Structured logging with request/trace IDs; prompt/response capture with redaction.
  - Lint/typecheck in CI; seed unit tests for adapters and tool contracts.
- M3: Memory & Context
  - Lightweight Markdown memory loader; optional vector search adapter.
  - Run summaries and decision logs for auditability.
- M4: Browser Agent (Fallback Path)
  - Playwright harness with domain/selector allowlists, screenshot trail, and action logs (per docs/agent_browser_access.md).
- M5: Integrations & Packaging
  - GitHub App first integration; add more tools from docs/tools.
  - Package CLI for easier installs; basic web console skeleton.

Indicative sequencing (high level)
1) Solidify interfaces (adapters/tools/registry)
2) Implement orchestrator and tests
3) Add observability and CI
4) Introduce memory and evaluation harness
5) Add browser agent and integrations

## 5) Agent Context Structure
Contracts (from docs/architecture.md and docs/integration_adapters.md)
- Provider adapter interface (conceptual)
  - `complete(prompt, options)` → `{ text, usage, warnings }`
  - `stream(prompt, options)` → async events (tokens, tool_calls, deltas)
  - `useTools(messages, tools, options)` → provider‑native tool calling where available
  - `batch(requests, options)` → bulk throughput
  - Common options: `model`, `temperature`/`top_p`, `max_output_tokens`, `system`, `stop`, `json_schema`.
- Tool interface
  - `name` (unique), `schema` (JSON/Zod), `invoke(context, input)` → `{ ok, data | error }`, `permissions` (scopes).
- Message format
  - Roles: `system`, `user`, `assistant`, and tool messages (`tool`, `tool_result`).
  - Minimal chat shape as used today:
    - OpenAI/Perplexity: `{ messages: [{ role, content }, ...] }` with optional JSON mode.
    - Anthropic: `{ messages: [{ role: 'user', content }] }` in Messages API.
    - Gemini: `{ contents: [{ parts: [{ text }] }] }`.

Runtime context and secrets
- Environment variables (required)
  - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY` (see `.env.example`).
- Execution context (planned)
  - `runId`, `traceId`, `capabilities` (tool allowlist), `secrets` (scoped), `memory` (retrieved docs), and `policies` (egress/domain allowlists).

Example CLI flows (current)
- Gemini test
  - `npm run dev -- gemini:test "Say hello from EUFM."`
  - Calls `runGeminiTest(prompt)` → `geminiComplete(prompt, model)`.
- Perplexity Sonar test
  - `npm run dev -- perplexity:test "Say hello from EUFM."`
  - Calls `runPerplexityTest(prompt)` with a simple system+user message.

## Repository Map (Key Files)
- README: project one‑liner and purpose — `README.md`.
- **LATEST SYSTEM CAPABILITIES**: Complete implementation reference — `SYSTEM_LATEST_IMPLEMENTATIONS.md`.
- **AGENT QUICK REFERENCE**: Essential commands and capabilities — `AGENT_QUICK_REFERENCE.md`.
- Docs index and architecture — `docs/README.md`, `docs/architecture.md`.
- **Claude session memory**: Context preservation — `docs/CLAUDE_SESSION_MEMORY.md`.
- Adapter contracts and tool specs — `docs/integration_adapters.md`.
- Browser agent design — `docs/agent_browser_access.md`.
- EU funding framing — `docs/funding_eu.md`.
- CLI and runtime code — `src/cli/index.ts`, `src/adapters/*`, `src/tools/*`.
- **Enhanced agent implementations** — `src/agents/`, `src/tools/`.
- Project config — `package.json`, `tsconfig.json`, `.env.example`.

## Working Agreements
- Keep this file authoritative; update it when interfaces or behavior change.
- Prefer small, typed interfaces and explicit schemas for tools.
- Start with simple, testable slices; add complexity only when needed.

