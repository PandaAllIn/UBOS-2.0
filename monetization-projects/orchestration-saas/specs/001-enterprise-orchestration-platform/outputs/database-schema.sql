-- Enterprise AI Orchestration Platform — Multi-tenant PostgreSQL Schema (EUFM)
-- Focus: Tenant isolation, RBAC, audit, monitoring, billing

CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- For time-series metrics, TimescaleDB optional
-- CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Tenancy & Identity -------------------------------------------------------

CREATE TABLE tenants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  slug                text UNIQUE NOT NULL,
  plan                text NOT NULL DEFAULT 'starter',
  region              text NOT NULL DEFAULT 'eu-central-1',
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE environments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                text NOT NULL,
  type                text NOT NULL CHECK (type IN ('dev','staging','prod')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               citext UNIQUE NOT NULL,
  name                text,
  status              text NOT NULL DEFAULT 'active',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identities (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            text NOT NULL,        -- 'oidc','saml','password'
  subject             text NOT NULL,        -- sub from IdP
  tenant_id           uuid,                 -- optional tenant scoping for SSO
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, subject)
);

CREATE TABLE roles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name                text NOT NULL,
  description         text,
  UNIQUE (tenant_id, name)
);

CREATE TABLE permissions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text UNIQUE NOT NULL,
  description         text
);

CREATE TABLE role_permissions (
  role_id             uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id       uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id             uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE (tenant_id, user_id, role_id)
);

-- Access & Secrets ---------------------------------------------------------

CREATE TABLE api_keys (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  environment_id      uuid REFERENCES environments(id) ON DELETE SET NULL,
  name                text NOT NULL,
  key_prefix          text NOT NULL,
  key_hash            bytea NOT NULL,      -- hashed + salted
  scopes              text[] NOT NULL DEFAULT '{api:read,api:write}',
  last_used_at        timestamptz,
  created_by          uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE secrets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                text NOT NULL,
  encrypted_value     bytea NOT NULL,      -- envelope-encrypted via KMS
  created_by          uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE provider_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider            text NOT NULL,       -- 'openai','anthropic','google','perplexity', etc.
  account_label       text NOT NULL,
  encrypted_credentials bytea NOT NULL,
  meta                jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, account_label)
);

-- Routing & Orchestration --------------------------------------------------

CREATE TABLE routing_policies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                text NOT NULL,
  strategy            jsonb NOT NULL,      -- e.g., latency/cost/SLA weights, rules
  enabled             boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE agents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                text NOT NULL,
  type                text NOT NULL,       -- e.g., 'router','planner','toolformer'
  config              jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE agent_versions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  version             int NOT NULL,
  config              jsonb NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, version)
);

CREATE TABLE workflows (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                text NOT NULL,
  version             int NOT NULL DEFAULT 1,
  definition          jsonb NOT NULL,      -- declarative DAG/state machine
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name, version)
);

CREATE TABLE tasks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  environment_id      uuid REFERENCES environments(id) ON DELETE SET NULL,
  workflow_id         uuid REFERENCES workflows(id) ON DELETE SET NULL,
  agent_id            uuid REFERENCES agents(id) ON DELETE SET NULL,
  input               jsonb NOT NULL,
  status              text NOT NULL DEFAULT 'queued', -- queued|running|succeeded|failed|canceled
  priority            int NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE task_executions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  started_at          timestamptz NOT NULL DEFAULT now(),
  ended_at            timestamptz,
  status              text NOT NULL DEFAULT 'running',
  trace_id            text,
  logs_uri            text
);

-- Requests, Usage & Analytics ---------------------------------------------

CREATE TABLE requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  environment_id      uuid REFERENCES environments(id) ON DELETE SET NULL,
  task_id             uuid REFERENCES tasks(id) ON DELETE SET NULL,
  provider            text NOT NULL,
  model               text,
  status              text NOT NULL DEFAULT 'completed',
  latency_ms          int,
  input_token_count   int,
  output_token_count  int,
  cost_usd            numeric(12,6),
  created_at          timestamptz NOT NULL DEFAULT now(),
  INDEX_tenant_time   text GENERATED ALWAYS AS (tenant_id::text || ':' || date_trunc('day', created_at)::text) STORED
);

CREATE INDEX idx_requests_tenant_time ON requests(tenant_id, created_at DESC);

CREATE TABLE request_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  ts                  timestamptz NOT NULL DEFAULT now(),
  type                text NOT NULL,
  payload             jsonb NOT NULL
);

-- Optional Timescale hypertable for high-volume metrics
-- SELECT create_hypertable('request_events', by_range('ts'));

CREATE TABLE usage_aggregates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start        timestamptz NOT NULL,
  period_end          timestamptz NOT NULL,
  unit                text NOT NULL,       -- 'requests','tokens','cost_usd'
  value               numeric(18,6) NOT NULL,
  cost_usd            numeric(18,6) NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, period_start, period_end, unit)
);

-- Audit, Alerts & Webhooks -------------------------------------------------

CREATE TABLE audit_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_api_key_id    uuid REFERENCES api_keys(id) ON DELETE SET NULL,
  action              text NOT NULL,
  target_type         text,
  target_id           text,
  ip                  inet,
  user_agent          text,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                text NOT NULL,
  condition           jsonb NOT NULL,      -- e.g., thresholds, anomaly config
  channel             text NOT NULL,       -- 'email','slack','webhook'
  enabled             boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE alert_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id            uuid NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  triggered_at        timestamptz NOT NULL DEFAULT now(),
  status              text NOT NULL DEFAULT 'firing',
  payload             jsonb NOT NULL
);

CREATE TABLE webhooks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url                 text NOT NULL,
  secret              bytea NOT NULL,
  events              text[] NOT NULL,
  enabled             boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_deliveries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id          uuid NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type          text NOT NULL,
  status              text NOT NULL,       -- 'pending','succeeded','failed'
  attempt             int NOT NULL DEFAULT 1,
  response_code       int,
  error_message       text,
  sent_at             timestamptz NOT NULL DEFAULT now()
);

-- Billing & Quotas ---------------------------------------------------------

CREATE TABLE billing_customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider            text NOT NULL DEFAULT 'stripe',
  external_customer_id text NOT NULL,
  UNIQUE (provider, external_customer_id)
);

CREATE TABLE subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan                text NOT NULL,
  status              text NOT NULL,       -- 'active','past_due','canceled'
  current_period_end  timestamptz,
  usage_quota         jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE rate_limits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  environment_id      uuid REFERENCES environments(id) ON DELETE SET NULL,
  window_seconds      int NOT NULL,
  max_requests        int,
  max_tokens          int,
  strategy            text NOT NULL DEFAULT 'fixed-window'
);

-- Data Residency & Policy --------------------------------------------------

CREATE TABLE data_residency_policies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  region              text NOT NULL,       -- e.g., 'eu','us'
  enforced            boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, region)
);

-- Indices for common access patterns --------------------------------------

CREATE INDEX idx_tasks_tenant_status ON tasks(tenant_id, status);
CREATE INDEX idx_requests_tenant_provider ON requests(tenant_id, provider, created_at DESC);
CREATE INDEX idx_audit_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_api_keys_tenant_last_used ON api_keys(tenant_id, last_used_at DESC);

