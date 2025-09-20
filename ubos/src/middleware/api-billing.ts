import type { Request, Response, NextFunction } from 'express';
import { usageTracker } from '../monetization/usage-tracking.js';
import { apiKeyManager } from '../monetization/api-key-manager.js';

export interface BillingRequest extends Request {
  customer?: {
    id: string;
    tierId: string;
  };
}

export async function apiBillingMiddleware(req: BillingRequest, res: Response, next: NextFunction) {
  const apiKeyHeader = req.headers['x-api-key'];
  const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

  if (!apiKey) {
    return res.status(401).send({ error: 'API key is required' });
  }

  const customerId = await apiKeyManager.getCustomerFromKey(apiKey);

  if (!customerId) {
    return res.status(403).send({ error: 'Invalid API key' });
  }

  const customer = { id: customerId, tierId: 'starter' }; // tierId is a placeholder for now

  const hasAccess = await usageTracker.checkLimits(customer.id, 'api_request');

  if (!hasAccess) {
    return res.status(429).send({ error: 'API request limit exceeded' });
  }

  // Attach customer info to the request for downstream use
  req.customer = customer;

  // Record the usage event (fire and forget)
  usageTracker.recordEvent({
    customerId: customer.id,
    tierId: customer.tierId,
    eventType: 'api_request',
    endpoint: req.path,
    timestamp: Date.now(),
    cost: 0.05, // Example cost, can be made dynamic
  });

  next();
}
