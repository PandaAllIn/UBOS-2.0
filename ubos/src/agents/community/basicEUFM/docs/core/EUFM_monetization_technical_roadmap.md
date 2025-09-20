# EUFM Monetization Technical Implementation Roadmap

Scope: EU consultant monetization MVP across Web app, Figma MCP integration, Stripe billing, and deployment. Project type: TypeScript/Node.js multi‑agent orchestration. Follow BaseAgent pattern and register in AgentFactory.

Owner: EUFM Core Engineering • Updated: 2025‑09‑08

---

## 0) Guiding Principles

- BaseAgent pattern: all new agents extend `BaseAgent` and register in `src/orchestrator/agentFactory.ts`.
- Safety/quality: strict TypeScript, narrow interfaces, input validation, try/catch on all async boundaries, structured logging.
- Performance: async pipelines, streaming where possible, lazy imports, files < 500 LoC, single‑responsibility functions.
- EU compliance: GDPR, PSD2/SCA, SEPA, VAT via Stripe Tax, audit logs for billing events.
- Phasing: deliver in small, testable slices; avoid big‑bang merges.

---

## Phase 1 — Web MVP (React + TypeScript)

Goal: Consultant workflow UI with document upload, AI analysis pipeline hooks, demo components (deadline validator, research agent), responsive layout.

Target repo area: `consultant-portal/` (Vite + React TS + Tailwind present)

### 1.1 UI Architecture & Routing

- Pages: `Upload`, `Analysis`, `Billing`, `Settings`, `Auth` (optional)
- State: lightweight global store (Zustand already present at `consultant-portal/src/store/useAppStore.ts`).
- Routing: React Router with code-splitting per route.
- Layout: responsive dashboard shell with left nav (Upload, Analysis, Research, Billing) + top bar (account/SaaS plan).

### 1.2 Document Upload Interface

- Component: `UploadArea` (drag-and-drop + file picker) supporting PDF/DOCX/CSV.
- Client constraints: max size (e.g., 20MB), file type whitelist.
- API: `POST /api/upload` → returns `jobId` and `documentId`.
- Storage (MVP): local `tmp/` or object store emulator; production: S3/GCS. Abstract via `src/tools/storageAdapter.ts`.
- Virus scan placeholder: basic MIME/type guard; roadmap hook for ClamAV or cloud AV.

### 1.3 AI Analysis Pipeline Integration (MVP contract)

- API: `POST /api/analysis/start` with `{ documentId, analyses: ["deadline", "research"] }` → returns `jobId`.
- API: `GET /api/analysis/:jobId` → returns status + partial results (stream-friendly model later).
- Agent orchestration: server handler invokes `src/orchestrator/agentFactory.ts` to get appropriate agents.
- Types: `AnalysisJob`, `AnalysisResult`, `DeadlineValidation`, `ResearchSummary` in `src/types/analysis.ts`.
- Minimal queue: in-memory job map for MVP; optional BullMQ + Redis later.

### 1.4 Demo Components

- Deadline Validator: `DeadlineCard` showing program, due date, days remaining, risk flags. Backed by `DeadlineValidatorAgent`.
- Research Agent: `ResearchPanel` with query input, related calls, sources; backed by `EnhancedAbacusAgent` (or `ResearchAgent`).
- Loading/streaming UX: skeletons + progressive hydration of panels as results land.

### 1.5 Error Handling & Telemetry

- Client: toast + inline error banners; retry on transient 5xx.
- Server: try/catch all handlers; map to 4xx/5xx; structured logs with requestId.
- Observability: simple request logging to `logs/` (existing) + `console` in dev; hook for hosted logs later.

### 1.6 Security & Privacy

- Auth (MVP optional): email link or Clerk/Auth0; gate billing and analysis start behind auth if enabled.
- PII handling: don’t persist document content server logs; redact paths/ids.
- CORS: restrict to configured domain.

Deliverables

- Components: `UploadArea.tsx`, `DeadlineCard.tsx`, `ResearchPanel.tsx`, `AnalysisStatus.tsx`.
- API routes: `/api/upload`, `/api/analysis/start`, `/api/analysis/:jobId` (server runtime aligned with deployment provider).
- Types: `src/types/analysis.ts`.
- Agents: `src/agents/deadlineValidatorAgent.ts`, `src/agents/researchAgent.ts` (BaseAgent pattern) + registration in AgentFactory.

---

## Phase 2 — Figma MCP Integration

Goal: Design automation server and workflows to generate decks/templates, run bulk updates, and export to PPT/PDF.

### 2.1 MCP Server Setup

- Config: add MCP entry (Cursor/Figma Developer MCP).
- Example JSON (Cursor):
  ```json
  {
    "mcpServers": {
      "figma-developer-mcp": { "command": "npx", "args": ["-y", "figma-developer-mcp"] }
    }
  }
  ```
- Env: `FIGMA_PERSONAL_TOKEN`, `FIGMA_TEAM_ID`, optional `FIGMA_FILE_ID`.

### 2.2 Integration Agent

- New agent: `src/agents/figmaMCPAgent.ts` implementing BaseAgent.
- Capabilities:
  - Generate templates (JSON design spec → Figma frames/components).
  - Bulk update text styles, logos, colors via MCP actions.
  - Export frames/pages to PNG/PDF; feed into PPT pipeline.
- Inputs: `{ templateType: 'pitch'|'one-pager'|'infographic', data: Record<string,unknown>, bulk?: boolean }`.
- Outputs: `{ exportedUrls: string[], figmaNodeIds: string[] }`.

### 2.3 Template Generation Pipeline

- JSON templates stored in `templates/figma/*.json` (deck, infographic, UI kit).
- Mapping util: `src/tools/figmaTemplateMapper.ts` converts business data → Figma node creation/update ops.
- Validation: AJV schema for template JSON.

### 2.4 Bulk Update Workflows

- Batch operations: branding/color tokens, logo swaps, text placeholders.
- Use MCP batch endpoints when available; otherwise chunked sequential operations with backoff.

### 2.5 Export to PPT/PDF

- PDF: Figma export API (PDF) for frames/pages; store in object storage and return URL.
- PPTX: Build slides via `pptxgenjs` from exported PNGs + structured content; or HTML → PDF via headless Chromium for certain layouts.
- Serverless compatibility: use `@sparticuz/chromium` if headless needed on Vercel/Netlify.

Deliverables

- Agent: `figmaMCPAgent.ts` + registration.
- Templates: `templates/figma/*.json` + AJV schemas.
- Tools: `figmaTemplateMapper.ts`, `exportService.ts`.
- API: `/api/design/generate` and `/api/design/export`.

---

## Phase 3 — Stripe Payments

Goal: Subscriptions (€299/month), usage‑based add‑ons, EU tax compliance, SEPA/PSD2, customer portal.

### 3.1 Stripe Setup

- Env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_EUR_299`, `STRIPE_TAX_REGION`.
- Dashboard:
  - Product: EUFM Pro.
  - Price: recurring monthly €299 (`STRIPE_PRICE_EUR_299`).
  - Tax: enable Stripe Tax, automatic collection on `PaymentIntent`/`CheckoutSession`.
  - Payment methods: `card`, `sepa_debit`; SCA via Payment Intents.

### 3.2 Subscription Flow

- Client: "Upgrade" button → POST `/api/billing/checkout` returns checkout URL → redirect.
- Server: create `CheckoutSession` with mode `subscription`, `automatic_tax: {enabled: true}`, `payment_method_types: ['card','sepa_debit']`, EU locale.
- Success: redirect to `/billing/success` with session id; fetch subscription status.
- Portal: `/api/billing/portal` to create Stripe billing portal session.

### 3.3 Usage‑Based Billing (Add‑ons)

- Define metered price(s) for:
  - Analysis jobs beyond monthly quota.
  - Figma export batches beyond included limit.
- Record usage via `usage_records.create` per job completion.
- Display usage in Billing page with daily aggregation.

### 3.4 Webhooks & State

- Endpoint: `POST /api/stripe/webhook` (raw body).
- Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated|deleted`, `customer.tax_id.created`.
- Persistence: `User`, `Subscription`, `Usage` models (MVP can be JSON file or SQLite; production Postgres).
- Idempotency: store processed event ids; return 2xx fast.
- Logging: structured event logs, mask PII.

### 3.5 EU Compliance

- PSD2/SCA: always use Payment Intents/Checkout; offload SCA to Stripe.
- SEPA: enable mandate for `sepa_debit`; note delayed settlement.
- VAT: enable Stripe Tax, collect customer tax ID and billing country; show tax breakdown; store tax IDs on Customer.
- Invoices: ensure tax rates applied; provide downloadable invoices in portal.

Deliverables

- API: `/api/billing/checkout`, `/api/billing/portal`, `/api/stripe/webhook`.
- Client: `BillingPage` with plan, status, payment method, usage.
- Models: `src/types/billing.ts`.
- Agent (optional): `stripeBillingAgent.ts` to encapsulate billing ops for orchestrator‑driven flows.

---

## Phase 4 — Deployment Strategy

Goal: Reliable hosting with fast iteration. Primary: Vercel; Alternative: Netlify.

### 4.1 Hosting & Build

- Vercel projects: `consultant-portal` (frontend + API routes). Framework preset: Vite/React.
- Configure serverless API routes under `api/` or framework’s `functions/` directory.
- Edge/runtime choices: default Node serverless for Stripe webhooks (needs raw body), not Edge runtime.

### 4.2 Environment Variables

- Vercel envs: add all secrets for `Production`, `Preview`, `Development`.
- Required keys:
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_EUR_299`.
  - Figma: `FIGMA_PERSONAL_TOKEN`, `FIGMA_TEAM_ID`.
  - Storage: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (or GCS equivalents).
  - App: `APP_BASE_URL`, `ALLOWED_ORIGINS`.

### 4.3 CI/CD

- GitHub Actions workflow:
  - Jobs: `lint` (ESLint), `typecheck` (tsc), `build` (vite build), `test` (unit only), `preview-deploy`.
  - Required checks before merge to `main`.
- Vercel Git integration for preview deployments on PRs.

### 4.4 Domain & SSL

- Add domain in Vercel; configure DNS; SSL auto‑provisioned.
- Force HTTPS; HSTS header; CORS aligned to primary domain.

Deliverables

- `.vercel/project.json` (auto by Vercel), `vercel.json` for function config (raw body for webhooks).
- `.github/workflows/ci.yml` with lint/typecheck/build/test.

---

## Data Models (MVP)

```ts
// src/types/analysis.ts
export type AnalysisType = 'deadline' | 'research';

export interface DocumentMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  storageKey: string;
  uploadedAt: string;
}

export interface AnalysisJob {
  id: string;
  documentId: string;
  types: AnalysisType[];
  status: 'queued' | 'running' | 'completed' | 'failed';
  results?: AnalysisResult;
  error?: string;
}

export interface DeadlineValidation {
  program: string;
  dueDate: string;
  daysRemaining: number;
  risks: string[];
}

export interface ResearchSummary {
  queries: string[];
  findings: { title: string; url?: string; summary: string }[];
}

export interface AnalysisResult {
  deadline?: DeadlineValidation;
  research?: ResearchSummary;
}
```

```ts
// src/types/billing.ts
export interface SubscriptionState {
  status: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  priceId?: string;
  currentPeriodEnd?: string;
}

export interface UsageRecordInput {
  metric: 'analysis_job' | 'export_batch';
  quantity: number;
  timestamp: number;
}
```

---

## API Contract (MVP)

- `POST /api/upload`
  - Body: form‑data `file`
  - 200: `{ documentId: string }`

- `POST /api/analysis/start`
  - Body: `{ documentId: string, analyses: AnalysisType[] }`
  - 200: `{ jobId: string }`

- `GET /api/analysis/:jobId`
  - 200: `AnalysisJob`

- `POST /api/design/generate`
  - Body: `{ templateType, data, bulk? }`
  - 200: `{ jobId: string }`

- `POST /api/design/export`
  - Body: `{ fileId|nodeIds, format: 'pdf'|'png'|'pptx' }`
  - 200: `{ urls: string[] }`

- `POST /api/billing/checkout`
  - Body: `{ priceId?: string, successUrl, cancelUrl }`
  - 200: `{ url: string }`

- `POST /api/billing/portal`
  - 200: `{ url: string }`

- `POST /api/stripe/webhook` (raw body)
  - 2xx on success; idempotent.

---

## New Agents (BaseAgent + AgentFactory registration)

- `src/agents/deadlineValidatorAgent.ts`
  - Input: `{ documentId }` → parses deadlines; uses EU calendar utils.
  - Output: `DeadlineValidation`.

- `src/agents/researchAgent.ts`
  - Input: `{ topic, constraints? }` → structured web research using existing research tooling.
  - Output: `ResearchSummary`.

- `src/agents/figmaMCPAgent.ts`
  - Input: template + data; Output: export URLs and nodeIds.

- `src/agents/stripeBillingAgent.ts` (optional wrapper)
  - Input: `{ userId, action, payload }`; handles checkout/portal/usage record creation.

Registration: update `src/orchestrator/agentFactory.ts` with type → constructor map; add `type` strings: `deadline-validator`, `research`, `figma-mcp`, `stripe-billing`.

---

## Security, Compliance, Logging

- Input validation: Zod/AJV at all API boundaries.
- AuthZ: gate billing and analysis write endpoints to authenticated users (if auth added in MVP+1).
- Secrets: never log; restrict to server runtime; rotate regularly.
- GDPR: enable deletion of documents on request; data retention config; avoid storing raw PII in logs.
- Stripe webhook: verify signatures; store only minimal billing metadata.
- Structured logging: `{ level, ts, reqId, userId?, route, message, data }` to `logs/` and stdout.

---

## Testing Strategy (MVP)

- Type checks: `tsc --noEmit` in CI.
- Unit tests: pure utils (deadline calc, template mapper, API validators).
- Integration tests: mocked handlers for `/api/analysis/*` and billing handlers with Stripe SDK mocked.
- Manual E2E smoke: upload → analysis start → status polling; upgrade to billing; run webhook simulation.

---

## Implementation Order (Phased Sprints)

1) Web MVP foundations
   - Router, layout, state, Upload UI, API stubs.
   - Types for analysis; in‑memory job registry.
   - DeadlineValidatorAgent + UI card.
   - ResearchAgent + panel.

2) Figma MCP core path
   - Configure MCP server + env.
   - Implement `figmaMCPAgent` with template JSON and mapper.
   - `/api/design/generate` and `/api/design/export` + storage.

3) Stripe subscriptions
   - Checkout/Portal endpoints + Billing page.
   - Webhook handler with idempotency + state mapping.
   - Enable Stripe Tax and SEPA; capture tax IDs.

4) Deployment & CI/CD
   - Vercel project + env vars; ensure webhook uses Node runtime.
   - GitHub Actions: lint/typecheck/build/test.
   - Domain + SSL + security headers.

5) Usage‑based add‑ons (post‑MVP)
   - Metered prices; usage records per analysis/export.
   - Billing UI for usage charts.

6) Hardening & UX polish
   - Error states, retries, telemetry dashboards.
   - Auth enablement if needed; data retention controls.

---

## Env Vars (Summary)

- Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_EUR_299`.
- Figma: `FIGMA_PERSONAL_TOKEN`, `FIGMA_TEAM_ID`, `FIGMA_FILE_ID` (optional per template).
- Storage: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (or GCS equivalents).
- App: `APP_BASE_URL`, `ALLOWED_ORIGINS`, `NODE_ENV`.

---

## Notes & Next Steps

- Reuse existing research tooling listed in `SYSTEM_LATEST_IMPLEMENTATIONS.md` for the Research agent if available.
- Ensure `vercel.json` marks webhook route with `"bodyParser": false` (raw body) or framework‑specific equivalent.
- Keep each new file < 500 lines; split mappers and validators.
- Document API examples in `docs/api/` once endpoints stabilize.

