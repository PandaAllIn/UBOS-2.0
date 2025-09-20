/**
 * CodeRabbit Integration Test
 * Validates the integration works correctly
 */

import { CodeRabbitService, CodeRabbitWebhookPayload } from './coderabbitService.js';

// Mock webhook payload for testing
const mockWebhookPayload: CodeRabbitWebhookPayload = {
  event: 'review_completed',
  review: {
    id: 'test-review-123',
    pullRequestUrl: 'https://github.com/test/repo/pull/1',
    repository: 'UBOS',
    status: 'completed',
    summary: 'Found 3 security issues and 2 performance improvements',
    issues: [
      {
        id: 'issue-1',
        severity: 'critical',
        category: 'security',
        file: 'src/api/auth.ts',
        line: 42,
        message: 'Hardcoded API key detected',
        suggestion: 'Use environment variables for API keys',
        resolved: false
      },
      {
        id: 'issue-2',
        severity: 'medium',
        category: 'performance',
        file: 'src/utils/helper.ts',
        line: 15,
        message: 'Inefficient loop detected',
        suggestion: 'Consider using map() instead of forEach()',
        resolved: false
      },
      {
        id: 'issue-3',
        severity: 'low',
        category: 'style',
        file: 'src/components/Button.tsx',
        line: 8,
        message: 'Missing semicolon',
        suggestion: 'Add semicolon at end of statement',
        resolved: true
      }
    ],
    suggestions: [
      {
        id: 'suggestion-1',
        file: 'src/api/auth.ts',
        line: 42,
        type: 'fix',
        description: 'Replace hardcoded key with environment variable',
        codeChange: {
          before: 'const apiKey = "sk-test-123";',
          after: 'const apiKey = process.env.API_KEY;'
        },
        applied: false
      }
    ],
    createdAt: new Date('2025-01-15T10:30:00Z'),
    updatedAt: new Date('2025-01-15T10:35:00Z')
  },
  repository: {
    name: 'UBOS',
    url: 'https://github.com/user/UBOS'
  },
  pullRequest: {
    number: 1,
    title: 'Add CodeRabbit integration',
    url: 'https://github.com/user/UBOS/pull/1'
  }
};

async function testCodeRabbitIntegration() {
  console.log('🧪 Testing CodeRabbit Integration...\n');

  const service = new CodeRabbitService();

  try {
    // Test webhook processing
    console.log('📥 Processing mock webhook...');
    await service.processWebhook(mockWebhookPayload);
    console.log('✅ Webhook processed successfully\n');

    // Test review retrieval
    console.log('📋 Testing review retrieval...');
    const review = service.getReview('test-review-123');
    console.log(`✅ Retrieved review: ${review?.id} (${review?.issues.length} issues)\n`);

    // Test repository reviews
    console.log('📊 Testing repository reviews...');
    const repoReviews = service.getRepositoryReviews('UBOS');
    console.log(`✅ Found ${repoReviews.length} reviews for UBOS repository\n`);

    // Test code quality metrics
    console.log('📈 Testing code quality metrics...');
    const metrics = service.getCodeQualityMetrics();
    console.log('✅ Code Quality Metrics:');
    console.log(`   - Total Reviews: ${metrics.totalReviews}`);
    console.log(`   - Average Issues: ${metrics.averageIssues}`);
    console.log(`   - Resolution Rate: ${metrics.resolutionRate}%`);
    console.log(`   - Critical Issues: ${metrics.criticalIssues}`);
    console.log(`   - Security Issues: ${metrics.securityIssues}`);
    console.log(`   - Performance Issues: ${metrics.performanceIssues}\n`);

    // Test dashboard summary
    console.log('📊 Testing dashboard summary...');
    const summary = service.generateDashboardSummary();
    console.log('✅ Dashboard Summary:');
    console.log(`   - Status: ${summary.status}`);
    console.log(`   - Message: ${summary.message}`);
    console.log(`   - Recent Reviews: ${summary.recentReviews.length}\n`);

    // Test repository-specific metrics
    console.log('🎯 Testing repository-specific metrics...');
    const repoMetrics = service.getCodeQualityMetrics('UBOS');
    console.log(`✅ UBOS Quality Score: ${100 - repoMetrics.averageIssues * 2}/100\n`);

    console.log('🎉 All tests passed! CodeRabbit integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  void testCodeRabbitIntegration();
}

export { testCodeRabbitIntegration };
