/**
 * UBOS CodeRabbit Webhook Handler
 * Express middleware for handling CodeRabbit webhook events
 */

import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { codeRabbitService, CodeRabbitWebhookPayload } from './coderabbitService.js';
import { agentActionLogger } from '../../masterControl/agentActionLogger.js';

const router = express.Router();

interface CodeRabbitWebhookRequest extends Request {
  body: CodeRabbitWebhookPayload;
}

/**
 * Verify CodeRabbit webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) return true; // Allow unsigned webhooks in development
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

/**
 * CodeRabbit webhook middleware
 */
router.use('/webhook', express.raw({ type: 'application/json' }));

/**
 * CodeRabbit webhook endpoint
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const actionId = await agentActionLogger.startWork(
    'CodeRabbitWebhook',
    'Process webhook',
    'Processing incoming CodeRabbit webhook',
    'system'
  );

  try {
    const signature = req.get('X-CodeRabbit-Signature') || '';
    const payload = req.body.toString();
    const secret = process.env.CODERABBIT_WEBHOOK_SECRET || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, secret)) {
      await agentActionLogger.completeWork(
        actionId,
        'Webhook signature verification failed',
        []
      );
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid webhook signature' 
      });
    }

    // Parse and validate payload
    let webhookPayload: CodeRabbitWebhookPayload;
    try {
      webhookPayload = JSON.parse(payload);
    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        'Invalid JSON payload',
        []
      );
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid JSON payload' 
      });
    }

    // Process the webhook
    await codeRabbitService.processWebhook(webhookPayload);

    await agentActionLogger.completeWork(
      actionId,
      `Successfully processed ${webhookPayload.event}`,
      [`review-${webhookPayload.review.id}`]
    );

    res.json({ 
      success: true, 
      message: `Processed ${webhookPayload.event}`,
      reviewId: webhookPayload.review.id
    });

  } catch (error) {
    console.error('CodeRabbit webhook error:', error);
    
    await agentActionLogger.completeWork(
      actionId,
      `Webhook processing failed: ${error}`,
      []
    );

    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * Get CodeRabbit integration status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const summary = codeRabbitService.generateDashboardSummary();
    
    res.json({
      success: true,
      integration: 'CodeRabbit',
      status: summary.status,
      message: summary.message,
      metrics: summary.metrics,
      recentReviews: summary.recentReviews.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get CodeRabbit status'
    });
  }
});

/**
 * Get code quality metrics
 */
router.get('/metrics/:repository?', async (req: Request, res: Response) => {
  try {
    const repository = req.params.repository;
    const metrics = codeRabbitService.getCodeQualityMetrics(repository);
    
    res.json({
      success: true,
      repository: repository || 'all',
      metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

/**
 * Get reviews for a repository
 */
router.get('/reviews/:repository', async (req: Request, res: Response) => {
  try {
    const repository = req.params.repository;
    const reviews = codeRabbitService.getRepositoryReviews(repository);
    
    res.json({
      success: true,
      repository,
      reviews,
      count: reviews.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get reviews'
    });
  }
});

/**
 * Get specific review details
 */
router.get('/review/:reviewId', async (req: Request, res: Response) => {
  try {
    const reviewId = req.params.reviewId;
    const review = codeRabbitService.getReview(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }
    
    res.json({
      success: true,
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get review'
    });
  }
});

export default router;