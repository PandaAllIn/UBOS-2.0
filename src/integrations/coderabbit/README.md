# 🤖 UBOS CodeRabbit Integration

Enterprise-grade CodeRabbit integration for automated code quality monitoring and continuous improvement.

## 🚀 Features

- **Webhook Processing**: Automatic handling of CodeRabbit review events
- **Quality Metrics**: Real-time code quality scoring and analytics
- **Dashboard Integration**: Visual monitoring through UBOS Mission Control
- **Multi-Repository Support**: Track quality across all UBOS projects
- **Issue Categorization**: Security, performance, maintainability tracking
- **Suggestion Management**: Track and apply CodeRabbit recommendations

## 🔧 Setup Instructions

### 1. Environment Configuration

Add to your `.env` file:
```bash
CODERABBIT_WEBHOOK_SECRET=your_webhook_secret_here
CODERABBIT_API_TOKEN=your_api_token_here
```

### 2. GitHub Integration

Your repository already has CodeRabbit configured via `.coderabbit.yaml`. The integration will:
- ✅ Automatically review pull requests
- ✅ Send webhook events to UBOS dashboard
- ✅ Track code quality metrics

### 3. Webhook Configuration

**Webhook URL**: `https://your-domain.com/api/coderabbit/webhook`

**Events to Subscribe**:
- `review_completed` - When CodeRabbit finishes analyzing a PR
- `review_updated` - When review status changes
- `suggestion_applied` - When AI suggestions are implemented

### 4. Dashboard Access

**Endpoints Available**:
```
GET  /api/coderabbit/status          - Integration status
GET  /api/coderabbit/metrics         - Overall code quality metrics  
GET  /api/coderabbit/metrics/:repo   - Repository-specific metrics
GET  /api/coderabbit/reviews/:repo   - Get reviews for repository
GET  /api/coderabbit/review/:id      - Get specific review details
POST /api/coderabbit/webhook         - Webhook handler (internal)
```

## 📊 Dashboard Integration

### Code Quality Metrics

The integration provides comprehensive metrics:

```typescript
{
  totalReviews: number;        // Total reviews processed
  averageIssues: number;       // Average issues per review
  resolutionRate: number;      // % of issues resolved
  criticalIssues: number;      // High-priority security issues
  securityIssues: number;      // Security-related findings
  performanceIssues: number;   // Performance optimizations
}
```

### Status Monitoring

```typescript
{
  status: 'healthy' | 'warning' | 'critical';
  message: string;             // Human-readable status
  metrics: CodeQualityMetrics;
  recentReviews: CodeRabbitReview[];
}
```

## 🔗 Integration Examples

### Access from UBOS Dashboard

```javascript
// Get current code quality status
const response = await fetch('/api/coderabbit/status');
const status = await response.json();

console.log(`Code Quality: ${status.status}`);
console.log(`Message: ${status.message}`);
console.log(`Resolution Rate: ${status.metrics.resolutionRate}%`);
```

### Repository-Specific Metrics

```javascript
// Get metrics for specific repository
const response = await fetch('/api/coderabbit/metrics/UBOS');
const metrics = await response.json();

console.log(`UBOS Project Health: ${metrics.averageIssues} avg issues`);
```

## 🎯 Use Cases in UBOS

### 1. **Mission Control Dashboard**
- Real-time code quality monitoring
- Alert system for critical issues
- Trend analysis across projects

### 2. **Agent Marketplace Quality**
- Ensure marketplace agents meet quality standards
- Automatic quality scoring for new agents
- Performance optimization tracking

### 3. **Client Project Monitoring**
- Track code quality for client deliverables
- Ensure €6M+ track record standards are maintained
- Automated quality reporting

### 4. **DevOps Integration**
- Pre-deployment quality gates
- Continuous integration quality checks
- Automated code improvement workflows

## 📈 Quality Scoring Algorithm

Our integration uses a sophisticated scoring system:

```typescript
// Score calculation (0-100)
const weights = { 
  critical: 10,   // Critical issues heavily penalize score
  high: 5,        // High severity issues  
  medium: 2,      // Medium priority issues
  low: 1          // Minor style/formatting issues
};

score = 100 - (total_weighted_issues);
```

### Quality Thresholds:
- **90-100**: Excellent (Green) 🟢
- **75-89**: Good (Yellow) 🟡  
- **60-74**: Warning (Orange) 🟠
- **0-59**: Critical (Red) 🔴

## 🔄 Workflow Integration

### Automatic Processing:
1. **Developer** pushes code → GitHub
2. **CodeRabbit** analyzes changes → generates review
3. **Webhook** sends event → UBOS Dashboard
4. **Integration** processes → updates metrics
5. **Dashboard** displays → real-time status

### Manual Actions:
- View detailed reviews in UBOS interface
- Apply CodeRabbit suggestions with one-click
- Generate quality reports for stakeholders
- Track improvement trends over time

## 🛡️ Security & Compliance

- **Webhook Signature Verification**: All webhooks cryptographically verified
- **Data Privacy**: No source code stored, only metadata and metrics
- **GDPR Compliance**: Data retention and deletion policies respected  
- **Audit Trail**: All quality changes logged via `agentActionLogger`

## 🚀 Getting Started

1. **Verify Setup**: Check that `.coderabbit.yaml` exists in repo root
2. **Start Dashboard**: `npm run dev:dashboard`
3. **Create Test PR**: Make a code change and open PR
4. **Monitor Dashboard**: Visit `http://localhost:3001/api/coderabbit/status`
5. **View Metrics**: Check quality scores and improvement trends

## 🔧 Troubleshooting

### Common Issues:

**Webhook Not Receiving Events**:
- Verify webhook URL is publicly accessible
- Check `CODERABBIT_WEBHOOK_SECRET` environment variable
- Ensure CodeRabbit has webhook permissions

**Quality Scores Not Updating**:
- Verify webhook signature verification
- Check dashboard logs for processing errors
- Confirm repository name matching

**Integration Status "Critical"**:
- Review recent critical/security issues
- Check resolution rates and trends
- Apply pending CodeRabbit suggestions

## 💡 Advanced Features

### Custom Quality Rules:
Extend the integration with project-specific quality rules and thresholds.

### Slack/Discord Notifications:
Real-time alerts for critical code quality issues.

### Quality Report Generation:
Automated weekly/monthly quality reports for stakeholders.

---

**🌟 This integration maintains UBOS's proven €6M+ track record by ensuring enterprise-grade code quality across all projects.**