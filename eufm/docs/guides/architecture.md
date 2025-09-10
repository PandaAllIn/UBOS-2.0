# Architecture Overview

Goals: modular, provider-agnostic, future-LLM ready, observable, secure-by-default.

## High-level components
- LLM Abstraction Layer (providers: OpenAI, Anthropic, Google, Perplexity)
- Tool Registry & Capability Graph (GitHub, Abacus.AI, Sonar, etc.)
- Orchestrator (planner/executor, retries, guardrails)
- Memory & Storage (Markdown docs, vector store optional)
- Connectors (webhooks, schedulers, queues)
- Agent UI/CLI (Cursor, web console)

## Contracts
- Provider Adapter interface: `complete`, `stream`, `useTools`, `batch`
- Tool interface: `name`, `schema`, `invoke(context, input)`
- Message format: role-based with `tool` and `tool_result`

## Observability
- Structured logging, prompt/response traces, cost/time metrics

## Security
- Secret manager, per-tool scoped credentials, egress controls

## Roadmap (first 2 sprints)
- Sprint 1: docs, adapter spec, tool registry skeleton, GitHub App design
- Sprint 2: provider adapters (OpenAI/Anthropic/Gemini), evaluator harness, initial agent loop
- CI: start with docs/link checks; add unit/integration tests as code lands
