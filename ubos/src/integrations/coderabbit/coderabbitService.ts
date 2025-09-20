/**
 * UBOS CodeRabbit Integration Service
 * Provides programmatic access to CodeRabbit reviews and analysis
 */

import { agentActionLogger } from '../../masterControl/agentActionLogger.js';
import { projectRegistry } from '../../masterControl/projectRegistry.js';

export interface CodeRabbitReview {
  id: string;
  pullRequestUrl: string;
  repository: string;
  status: 'pending' | 'completed' | 'failed';
  summary: string;
  issues: CodeRabbitIssue[];
  suggestions: CodeRabbitSuggestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CodeRabbitIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'performance' | 'maintainability' | 'style' | 'bug';
  file: string;
  line: number;
  message: string;
  suggestion?: string;
  resolved: boolean;
}

export interface CodeRabbitSuggestion {
  id: string;
  file: string;
  line: number;
  type: 'fix' | 'improvement' | 'optimization';
  description: string;
  codeChange: {
    before: string;
    after: string;
  };
  applied: boolean;
}

export interface CodeRabbitWebhookPayload {
  event: 'review_completed' | 'review_updated' | 'suggestion_applied';
  review: CodeRabbitReview;
  repository: {
    name: string;
    url: string;
  };
  pullRequest: {
    number: number;
    title: string;
    url: string;
  };
}

export class CodeRabbitService {
  private reviews: Map<string, CodeRabbitReview> = new Map();
  private webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.CODERABBIT_WEBHOOK_SECRET || '';
  }

  /**
   * Process incoming CodeRabbit webhook
   */
  async processWebhook(payload: CodeRabbitWebhookPayload): Promise<void> {
    const actionId = await agentActionLogger.startWork(
      'CodeRabbitService',
      'Process webhook',
      `Processing ${payload.event} for PR #${payload.pullRequest.number}`,
      'system'
    );

    try {
      // Store review data
      this.reviews.set(payload.review.id, payload.review);

      // Log to project registry 
      const codeQualityScore = this.calculateCodeQualityScore(payload.review);
      const criticalIssues = payload.review.issues.filter(i => i.severity === 'critical' && !i.resolved).length;
      
      await projectRegistry.updateProjectMetrics(payload.repository.name, {
        healthScore: codeQualityScore,
        riskLevel: criticalIssues > 0 ? 'critical' : codeQualityScore < 70 ? 'high' : codeQualityScore < 85 ? 'medium' : 'low',
        lastUpdated: new Date().toISOString()
      });

      // Process based on event type
      switch (payload.event) {
        case 'review_completed':
          await this.handleReviewCompleted(payload);
          break;
        case 'review_updated':
          await this.handleReviewUpdated(payload);
          break;
        case 'suggestion_applied':
          await this.handleSuggestionApplied(payload);
          break;
      }

      await agentActionLogger.completeWork(
        actionId,
        `Processed ${payload.event} successfully`,
        [`review-${payload.review.id}`]
      );

    } catch (error) {
      await agentActionLogger.completeWork(
        actionId,
        `Failed to process webhook: ${error}`,
        []
      );
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  getReview(reviewId: string): CodeRabbitReview | undefined {
    return this.reviews.get(reviewId);
  }

  /**
   * Get all reviews for a repository
   */
  getRepositoryReviews(repository: string): CodeRabbitReview[] {
    return Array.from(this.reviews.values())
      .filter(review => review.repository === repository)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get code quality metrics
   */
  getCodeQualityMetrics(repository?: string): {
    totalReviews: number;
    averageIssues: number;
    resolutionRate: number;
    criticalIssues: number;
    securityIssues: number;
    performanceIssues: number;
  } {
    const reviews = repository 
      ? this.getRepositoryReviews(repository)
      : Array.from(this.reviews.values());

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageIssues: 0,
        resolutionRate: 0,
        criticalIssues: 0,
        securityIssues: 0,
        performanceIssues: 0
      };
    }

    const allIssues = reviews.flatMap(r => r.issues);
    const resolvedIssues = allIssues.filter(i => i.resolved);

    return {
      totalReviews: reviews.length,
      averageIssues: Math.round(allIssues.length / reviews.length),
      resolutionRate: Math.round((resolvedIssues.length / allIssues.length) * 100),
      criticalIssues: allIssues.filter(i => i.severity === 'critical').length,
      securityIssues: allIssues.filter(i => i.category === 'security').length,
      performanceIssues: allIssues.filter(i => i.category === 'performance').length
    };
  }

  /**
   * Generate UBOS Dashboard summary
   */
  generateDashboardSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    metrics: {
      totalReviews: number;
      averageIssues: number;
      resolutionRate: number;
      criticalIssues: number;
      securityIssues: number;
      performanceIssues: number;
    };
    recentReviews: CodeRabbitReview[];
  } {
    const metrics = this.getCodeQualityMetrics();
    const recentReviews = Array.from(this.reviews.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let message = 'Code quality is excellent';

    if (metrics.criticalIssues > 0) {
      status = 'critical';
      message = `${metrics.criticalIssues} critical issues require immediate attention`;
    } else if (metrics.resolutionRate < 80) {
      status = 'warning'; 
      message = `Code review resolution rate is ${metrics.resolutionRate}% - needs improvement`;
    } else if (metrics.securityIssues > 5) {
      status = 'warning';
      message = `${metrics.securityIssues} security issues detected`;
    }

    return {
      status,
      message,
      metrics,
      recentReviews
    };
  }

  private async handleReviewCompleted(payload: CodeRabbitWebhookPayload): Promise<void> {
    // Integration with UBOS notification system
    console.log(`📋 CodeRabbit review completed for PR #${payload.pullRequest.number}`);
    console.log(`📊 Found ${payload.review.issues.length} issues`);
    
    // Critical issues notification
    const criticalIssues = payload.review.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      console.log(`🚨 CRITICAL: ${criticalIssues.length} critical issues found!`);
    }
  }

  private async handleReviewUpdated(payload: CodeRabbitWebhookPayload): Promise<void> {
    console.log(`🔄 CodeRabbit review updated for PR #${payload.pullRequest.number}`);
  }

  private async handleSuggestionApplied(payload: CodeRabbitWebhookPayload): Promise<void> {
    console.log(`✅ CodeRabbit suggestion applied for PR #${payload.pullRequest.number}`);
  }

  private calculateCodeQualityScore(review: CodeRabbitReview): number {
    const { issues } = review;
    if (issues.length === 0) return 100;

    const weights: Record<string, number> = { critical: 10, high: 5, medium: 2, low: 1 };
    const totalWeight = issues.reduce((sum: number, issue) => sum + (weights[issue.severity] || 0), 0);
    const maxPossibleScore = 100;
    
    return Math.max(0, maxPossibleScore - totalWeight);
  }
}

// Singleton instance for UBOS
export const codeRabbitService = new CodeRabbitService();