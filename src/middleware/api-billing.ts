import { Request, Response, NextFunction } from 'express';
import { usageTracker } from '../monetization/usage-tracking.js';
import { agentActionLogger } from '../masterControl/agentActionLogger.js';
import { apiKeyManager } from '../monetization/api-key-manager.js';

interface BillingRequest extends Request {
  customerId?: string;
  subscriptionId?: string;
  billingTier?: string;
}

const endpointPricing: Record<string, { pricePerRequest: number; requiredTier?: string }> = {
  '/api/execute': { pricePerRequest: 0.10 },
  '/api/analyze': { pricePerRequest: 0.05 },
  '/api/scan-funding': { pricePerRequest: 0.03 },
  '/api/assistant': { pricePerRequest: 0.02 },
  '/api/funding-data': { pricePerRequest: 0.01, requiredTier: 'professional' }
};

export const billingMiddleware = async (req: BillingRequest, res: Response, next: NextFunction) => {
  const actionId = await agentActionLogger.startWork(
    'BillingMiddleware',
    'Process API billing',
    `Processing billing for ${req.path}`,
    'system'
  );

  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '');

    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    const customerId = await apiKeyManager.getCustomerFromKey(apiKey);
    if (!customerId) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.customerId = customerId;

    const canProceed = await usageTracker.checkLimits(customerId, 'api_request');
    if (!canProceed) {
      res.status(429).json({
        error: 'Usage limit exceeded',
        message: 'Upgrade your subscription for higher limits'
      });
      return;
    }

    const pricing = endpointPricing[req.path];
    if (pricing) {
      await usageTracker.recordEvent({
        customerId,
        eventType: 'api_request',
        endpoint: req.path,
        timestamp: Date.now(),
        cost: pricing.pricePerRequest,
        metadata: {
          method: req.method,
          userAgent: req.headers['user-agent']
        }
      });
    }

    await agentActionLogger.completeWork(
      actionId,
      `Billing processed for ${req.path}`,
      []
    );

    next();
  } catch (error) {
    await agentActionLogger.completeWork(
      actionId,
      `Billing failed: ${error instanceof Error ? error.message : String(error)}`,
      []
    );
    res.status(500).json({ error: 'Billing processing failed' });
  }
};
