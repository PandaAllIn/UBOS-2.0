# Stripe MCP Server Setup (EUFM SaaS)

Purpose: Add a Stripe-backed MCP server that exposes billing tools (Checkout, Customer Portal, Subscription status) to EUFM agents, with a secure webhook to update internal billing state.

Scope: Focused, task-based steps. Uses TypeScript/Node.js. No changes to existing behavior required.

---

## Task 0 — Prerequisites

- Stripe account with test mode enabled.
- Node.js 18+ and pnpm/npm.
- Access to EUFM repo and ability to add env vars.
- Decide EUFM plans and Stripe mapping (Product/Price IDs):
  - e.g., EUFM_BASIC → `price_...basic`, EUFM_PRO → `price_...pro`, EUFM_ENTERPRISE → custom.

Output: A short mapping document (JSON or .md) listing Product/Price → EUFM plan.

---

## Task 1 — Install Dependencies

Run in project root:

```bash
pnpm add stripe express body-parser
pnpm add -D @types/express @types/body-parser
pnpm add @modelcontextprotocol/sdk @modelcontextprotocol/transport-node
```

Notes:
- `stripe` is the official SDK.
- MCP SDK/transport packages provide a stdio transport for agent tools.

---

## Task 2 — Stripe Dashboard Setup

1) Create Products and recurring Prices for each EUFM plan.
2) Get API keys: `STRIPE_SECRET_KEY` (test), `STRIPE_WEBHOOK_SECRET` (created after Stripe CLI or Dashboard endpoint setup).
3) Optional: Create a restricted key for read-only tools (usage reads, customers lookup).
4) Configure Customer Portal (Billing → Customer portal) and enable products.

Record:
- Product IDs: `prod_...`
- Price IDs: `price_...`
- Portal return URL: e.g., `https://app.eufm.ai/billing/return`

---

## Task 3 — Environment Variables

Add to `.env` (and mirror in `.env.example` as placeholders):

```
# Stripe core
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# EUFM plan mapping (comma-separated pairs of priceId:PlanId)
EUFM_STRIPE_PLAN_MAP=price_basic:EUFM_BASIC,price_pro:EUFM_PRO,price_enterprise:EUFM_ENTERPRISE

# Public app URLs for redirect/portal
EUFM_APP_URL=https://app.eufm.ai
EUFM_BILLING_RETURN_URL=https://app.eufm.ai/billing/return

# MCP server options
MCP_STRIPE_ENABLE_STDIO=true
MCP_STRIPE_ENABLE_WS=false
MCP_STRIPE_WEBSOCKET_PORT=7334

# Webhook server options
STRIPE_WEBHOOK_PORT=4242
STRIPE_WEBHOOK_PATH=/stripe/webhook
```

Security:
- Keep `sk_*` and `whsec_*` secrets out of logs.
- Use separate keys per environment; rotate on exposure.

---

## Task 4 — Scaffold MCP Stripe Server (TypeScript)

Create `src/mcp/stripeServer.ts` exposing tools:
- `stripe.createCheckoutSession`
- `stripe.createPortalSession`
- `stripe.getCustomerSubscriptions`

Minimal structure (pseudocode excerpt):

```ts
// src/mcp/stripeServer.ts
import Stripe from 'stripe';
import { createServer } from '@modelcontextprotocol/sdk';
import { StdioServerTransport } from '@modelcontextprotocol/transport-node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

type PlanId = 'EUFM_BASIC' | 'EUFM_PRO' | 'EUFM_ENTERPRISE';
const map = Object.fromEntries(
  (process.env.EUFM_STRIPE_PLAN_MAP ?? '')
    .split(',')
    .filter(Boolean)
    .map(pair => {
      const [price, plan] = pair.split(':');
      return [price.trim(), plan.trim() as PlanId];
    })
);

export async function startStripeMcp() {
  const srv = createServer({
    name: 'eufm-stripe',
    version: '0.1.0',
    tools: {
      // Creates Stripe Checkout Session for a given priceId and userId
      'stripe.createCheckoutSession': async (args: { priceId: string; customerId?: string; userId: string }) => {
        try {
          const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{ price: args.priceId, quantity: 1 }],
            success_url: `${process.env.EUFM_BILLING_RETURN_URL}?status=success`,
            cancel_url: `${process.env.EUFM_BILLING_RETURN_URL}?status=cancel`,
            client_reference_id: args.userId,
            customer: args.customerId,
            allow_promotion_codes: true,
          });
          return { id: session.id, url: session.url };
        } catch (err: any) {
          console.error('createCheckoutSession error', err?.message);
          throw new Error('Failed to create checkout session');
        }
      },
      // Generates a Customer Portal session
      'stripe.createPortalSession': async (args: { customerId: string }) => {
        try {
          const session = await stripe.billingPortal.sessions.create({
            customer: args.customerId,
            return_url: process.env.EUFM_BILLING_RETURN_URL!,
          });
          return { url: session.url };
        } catch (err: any) {
          console.error('createPortalSession error', err?.message);
          throw new Error('Failed to create portal session');
        }
      },
      // Fetches active subscriptions for a customer
      'stripe.getCustomerSubscriptions': async (args: { customerId: string }) => {
        try {
          const subs = await stripe.subscriptions.list({ customer: args.customerId, status: 'all' });
          const result = subs.data.map(s => ({
            id: s.id,
            status: s.status,
            priceId: s.items.data[0]?.price.id,
            plan: map[s.items.data[0]?.price.id ?? ''] ?? null,
            currentPeriodEnd: s.current_period_end,
            cancelAtPeriodEnd: s.cancel_at_period_end,
          }));
          return { subscriptions: result };
        } catch (err: any) {
          console.error('getCustomerSubscriptions error', err?.message);
          throw new Error('Failed to fetch subscriptions');
        }
      },
    },
  });

  if (process.env.MCP_STRIPE_ENABLE_STDIO === 'true') {
    const transport = new StdioServerTransport();
    await srv.connect(transport);
    console.log('[MCP] Stripe server running on stdio');
  }
}

if (require.main === module) {
  startStripeMcp().catch(err => {
    console.error('Stripe MCP failed to start', err);
    process.exit(1);
  });
}
```

Add npm scripts:

```json
{
  "scripts": {
    "dev:billing:mcp": "ts-node src/mcp/stripeServer.ts"
  }
}
```

---

## Task 5 — Webhook Server (Express)

Create `src/mcp/stripeWebhook.ts` to verify signatures and update internal state. Handle:
- `checkout.session.completed` → mark user as active with mapped plan.
- `customer.subscription.created|updated|deleted` → sync plan and status.
- `invoice.payment_failed|succeeded` → notify/log; adjust grace periods.

Pseudocode excerpt:

```ts
// src/mcp/stripeWebhook.ts
import express from 'express';
import bodyParser from 'body-parser';
import Stripe from 'stripe';
import { promises as fs } from 'fs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
const app = express();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Raw body required for signature verification
app.post(process.env.STRIPE_WEBHOOK_PATH || '/stripe/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await persistStatusFromSession(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await persistStatusFromSubscription(sub);
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        // Optional: log or notify
        break;
      }
      default:
        // ignore others
        break;
    }
    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

async function persistStatusFromSession(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const priceId = (session.line_items?.data?.[0]?.price?.id) || (session.metadata?.price_id) || '';
  await writeBillingState(customerId, priceId, 'active');
}

async function persistStatusFromSubscription(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const priceId = sub.items.data[0]?.price?.id || '';
  await writeBillingState(customerId, priceId, sub.status);
}

async function writeBillingState(customerId: string, priceId: string, status: string) {
  const outDir = 'logs/billing';
  await fs.mkdir(outDir, { recursive: true });
  const file = `${outDir}/stripe-subscriptions.json`;
  let data: any = {};
  try { data = JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  data[customerId] = { priceId, status, updatedAt: new Date().toISOString() };
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  console.log('[billing] saved', customerId, priceId, status);
}

export function startStripeWebhook() {
  const port = Number(process.env.STRIPE_WEBHOOK_PORT || 4242);
  app.listen(port, () => console.log(`[billing] Stripe webhook listening on :${port}`));
}

if (require.main === module) startStripeWebhook();
```

Add npm script:

```json
{
  "scripts": {
    "dev:billing:webhook": "ts-node src/mcp/stripeWebhook.ts"
  }
}
```

---

## Task 6 — EUFM Subscription Integration

Goal: Keep EUFM aware of a user’s billing plan and status.

Recommended minimal approach (non-invasive):
- Persist Stripe-derived state to `logs/billing/stripe-subscriptions.json` (as above).
- Add a small service in EUFM (later) to read this file and expose billing status to dashboards/agents.
- Use `EUFM_STRIPE_PLAN_MAP` to translate Stripe Price IDs into EUFM plan enums, enabling feature toggles or limits.

Optional deeper integration:
- Emit internal events (e.g., via an in-app event bus) on subscription changes.
- Lock “Pro-only” features if status != `active` or plan != expected.

---

## Task 7 — Webhook Setup (Stripe CLI) and Test

Start webhook server locally:

```bash
pnpm run dev:billing:webhook
```

In a new shell, listen and forward events:

```bash
stripe login
stripe listen --forward-to localhost:4242/stripe/webhook
```

The CLI prints a `whsec_...` secret — update `STRIPE_WEBHOOK_SECRET` and restart webhook server.

Test a checkout session (using MCP tool or direct API):

```bash
# Example direct API test: create a session (replace price and customer)
node -e "(async()=>{const s=require('stripe')(process.env.STRIPE_SECRET_KEY);const r=await s.checkout.sessions.create({mode:'subscription',line_items:[{price:'price_XXXX',quantity:1}],success_url:process.env.EUFM_BILLING_RETURN_URL,cancel_url:process.env.EUFM_BILLING_RETURN_URL});console.log(r.url)})()"
```

Verify:
- Checkout completes in test mode.
- Webhook logs event and writes `logs/billing/stripe-subscriptions.json`.
- MCP tools work: create checkout, portal session, and read subscriptions.

---

## Task 8 — Production Hardening

- Use restricted API keys for read-only MCP tools; keep write ops minimal.
- Enable retry/idempotency on creation calls (pass `idempotencyKey`).
- Enforce signature verification and HTTPS only.
- Rotate keys regularly; separate test vs prod projects.
- Observability: structured logs to `logs/billing/*.log` and error alerts.
- Privacy: avoid storing full PII; store only IDs needed to map users ↔ customers (GDPR-conscious).
- Backoff and reconcile: on downtime, fetch `events.list` to backfill missed changes.

---

## Task 9 — Rollout Plan

1) Ship MCP server + webhook to staging with test keys.
2) QA flows: new checkout, upgrade/downgrade, cancellation, payment failed.
3) Update dashboards to surface plan/status from `logs/billing/stripe-subscriptions.json`.
4) Switch to prod keys; create prod webhook endpoint (per region if needed).
5) Monitor closely for the first billing cycle.

---

## Notes on MCP Integration in EUFM

- Stdio transport is recommended for internal agent usage.
- If a WebSocket or HTTP transport is preferred, add `MCP_STRIPE_ENABLE_WS=true` and serve on an internal port; restrict network access.
- Keep MCP tools narrowly scoped: prefer returning URLs (Checkout/Portal) rather than performing destructive account mutations.

---

## Appendix — Suggested Files and Paths

- `src/mcp/stripeServer.ts` — MCP tools for Stripe.
- `src/mcp/stripeWebhook.ts` — Express webhook handler.
- `logs/billing/stripe-subscriptions.json` — Internal billing state snapshot.
- `.env` — Stripe keys and config (no secrets in VCS).

This guide does not modify existing EUFM functionality. Add code incrementally, test with Stripe CLI, and then wire into dashboards as needed.

