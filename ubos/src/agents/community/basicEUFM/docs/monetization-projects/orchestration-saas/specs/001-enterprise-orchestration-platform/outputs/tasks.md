# Enterprise Orchestration Platform — Development Tickets

Project: EUFM (European Union Funds Manager) — AI Agent Orchestration System
Scope: Break down into actionable tickets by epic, aligned to spec and generated outputs

References
- Spec: ../spec.md
- OpenAPI: ./openapi.yaml
- Database schema: ./database-schema.sql
- Implementation roadmap: ./implementation-roadmap.md
- Deployment strategy: ./deployment-strategy.md

---

## Epic: API Gateway

Ticket: API-001 — Bootstrap API service and routing
- Description: Scaffold a TypeScript/Node.js API service (Express/Fastify) that serves `/v1` routes, loads env config, and exposes health/readiness probes. Wire structured logging (pino) and OpenTelemetry traces.
- Acceptance Criteria:
  - `GET /healthz` returns 200 with build info
  - Request/response logging with correlation IDs
  - OTEL trace/span export behind env flag
  - CI runs build, lint, and starts server in test mode
- Dependencies: None
- Estimate: 2d | Priority: P0
- Links: spec.md (Core Platform), implementation-roadmap (Phase 0)

Ticket: API-002 — Multi-tenant headers and auth middlewares
- Description: Implement header extraction for `X-Tenant-Id`, optional `X-Env-Id`, API key verification (`X-API-Key`), and OAuth2 (OIDC) bearer validation stubs. Normalize auth context into `req.ctx` for downstream.
- Acceptance Criteria:
  - Requests without `X-Tenant-Id` rejected 400 (for tenant-scoped endpoints)
  - API keys validated (prefix + hash) against DB
  - OIDC bearer verified (JWKS cached) — library integration and config
  - Unit tests for positive/negative paths
- Dependencies: API-001, DB-setup
- Estimate: 3d | Priority: P0
- Links: openapi.yaml (securitySchemes, parameters), database-schema.sql (api_keys)

Ticket: API-003 — Implement `/v1/orchestrate` endpoint (sync/async)
- Description: Implement `POST /v1/orchestrate` per OpenAPI with sync (200) and async (202) modes. Validate request schema, enqueue async tasks, return standardized response.
- Acceptance Criteria:
  - JSON schema validation for `OrchestrateRequest`
  - Returns 200 with output for sync; 202 with `requestId` for async
  - Audit event emitted with tenant, model, cost placeholders
  - Unit tests mocking orchestration engine
- Dependencies: API-002, ORCH-001
- Estimate: 3d | Priority: P0
- Links: openapi.yaml (/v1/orchestrate), spec (Unified AI Orchestration)

Ticket: API-004 — Tasks endpoints (`/v1/tasks`, `/v1/tasks/{id}`)
- Description: Implement task creation (long-running) and status retrieval. Persist tasks and executions following schema.
- Acceptance Criteria:
  - `POST /v1/tasks` returns 202 with Task record
  - `GET /v1/tasks/{id}` returns task with status transitions
  - RBAC checks applied
- Dependencies: API-002, ORCH-001, DB-setup
- Estimate: 2d | Priority: P1
- Links: openapi.yaml (Tasks), database-schema.sql (tasks, task_executions)

Ticket: API-005 — Events and metrics endpoints
- Description: Implement SSE endpoint `/v1/events` and `/v1/metrics/usage` proxy/aggregation. Multitenant auth on stream.
- Acceptance Criteria:
  - SSE delivers task/request/alert events
  - Usage aggregation query w/ `from`, `to`, `unit`
  - Backpressure and idle timeouts handled
- Dependencies: ORCH-003 (event bus), MON-002
- Estimate: 3d | Priority: P1
- Links: openapi.yaml (events, metrics)

Ticket: API-006 — API Keys CRUD
- Description: Implement `POST /v1/api-keys`, `GET /v1/api-keys`, `DELETE /v1/api-keys/{id}` with prefix+hash storage.
- Acceptance Criteria:
  - Keys generated with prefix, one-time reveal
  - Hash stored, last_used_at updated by middleware
  - Audit logs for create/revoke
- Dependencies: API-002, SEC-003
- Estimate: 2d | Priority: P1
- Links: openapi.yaml (api-keys), database-schema.sql (api_keys)

---

## Epic: Multi-Provider Adapters

Ticket: ADPT-001 — Define provider adapter interface and SDK
- Description: Create TypeScript interface for providers (send, stream, cost calc, rate limit hints). Include request/response normalization and error taxonomy.
- Acceptance Criteria:
  - Interface published in `@eufm/providers`
  - Normalized response type for chat/completions/embeddings
  - Error classes: Retryable, RateLimited, AuthError, ValidationError
- Dependencies: API-003 (types), ORCH-002 (router needs interface)
- Estimate: 2d | Priority: P0
- Links: spec (AI Provider Integration)

Ticket: ADPT-002 — OpenAI adapter
- Description: Implement OpenAI adapter supporting chat, completions, embeddings with streaming, retries, and cost estimation.
- Acceptance Criteria:
  - Parity tests with mock API
  - Config via provider_accounts credentials
  - Rate limit backoff with jitter
- Dependencies: ADPT-001, DB-setup
- Estimate: 3d | Priority: P0

Ticket: ADPT-003 — Anthropic adapter
- Description: Implement Claude adapter with message/stream support and token accounting.
- Acceptance Criteria:
  - Same interface compliance as ADPT-001
  - Integration tests with sandbox keys
- Dependencies: ADPT-001
- Estimate: 3d | Priority: P1

Ticket: ADPT-004 — Google (Gemini) adapter
- Description: Implement Gemini adapter for text/chat and embeddings.
- Acceptance Criteria:
  - Interface compliance, streaming, error taxonomy
  - Region-aware endpoints (for residency)
- Dependencies: ADPT-001
- Estimate: 3d | Priority: P1

Ticket: ADPT-005 — Perplexity adapter
- Description: Implement Perplexity chat/search adapter with normalized output.
- Acceptance Criteria:
  - Interface compliance; cost estimation
- Dependencies: ADPT-001
- Estimate: 2d | Priority: P2

Ticket: ADPT-006 — Provider account management APIs
- Description: Implement `/v1/providers` list/add using encrypted credentials and KMS envelope encryption.
- Acceptance Criteria:
  - Credentials encrypted at rest; structured audit events
  - RBAC-scoped access
- Dependencies: API-002, SEC-002
- Estimate: 2d | Priority: P1
- Links: openapi.yaml (/v1/providers), database-schema.sql (provider_accounts)

---

## Epic: Workflow Engine

Ticket: ORCH-001 — Task queue and worker runtime
- Description: Introduce queue (NATS/Kafka) abstraction, task persistence, retry/backoff policies, idempotency keys.
- Acceptance Criteria:
  - Enqueue/consume tasks; visibility timeout; DLQ
  - Configurable retry/backoff, idempotent replays
  - Tracing context propagated across worker boundaries
- Dependencies: API-001, DB-setup
- Estimate: 4d | Priority: P0

Ticket: ORCH-002 — Routing engine and policy evaluation
- Description: Implement routing engine that selects provider/model by policy (cost/latency/SLA), provider health, and tenant limits.
- Acceptance Criteria:
  - JSON policy format stored in `routing_policies`
  - Unit tests with weighted selection and failover
  - Telemetry on routing decisions
- Dependencies: ORCH-001, ADPT-001..004
- Estimate: 4d | Priority: P0
- Links: database-schema.sql (routing_policies)

Ticket: ORCH-003 — Event bus and lifecycle events
- Description: Publish request/task/audit events to internal bus and expose to SSE/WS gateway.
- Acceptance Criteria:
  - Events: task.created, task.updated, request.started, request.completed, alert.fired
  - Tenancy metadata on all events
- Dependencies: ORCH-001, API-005
- Estimate: 3d | Priority: P1

Ticket: ORCH-004 — Workflow definitions (JSON DAG) and executor
- Description: Define JSON schema for workflows (steps, branches, conditions, compensation) and implement executor that coordinates tasks.
- Acceptance Criteria:
  - Versioned `workflows` table entries and validation
  - Executor supports branching and on-failure compensation
  - Tests covering simple and branched flows
- Dependencies: ORCH-001, ORCH-002
- Estimate: 5d | Priority: P1
- Links: database-schema.sql (workflows)

---

## Epic: Billing System

Ticket: BILL-001 — Usage metering pipeline
- Description: Persist `requests` with tokens, latency, and cost; roll up into `usage_aggregates` by time window.
- Acceptance Criteria:
  - Request persistence from adapters with token counts
  - Aggregation job writes hourly/daily usage
  - Indexes support common queries
- Dependencies: ORCH-001, ADPT-001..004, DB-setup
- Estimate: 3d | Priority: P0
- Links: database-schema.sql (requests, usage_aggregates)

Ticket: BILL-002 — Plan quotas and rate limiting
- Description: Enforce subscription plan quotas and runtime rate limits per tenant/environment.
- Acceptance Criteria:
  - Middleware checks quota before enqueue
  - Rate limit store (Redis) w/ strategies (fixed/sliding)
  - Unit tests hit limits and recover after window
- Dependencies: BILL-001, SEC-003, API-002
- Estimate: 3d | Priority: P1
- Links: database-schema.sql (rate_limits, subscriptions)

Ticket: BILL-003 — Stripe integration (customers, subscriptions, invoices)
- Description: Sync tenants to Stripe, handle webhooks, and reconcile invoices with usage.
- Acceptance Criteria:
  - Customer create/update; subscription create/cancel
  - Webhook handlers for invoice/payment events (signed)
  - Reconciliation job validates invoice totals vs usage
- Dependencies: BILL-001, BILL-002
- Estimate: 4d | Priority: P2
- Links: database-schema.sql (billing_customers, subscriptions)

Ticket: BILL-004 — Budget alerts and spend controls
- Description: Allow admins to set budgets and thresholds that trigger alerts and optional request blocking.
- Acceptance Criteria:
  - Budget config per tenant
  - Alerts via email/slack/webhook when thresholds exceeded
  - Optional hard-stop on budget exceed
- Dependencies: MON-003, BILL-001
- Estimate: 2d | Priority: P2

---

## Epic: Monitoring Dashboard

Ticket: MON-001 — Event gateway (SSE/WebSocket) service
- Description: Stand up a dedicated gateway for real-time event streams with tenant-aware auth and fan-out from event bus.
- Acceptance Criteria:
  - `/v1/events` SSE stable under backpressure
  - WS endpoint at `wss://events.*` supports subscribe/unsubscribe
- Dependencies: ORCH-003, API-001
- Estimate: 3d | Priority: P1
- Links: openapi.yaml (/v1/events)

Ticket: MON-002 — Metrics aggregation and query API
- Description: Implement metrics jobs and read API for usage, latency, error rates; optional TimescaleDB hypertables.
- Acceptance Criteria:
  - Jobs populate `usage_aggregates`
  - `GET /v1/metrics/usage` returns aggregated views
- Dependencies: BILL-001, API-005
- Estimate: 3d | Priority: P1

Ticket: MON-003 — Alerting and webhook delivery
- Description: Implement alert definitions, evaluation engine, and webhook delivery with retries and signatures.
- Acceptance Criteria:
  - Alerts stored and evaluated on schedule and stream processors
  - Webhook deliveries tracked with retry/backoff
- Dependencies: MON-002
- Estimate: 3d | Priority: P2
- Links: database-schema.sql (alerts, webhook_deliveries)

Ticket: MON-004 — Dashboard UI (initial)
- Description: Add dashboard screens for tasks table, live events, usage charts, and alert config in the web app.
- Acceptance Criteria:
  - Live task list w/ status filters
  - Usage charts by provider and time
  - Alert rule CRUD
- Dependencies: MON-001, MON-002, MON-003
- Estimate: 5d | Priority: P2

---

## Epic: Enterprise Security Features

Ticket: SEC-001 — SSO (OIDC) auth service integration
- Description: Integrate OIDC authorization code flow with PKCE; support login, logout, and session management.
- Acceptance Criteria:
  - OIDC config via env; JWKS rotation and caching
  - User and identity records created/linked on first login
  - Unit tests for token validation and session creation
- Dependencies: API-001, DB-setup
- Estimate: 3d | Priority: P0
- Links: openapi.yaml (OAuth2), database-schema.sql (users, identities)

Ticket: SEC-002 — Secrets and KMS envelope encryption
- Description: Introduce KMS client abstraction and envelope encryption for provider credentials and secrets.
- Acceptance Criteria:
  - Encrypt/decrypt paths audited; key rotation procedure documented
  - Secrets API limited to admins; no plaintext at rest
- Dependencies: SEC-001
- Estimate: 3d | Priority: P0
- Links: database-schema.sql (secrets)

Ticket: SEC-003 — RBAC and permission enforcement
- Description: Implement roles, permissions, and enforcement middleware for API routes and UI components.
- Acceptance Criteria:
  - Permissions seeded; role templates per plan
  - Route guards enforce RBAC for all security-sensitive endpoints
  - Tests cover deny/allow matrix
- Dependencies: SEC-001, API-002
- Estimate: 4d | Priority: P0
- Links: database-schema.sql (roles, permissions, user_roles)

Ticket: SEC-004 — Audit logging (tamper-evident) and SIEM export
- Description: Implement structured audit logs with optional signing/hashing and SIEM export (e.g., Splunk/Datadog) via HTTPS.
- Acceptance Criteria:
  - Audit events on auth, config changes, API keys, provider creds
  - Export pipeline with backpressure and retries
- Dependencies: API-002, SEC-003
- Estimate: 3d | Priority: P1
- Links: database-schema.sql (audit_logs)

Ticket: SEC-005 — Data residency and regional routing controls
- Description: Enforce data residency policies in request handling and provider selection (EU/US), including storage policies.
- Acceptance Criteria:
  - Residency policy checked on every request
  - Router obeys regional constraints in model selection
- Dependencies: ORCH-002, ADPT-004
- Estimate: 3d | Priority: P2
- Links: database-schema.sql (data_residency_policies)

---

## Shared/Infrastructure

Ticket: DB-setup — Initialize database and migrations
- Description: Create migrations from `database-schema.sql`, set up migration tooling (Prisma/Knex/Drizzle), seed baseline roles/permissions.
- Acceptance Criteria:
  - Migrations run in dev and staging; rollback works
  - Seeds for plans, roles, permissions
- Dependencies: None
- Estimate: 2d | Priority: P0

Ticket: OBS-001 — Observability scaffolding
- Description: Integrate OpenTelemetry traces/metrics/logs; pino structured logging; context propagation.
- Acceptance Criteria:
  - Traces exported locally (OTLP) with service names
  - Error logs enriched with tenant, requestId, user id
- Dependencies: API-001
- Estimate: 2d | Priority: P1

Ticket: DEP-001 — Containerization and deployment baselines
- Description: Dockerfiles, Kubernetes manifests/Helm, environment config, and secret management per deployment-strategy.
- Acceptance Criteria:
  - Images build; manifests deploy to staging
  - Readiness/liveness checks green; HPA configured
- Dependencies: API-001, DB-setup
- Estimate: 3d | Priority: P1
- Links: deployment-strategy.md

---

## Cross-Epic Testing and Quality Gates

Ticket: QLT-001 — Contract tests against OpenAPI
- Description: Generate request/response validators from `openapi.yaml` and integrate into CI to assert route conformance.
- Acceptance Criteria:
  - CI step fails on contract breaking changes
  - Mock tests for key endpoints (`/v1/orchestrate`, `/v1/tasks`, `/v1/events`)
- Dependencies: API-001..005
- Estimate: 2d | Priority: P1

Ticket: QLT-002 — Performance and resiliency tests
- Description: Add k6 or Artillery scenarios for orchestrate throughput, provider failover, and backpressure on SSE.
- Acceptance Criteria:
  - Report p95 latency and error rates
  - Simulate provider failures; verify failover
- Dependencies: ORCH-001..003, MON-001
- Estimate: 3d | Priority: P2

