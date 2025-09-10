import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { sha256Hex, extractApiKeyPrefix } from './lib/crypto.js';
import { memoryDb } from './lib/memoryDb.js';
import { findApiKey } from './lib/db.js';
import { createRemoteJWKSet, jwtVerify } from 'jose';

type RequestContext = {
  tenantId?: string;
  envId?: string;
  userId?: string;
  apiKeyId?: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    ctx: RequestContext;
  }
}

const ctxPlugin = fp(async (app) => {
  app.addHook('onRequest', async (req) => {
    req.ctx = {};
    const tenant = req.headers['x-tenant-id'];
    const env = req.headers['x-env-id'];
    if (typeof tenant === 'string') req.ctx.tenantId = tenant;
    if (typeof env === 'string') req.ctx.envId = env;
  });
});

const requireTenant = fp(async (app) => {
  app.addHook('preHandler', async (req, reply) => {
    // Skip enforcement for health checks
    const url = req.routeOptions?.url;
    if (url === '/healthz') return;
    if (!req.ctx.tenantId) {
      reply.code(400).send({ error: 'X-Tenant-Id header is required' });
    }
  });
});

const apiKeyAuth = fp(async (app) => {
  app.addHook('preHandler', async (req) => {
    const apiKey = req.headers['x-api-key'];
    if (typeof apiKey === 'string') {
      const prefix = extractApiKeyPrefix(apiKey);
      const hash = sha256Hex(apiKey);
      // First check DB, then fallback to memory (dev mode)
      const row = await findApiKey(prefix, hash, req.ctx.tenantId);
      const rec = row || memoryDb.findApiKeyByPrefixAndHash(prefix, hash, req.ctx.tenantId);
      if (rec) {
        req.ctx.apiKeyId = prefix;
      }
    }
  });
});

function makeOidcVerifier(jwksUri: string) {
  const JWKS = createRemoteJWKSet(new URL(jwksUri));
  return async (token: string) => {
    try {
      const { payload } = await jwtVerify(token, JWKS, {});
      return payload.sub as string | undefined;
    } catch {
      return undefined;
    }
  };
}

const bearerAuth = (jwksUri: string) => fp(async (app) => {
  const verify = makeOidcVerifier(jwksUri);
  app.addHook('preHandler', async (req) => {
    const auth = req.headers['authorization'];
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      const sub = await verify(token);
      if (sub) req.ctx.userId = sub;
    }
  });
});

export async function buildServer() {
  try { (await import('./tracing.js')).initTracing(); } catch {}
  const app = Fastify({ logger: true });
  // CORS for portal dev
  try {
    const cors = (await import('@fastify/cors')).default;
    await app.register(cors, { origin: true });
  } catch {}
  await app.register(ctxPlugin);
  await app.register(requireTenant);
  await app.register(apiKeyAuth);
  if (process.env.OIDC_JWKS_URI) {
    await app.register(bearerAuth(process.env.OIDC_JWKS_URI));
  }

  app.get('/healthz', async () => ({ ok: true }));

  // Enrich logs with tenantId if present
  app.addHook('onRequest', async (req) => {
    if (req.ctx?.tenantId) {
      // @ts-ignore fastify logger child available
      (req as any).log = req.log.child({ tenantId: req.ctx.tenantId });
    }
  });

  // Simple Zod-based validation for OrchestrateRequest
  const { z } = await import('zod');
  const OrchestrateRequest = z.object({
    input: z.union([z.string(), z.record(z.any())]),
    taskType: z.string().optional(),
    routingPolicyId: z.string().uuid().optional(),
    providerPreferences: z.array(z.object({
      provider: z.string().optional(),
      model: z.string().optional(),
      weight: z.number().optional(),
    })).optional(),
    async: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  });

  app.post('/v1/orchestrate', async (req, reply) => {
    const parse = OrchestrateRequest.safeParse(req.body);
    if (!parse.success) {
      reply.code(400).send({ error: 'Invalid request', issues: parse.error.issues });
      return;
    }
    const body = parse.data;
    const requestId = `req_${Date.now()}`;
    // BILL-002 rate limiting/budgets (very light check placeholder)
    if (!req.ctx.tenantId) { reply.code(400).send({ error: 'X-Tenant-Id header is required' }); return; }
    if (body.async) {
      const { enqueue } = await import('./lib/queue.js');
      const { enabled, enqueueRedis } = await import('./lib/redisQueue.js');
      const { createTask } = await import('./lib/db.js');
      if (req.ctx.tenantId) await createTask(requestId, req.ctx.tenantId, 'queued');
      if (enabled()) await enqueueRedis('orchestrate', { id: requestId, tenantId: req.ctx.tenantId, input: body.input });
      else enqueue({ id: requestId, tenantId: req.ctx.tenantId, input: body.input });
      reply.code(202).send({ requestId, status: 'queued' });
      return;
    }
    // For sync mode, call stub adapter
    const { selectAdapter } = await import('./providers/select.js');
    const preferred = body.providerPreferences?.[0]?.provider;
    const adapter = selectAdapter(preferred);
    const res = await adapter.send(body.input);
    const { recordRequest } = await import('./lib/metrics.js');
    if (req.ctx.tenantId) await recordRequest({ id: requestId, tenantId: req.ctx.tenantId, provider: (adapter as any).name, latencyMs: res.latencyMs, inputTokens: res.inputTokens, outputTokens: res.outputTokens, costUsd: res.costUsd });
    reply.send({ requestId, status: 'completed', output: res.output, latencyMs: res.latencyMs });
  });

  // API-004: create task and get task
  app.post('/v1/tasks', async (req, reply) => {
    const id = `task_${Date.now()}`;
    const { createTask } = await import('./lib/db.js');
    if (!req.ctx.tenantId) { reply.code(400).send({ error: 'X-Tenant-Id header is required' }); return; }
    await createTask(id, req.ctx.tenantId, 'queued');
    reply.code(202).send({ id, status: 'queued' });
  });

  app.get('/v1/tasks/:id', async (req, reply) => {
    const { getTask } = await import('./lib/db.js');
    const task = await getTask((req.params as any).id);
    if (!task) { reply.code(404).send({ error: 'Not found' }); return; }
    reply.send(task);
  });

  // SSE events (API-005 stub)
  app.get('/v1/events', async (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    const { onEvent } = await import('./lib/queue.js');
    const tenantFilter = typeof req.query?.tenantId === 'string' ? req.query?.tenantId : undefined;
    const unsub = onEvent((evt) => {
      if (tenantFilter && evt.data?.tenantId && evt.data.tenantId !== tenantFilter) return;
      reply.raw.write(`event: ${evt.type}\n`);
      reply.raw.write(`data: ${JSON.stringify(evt.data)}\n\n`);
    });
    req.raw.on('close', () => { unsub(); });
  });

  // MON-002: Usage aggregation endpoint
  app.get('/v1/metrics/usage', async (req, reply) => {
    const q = req.query as any;
    const unit = (q.unit as string) || 'requests';
    const { usageAggregate } = await import('./lib/metrics.js');
    if (!req.ctx.tenantId) { reply.code(400).send({ error: 'X-Tenant-Id header is required' }); return; }
    const agg = await usageAggregate(req.ctx.tenantId, q.from, q.to, unit as any);
    reply.send(agg);
  });

  return app;
}

if (process.env.RUN_SERVER !== 'false') {
  buildServer().then((app) => {
    if (process.env.START_WORKER === 'true') {
      import('./lib/queue.js').then((m) => m.startWorker()).catch(() => {});
    }
    const port = Number(process.env.PORT || 8080);
    app.listen({ port, host: '0.0.0.0' }).catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
  });
}


