# Claude-Modular Framework - Quick Reference

## Key Commands

### Core Development Commands
```bash
@analyze     # Comprehensive codebase analysis
@code        # Implementation with progressive context
@debug       # Issue investigation and resolution
@refactor    # Code improvement and optimization
@test        # Automated testing generation
@review      # Code quality assessment
@optimize    # Performance enhancement
@deploy      # Deployment preparation and validation
```

### Token Optimization Commands
```bash
@batch       # Batch process multiple operations
@compress    # Context compression and optimization
@prune       # Dynamic context pruning
@monitor     # Token usage analytics
```

### Security Commands
```bash
@secure      # Security pattern implementation
@scan        # Secret and vulnerability scanning
@audit       # Security audit and compliance
@encrypt     # Secure communication setup
```

## Core Concepts

### Progressive Disclosure
- **Level 1**: Basic context and high-level overview
- **Level 2**: Detailed structure and implementation details  
- **Level 3**: Complete codebase with full context
- **Escalation**: Automatic based on task complexity

### Token Optimization
- **50-80% savings** compared to monolithic approaches
- **Dynamic context loading** based on task requirements
- **Intelligent batching** for related operations
- **Real-time monitoring** and optimization suggestions

### Command Structure
```xml
<instructions>
  <context>When and why to use this command</context>
  <requirements>Prerequisites and dependencies</requirements>
  <execution>Step-by-step implementation</execution>
  <validation>Quality checks and acceptance criteria</validation>
  <examples>Concrete usage examples</examples>
</instructions>
```

### Configuration Layers
- **Base settings**: Default framework configuration
- **Environment overrides**: Development/production customization
- **User preferences**: Personal optimization settings
- **Project specific**: Custom project requirements

## Common Tasks

### Quick Project Setup
```bash
# 1. Initialize framework
claude-modular init

# 2. Configure environment
cp .env.template .env
# Edit .env with your settings

# 3. Install dependencies
npm install

# 4. Run initial analysis
@analyze codebase structure and optimization opportunities
```

### Development Workflow
```bash
# 1. Analyze requirements
@analyze user authentication requirements

# 2. Implement feature
@code JWT authentication middleware with security best practices

# 3. Generate tests
@test authentication middleware with edge cases

# 4. Review implementation
@review authentication code for security and performance

# 5. Optimize
@optimize token usage and performance metrics
```

### Token Optimization Workflow
```bash
# 1. Monitor current usage
@monitor token usage patterns

# 2. Identify optimization opportunities
@analyze context usage efficiency

# 3. Apply optimizations
@compress context using progressive disclosure

# 4. Validate improvements
@measure token reduction and response quality
```

### Security Implementation
```bash
# 1. Security assessment
@scan codebase for vulnerabilities and secrets

# 2. Implement security patterns
@secure environment variables and access control

# 3. Audit implementation
@audit security compliance and logging

# 4. Monitor security
@monitor security events and anomalies
```

## Configuration Examples

### Basic Configuration
```json
{
  "defaults": {
    "max_tokens_per_session": 50000,
    "progressive_disclosure": true,
    "context_pruning_threshold": 0.8
  },
  "optimization": {
    "dynamic_model_selection": true,
    "caching_enabled": true,
    "token_monitoring": true
  }
}
```

### Security Configuration
```json
{
  "security": {
    "require_env_vars": true,
    "audit_logging": true,
    "permission_validation": true,
    "secret_scanning": true,
    "encryption_required": true
  },
  "compliance": {
    "regulations": ["SOX", "GDPR"],
    "audit_retention_days": 365,
    "alert_threshold": "MEDIUM"
  }
}
```

### Performance Configuration
```json
{
  "performance": {
    "batch_processing_size": 10,
    "context_cache_size": 1000,
    "optimization_level": "aggressive",
    "monitoring_interval": 10000
  }
}
```

## Troubleshooting

### High Token Usage
**Symptoms**: Token consumption exceeding expected limits
**Solutions**:
- Enable progressive disclosure: `"progressive_disclosure": true`
- Reduce context levels: `"context_pruning_threshold": 0.6`
- Use batch processing: `@batch process related operations`
- Monitor usage patterns: `@monitor token usage analytics`

### Poor Response Quality
**Symptoms**: AI responses lacking context or accuracy
**Solutions**:
- Increase context levels: `"context_pruning_threshold": 0.9`
- Provide more examples in commands
- Use explicit requirements in command structure
- Check context loading configuration

### Security Alerts
**Symptoms**: High-risk security events or violations
**Solutions**:
- Review audit logs: `@audit recent security events`
- Check secret scanning: `@scan for potential secrets`
- Validate permissions: Review RBAC configuration
- Rotate secrets if compromised

### Performance Issues
**Symptoms**: Slow response times or timeout errors
**Solutions**:
- Enable caching: `"caching_enabled": true`
- Optimize batch size: Adjust `batch_processing_size`
- Check resource allocation
- Monitor system metrics

### Configuration Errors
**Symptoms**: Framework initialization failures
**Solutions**:
- Validate JSON syntax in configuration files
- Check environment variable availability
- Verify file permissions
- Review dependency installations

## Performance Metrics

### Expected Results
| Metric | Target | Measurement |
|--------|---------|-------------|
| Token Reduction | 50-80% | Compare to baseline |
| Setup Time | <30 seconds | Project initialization |
| Response Quality | >90% | User satisfaction |
| Session Duration | 3-5x longer | Extended productivity |

### Monitoring Commands
```bash
@monitor usage patterns              # Real-time token usage
@analyze efficiency metrics         # Performance analysis
@report optimization opportunities   # Improvement suggestions
@validate configuration health       # System status check
```

## Integration Patterns

### CI/CD Integration
```yaml
# .github/workflows/claude-modular.yml
name: Claude-Modular CI
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Secret Scanning
        run: claude-modular scan --secrets
      - name: Security Audit
        run: claude-modular audit --compliance
```

### Docker Integration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN claude-modular init --production
EXPOSE 3000
CMD ["claude-modular", "start"]
```

### Environment Setup
```bash
# Development environment
export CLAUDE_MODULAR_ENV=development
export TOKEN_LIMIT=100000
export DEBUG_MODE=true

# Production environment  
export CLAUDE_MODULAR_ENV=production
export TOKEN_LIMIT=50000
export SECURITY_LEVEL=high
export AUDIT_ENABLED=true
```

## Best Practices Summary

### Development
- Start with progressive disclosure level 1
- Use batch processing for related operations
- Implement comprehensive error handling
- Follow security-first design principles

### Optimization
- Monitor token usage continuously
- Apply context pruning strategically
- Use caching for frequently accessed data
- Implement real-time performance monitoring

### Security
- Scan for secrets before commits
- Enable comprehensive audit logging
- Implement proper access controls
- Regular security assessments

### Maintenance
- Keep framework updated
- Review optimization metrics regularly
- Update security configurations
- Monitor compliance requirements

---

*Quick Reference Guide - Claude-Modular Framework v1.0*
*Generated by UBOS Research & Documentation Agent*