# Security Implementation Patterns

## Overview

Comprehensive security framework for AI-assisted development environments, covering environment variable security, permission validation, audit logging, secret scanning, and vulnerability assessment. These patterns ensure secure operation while maintaining development productivity.

## Environment Variable Security and Secret Management

### Secure Credential Management Framework

Critical security scenarios in AI-assisted development include:
- **Environment Variable Harvesting**: Malicious code attempting to access system environment variables
- **Configuration File Creation**: AI-generated code inadvertently exposing secrets in configuration files
- **Prompt Injection**: Malicious prompts designed to extract sensitive information

### Implementation Strategy

```typescript
interface SecureConfig {
  apiKey: string;
  dbPassword: string;
  encryptionKey: string;
}

class SecretManager {
  private static readonly SECURE_PREFIXES = ['SECURE_', 'SECRET_', 'PRIVATE_'];
  private static readonly AI_CONTEXT_MARKER = 'AI_GENERATED';
  
  private static validateSecretAccess(context: string): boolean {
    // Implement context-based secret access validation
    return !context.includes(this.AI_CONTEXT_MARKER) || this.hasExplicitPermission(context);
  }
  
  public static getSecret(key: string, context: string): string | null {
    if (!this.validateSecretAccess(context)) {
      this.logSecurityEvent('unauthorized_secret_access', { key, context });
      throw new SecurityError('Unauthorized secret access attempt');
    }
    
    const value = process.env[key];
    if (value && this.isSecureKey(key)) {
      this.logSecretAccess(key, context);
    }
    
    return value || null;
  }
  
  private static isSecureKey(key: string): boolean {
    return this.SECURE_PREFIXES.some(prefix => key.startsWith(prefix));
  }
  
  private static hasExplicitPermission(context: string): boolean {
    // Implement permission checking logic
    return context.includes('EXPLICIT_APPROVAL') || context.includes('HUMAN_AUTHORIZED');
  }
}
```

### Environment Hygiene Practices

```bash
# .env.secure - Template for secure environment variables
# Never include in version control
SECURE_API_KEY=${SECURE_API_KEY}
SECRET_DB_PASSWORD=${SECRET_DB_PASSWORD}
PRIVATE_ENCRYPTION_KEY=${PRIVATE_ENCRYPTION_KEY}

# .env.template - Safe template for sharing
API_KEY=your_api_key_here
DB_PASSWORD=your_db_password_here
ENCRYPTION_KEY=your_encryption_key_here
```

### Secret Rotation Implementation

```typescript
class SecretRotationManager {
  private rotationSchedule: Map<string, Date> = new Map();
  private rotationPolicies: Map<string, RotationPolicy> = new Map();
  
  public scheduleRotation(secretKey: string, policy: RotationPolicy): void {
    const nextRotation = this.calculateNextRotation(policy);
    this.rotationSchedule.set(secretKey, nextRotation);
    this.rotationPolicies.set(secretKey, policy);
  }
  
  public async rotateSecret(secretKey: string): Promise<void> {
    const policy = this.rotationPolicies.get(secretKey);
    if (!policy) {
      throw new Error(`No rotation policy found for ${secretKey}`);
    }
    
    const newSecret = await this.generateNewSecret(policy);
    const oldSecret = await this.getSecret(secretKey);
    
    // Update secret in all required locations
    await this.updateSecretInVault(secretKey, newSecret);
    await this.updateSecretInEnvironment(secretKey, newSecret);
    
    // Verify rotation success
    await this.verifySecretRotation(secretKey, oldSecret, newSecret);
    
    // Schedule next rotation
    this.scheduleRotation(secretKey, policy);
  }
}
```

## Permission Validation Frameworks and RBAC Implementation

### Role-Based Access Control System

```typescript
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface AIContext {
  sessionId: string;
  userRole: string;
  hasHumanApproval: boolean;
  isReadOnlyOperation: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

class RBACValidator {
  private static readonly ROLE_PERMISSIONS: Record<string, Permission[]> = {
    'developer': [
      { resource: 'code', action: 'read' },
      { resource: 'code', action: 'write', conditions: { requires_review: true } },
      { resource: 'tests', action: 'read' },
      { resource: 'tests', action: 'write' }
    ],
    'senior_developer': [
      { resource: 'code', action: 'read' },
      { resource: 'code', action: 'write' },
      { resource: 'code', action: 'delete', conditions: { requires_approval: true } },
      { resource: 'deployment', action: 'read' },
      { resource: 'secrets', action: 'read', conditions: { non_production_only: true } }
    ],
    'admin': [
      { resource: '*', action: '*' }
    ]
  };
  
  public static validateAccess(
    userRole: string, 
    requestedPermission: Permission,
    context: AIContext
  ): boolean {
    const allowedPermissions = this.getRolePermissions(userRole);
    const hasPermission = allowedPermissions.some(p => 
      this.matchesPermission(p, requestedPermission)
    );
    
    if (!hasPermission) {
      return false;
    }
    
    // Additional validation for AI context
    return this.validateAIContext(context, requestedPermission);
  }
  
  private static validateAIContext(context: AIContext, permission: Permission): boolean {
    // High-risk operations require human approval
    if (context.riskLevel === 'HIGH' && !context.hasHumanApproval) {
      return false;
    }
    
    // Write operations require explicit permission for AI
    if (permission.action === 'write' || permission.action === 'delete') {
      return context.hasHumanApproval || context.isReadOnlyOperation === false;
    }
    
    return true;
  }
  
  private static matchesPermission(allowed: Permission, requested: Permission): boolean {
    const resourceMatch = allowed.resource === '*' || allowed.resource === requested.resource;
    const actionMatch = allowed.action === '*' || allowed.action === requested.action;
    
    if (!resourceMatch || !actionMatch) {
      return false;
    }
    
    // Check conditions if present
    if (allowed.conditions) {
      return this.validateConditions(allowed.conditions, requested);
    }
    
    return true;
  }
}
```

### Dynamic Permission Evaluation

```typescript
class DynamicPermissionEvaluator {
  private contextEvaluators: Map<string, (context: any) => boolean> = new Map();
  
  constructor() {
    this.registerEvaluators();
  }
  
  private registerEvaluators(): void {
    this.contextEvaluators.set('time_based', (context) => {
      const now = new Date();
      const businessHours = context.businessHours || { start: 9, end: 17 };
      const currentHour = now.getHours();
      return currentHour >= businessHours.start && currentHour <= businessHours.end;
    });
    
    this.contextEvaluators.set('location_based', (context) => {
      const allowedLocations = context.allowedLocations || [];
      return allowedLocations.includes(context.userLocation);
    });
    
    this.contextEvaluators.set('risk_assessment', (context) => {
      const riskScore = this.calculateRiskScore(context);
      const maxAllowedRisk = context.maxRiskLevel || 5;
      return riskScore <= maxAllowedRisk;
    });
  }
  
  public evaluatePermission(permission: Permission, context: any): boolean {
    if (!permission.conditions) {
      return true;
    }
    
    for (const [condition, value] of Object.entries(permission.conditions)) {
      const evaluator = this.contextEvaluators.get(condition);
      if (evaluator && !evaluator({ ...context, conditionValue: value })) {
        return false;
      }
    }
    
    return true;
  }
}
```

## Audit Logging Architecture and Compliance Features

### Comprehensive Audit System

```typescript
interface AuditEvent {
  timestamp: Date;
  userId: string;
  sessionId: string;
  action: string;
  resource: string;
  aiAssisted: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  context: Record<string, any>;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  ipAddress?: string;
  userAgent?: string;
}

class SecurityAuditor {
  private auditSinks: AuditSink[] = [];
  private complianceRules: ComplianceRule[] = [];
  
  public static logSecurityEvent(event: AuditEvent): void {
    // Enhanced logging for AI-assisted operations
    const enhancedEvent = {
      ...event,
      eventId: this.generateEventId(),
      aiContext: this.extractAIContext(event),
      complianceMarkers: this.getComplianceMarkers(event),
      riskAnalysis: this.analyzeRisk(event)
    };
    
    // Write to multiple audit sinks
    this.writeToAuditLog(enhancedEvent);
    this.writeToComplianceLog(enhancedEvent);
    this.writeToSecuritySIEM(enhancedEvent);
    
    // Real-time alerting for high-risk events
    if (enhancedEvent.riskLevel === 'HIGH') {
      this.triggerSecurityAlert(enhancedEvent);
    }
  }
  
  private static extractAIContext(event: AuditEvent): AIAuditContext {
    return {
      aiModelUsed: event.context.modelName || 'unknown',
      promptHash: event.context.promptHash,
      responseTokens: event.context.responseTokens,
      contextSize: event.context.contextSize,
      confidenceScore: event.context.confidenceScore
    };
  }
  
  private static analyzeRisk(event: AuditEvent): RiskAnalysis {
    let riskScore = 1; // Base risk
    
    // AI-assisted operations have inherent risk
    if (event.aiAssisted) {
      riskScore += 2;
    }
    
    // High-privilege operations increase risk
    if (event.action.includes('delete') || event.action.includes('admin')) {
      riskScore += 3;
    }
    
    // Out-of-hours operations increase risk
    const hour = event.timestamp.getHours();
    if (hour < 8 || hour > 18) {
      riskScore += 1;
    }
    
    return {
      score: riskScore,
      level: riskScore <= 3 ? 'LOW' : riskScore <= 6 ? 'MEDIUM' : 'HIGH',
      factors: this.getRiskFactors(event, riskScore)
    };
  }
}
```

### Compliance Framework

```typescript
interface ComplianceRule {
  id: string;
  regulation: 'SOX' | 'GDPR' | 'HIPAA' | 'PCI_DSS';
  requirement: string;
  evaluator: (event: AuditEvent) => ComplianceResult;
}

class ComplianceManager {
  private rules: ComplianceRule[] = [
    {
      id: 'SOX_001',
      regulation: 'SOX',
      requirement: 'Financial code changes require approval',
      evaluator: (event) => this.evaluateFinancialCodeChanges(event)
    },
    {
      id: 'GDPR_001', 
      regulation: 'GDPR',
      requirement: 'Personal data access logging',
      evaluator: (event) => this.evaluatePersonalDataAccess(event)
    }
  ];
  
  public evaluateCompliance(event: AuditEvent): ComplianceResult[] {
    return this.rules.map(rule => {
      const result = rule.evaluator(event);
      return {
        ruleId: rule.id,
        regulation: rule.regulation,
        compliant: result.compliant,
        violations: result.violations,
        remediationRequired: result.remediationRequired
      };
    });
  }
  
  private evaluateFinancialCodeChanges(event: AuditEvent): ComplianceResult {
    const isFinancialCode = event.resource.includes('financial') || 
                           event.resource.includes('payment') ||
                           event.context.tags?.includes('financial');
    
    if (isFinancialCode && event.action === 'write') {
      const hasApproval = event.context.hasApproval || false;
      return {
        compliant: hasApproval,
        violations: hasApproval ? [] : ['Financial code change without approval'],
        remediationRequired: !hasApproval
      };
    }
    
    return { compliant: true, violations: [], remediationRequired: false };
  }
}
```

## Secret Scanning Algorithms and Pattern Detection

### Advanced Pattern Detection

```typescript
class SecretScanner {
  private patterns: Map<string, RegExp> = new Map([
    ['aws_access_key', /AKIA[0-9A-Z]{16}/],
    ['aws_secret_key', /[0-9a-zA-Z/+]{40}/],
    ['github_token', /ghp_[0-9a-zA-Z]{36}/],
    ['slack_token', /xox[baprs]-([0-9a-zA-Z]{10,48})?/],
    ['jwt_token', /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/],
    ['private_key', /-----BEGIN[A-Z ]+PRIVATE KEY-----/],
    ['database_url', /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]+@[^\s]+/],
    ['api_key_generic', /[aA][pP][iI][_\-]?[kK][eE][yY]\s*[:=]\s*['"][^'"]+['"]/]
  ]);
  
  private entropyThreshold = 4.5; // Minimum entropy for potential secrets
  
  public scanContent(content: string, context: ScanContext): ScanResult[] {
    const results: ScanResult[] = [];
    
    // Pattern-based detection
    for (const [secretType, pattern] of this.patterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          results.push({
            type: secretType,
            value: match,
            confidence: this.calculateConfidence(match, secretType),
            location: this.findLocation(content, match),
            severity: this.assessSeverity(secretType)
          });
        });
      }
    }
    
    // Entropy-based detection
    const entropyResults = this.scanByEntropy(content);
    results.push(...entropyResults);
    
    // Context-aware filtering
    return this.filterResults(results, context);
  }
  
  private scanByEntropy(content: string): ScanResult[] {
    const results: ScanResult[] = [];
    const words = content.split(/\s+/);
    
    for (const word of words) {
      if (word.length > 12 && this.calculateEntropy(word) > this.entropyThreshold) {
        const isLikelySecret = this.isLikelySecret(word);
        if (isLikelySecret) {
          results.push({
            type: 'high_entropy_string',
            value: word,
            confidence: this.calculateEntropyConfidence(word),
            location: this.findLocation(content, word),
            severity: 'MEDIUM'
          });
        }
      }
    }
    
    return results;
  }
  
  private calculateEntropy(str: string): number {
    const freq = new Map<string, number>();
    for (const char of str) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }
    
    let entropy = 0;
    for (const count of freq.values()) {
      const probability = count / str.length;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }
  
  private isLikelySecret(value: string): boolean {
    // Heuristics to reduce false positives
    const hasNumbers = /\d/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(value);
    
    const complexity = [hasNumbers, hasUppercase, hasLowercase, hasSpecialChars]
                      .filter(Boolean).length;
    
    return complexity >= 3 && !this.isCommonWord(value);
  }
}
```

### Real-Time Scanning Integration

```typescript
class RealTimeSecretMonitor {
  private scanner = new SecretScanner();
  private alertThreshold = 'MEDIUM';
  
  public monitorCodeGeneration(code: string, context: GenerationContext): void {
    const scanResults = this.scanner.scanContent(code, {
      source: 'ai_generated',
      userId: context.userId,
      sessionId: context.sessionId
    });
    
    const highRiskSecrets = scanResults.filter(result => 
      this.getSeverityLevel(result.severity) >= this.getSeverityLevel(this.alertThreshold)
    );
    
    if (highRiskSecrets.length > 0) {
      this.handleSecretDetection(highRiskSecrets, context);
    }
  }
  
  private handleSecretDetection(secrets: ScanResult[], context: GenerationContext): void {
    // Immediate response
    this.quarantineCode(secrets, context);
    
    // Alert security team
    this.sendSecurityAlert(secrets, context);
    
    // Log incident
    this.logSecurityIncident(secrets, context);
    
    // Provide remediation guidance
    this.provideRemediation(secrets, context);
  }
  
  private quarantineCode(secrets: ScanResult[], context: GenerationContext): void {
    // Mark code as requiring review
    context.requiresSecurityReview = true;
    context.quarantineReason = `Potential secrets detected: ${secrets.map(s => s.type).join(', ')}`;
    
    // Prevent automatic deployment
    context.blockDeployment = true;
  }
}
```

## Secure Communication Protocols and Encryption

### End-to-End Encryption for AI Communications

```typescript
class SecureCommunicationManager {
  private encryptionKey: CryptoKey;
  private signingKey: CryptoKey;
  
  public async encryptMessage(message: string, recipientPublicKey: CryptoKey): Promise<EncryptedMessage> {
    // Generate session key
    const sessionKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Encrypt message with session key
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      sessionKey,
      data
    );
    
    // Encrypt session key with recipient's public key
    const exportedSessionKey = await crypto.subtle.exportKey('raw', sessionKey);
    const encryptedSessionKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      recipientPublicKey,
      exportedSessionKey
    );
    
    // Sign the message
    const signature = await this.signMessage(encryptedData);
    
    return {
      encryptedData: Array.from(new Uint8Array(encryptedData)),
      encryptedSessionKey: Array.from(new Uint8Array(encryptedSessionKey)),
      iv: Array.from(iv),
      signature: Array.from(new Uint8Array(signature))
    };
  }
  
  public async decryptMessage(encryptedMessage: EncryptedMessage, privateKey: CryptoKey): Promise<string> {
    // Verify signature
    const isValid = await this.verifySignature(
      new Uint8Array(encryptedMessage.encryptedData),
      new Uint8Array(encryptedMessage.signature)
    );
    
    if (!isValid) {
      throw new Error('Message signature verification failed');
    }
    
    // Decrypt session key
    const decryptedSessionKey = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      new Uint8Array(encryptedMessage.encryptedSessionKey)
    );
    
    // Import session key
    const sessionKey = await crypto.subtle.importKey(
      'raw',
      decryptedSessionKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt message
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(encryptedMessage.iv) },
      sessionKey,
      new Uint8Array(encryptedMessage.encryptedData)
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }
}
```

## Security Monitoring and Alerting Systems

### Real-Time Security Dashboard

```typescript
class SecurityMonitoringSystem {
  private metrics: SecurityMetrics = new SecurityMetrics();
  private alerting: AlertingSystem = new AlertingSystem();
  private dashboard: SecurityDashboard = new SecurityDashboard();
  
  public async monitorSecurityEvents(): Promise<void> {
    setInterval(async () => {
      const currentMetrics = await this.collectMetrics();
      const threats = await this.analyzeThreatLandscape(currentMetrics);
      
      await this.updateDashboard(currentMetrics, threats);
      await this.processAlerts(threats);
    }, 10000); // Every 10 seconds
  }
  
  private async analyzeThreatLandscape(metrics: SecurityMetrics): Promise<ThreatAnalysis[]> {
    const threats: ThreatAnalysis[] = [];
    
    // Analyze authentication anomalies
    if (metrics.failedAuthAttempts > 10) {
      threats.push({
        type: 'authentication_anomaly',
        severity: 'HIGH',
        description: `${metrics.failedAuthAttempts} failed authentication attempts in last 10 minutes`,
        recommendation: 'Consider implementing account lockouts'
      });
    }
    
    // Analyze unusual AI usage patterns
    if (metrics.aiTokenUsage > metrics.averageTokenUsage * 3) {
      threats.push({
        type: 'unusual_ai_usage',
        severity: 'MEDIUM',
        description: 'Token usage 3x higher than normal',
        recommendation: 'Review AI session logs for unusual activity'
      });
    }
    
    // Analyze secret detection patterns
    if (metrics.secretsDetected > 0) {
      threats.push({
        type: 'secret_exposure',
        severity: 'HIGH', 
        description: `${metrics.secretsDetected} potential secrets detected`,
        recommendation: 'Immediate review and rotation required'
      });
    }
    
    return threats;
  }
  
  private async processAlerts(threats: ThreatAnalysis[]): Promise<void> {
    for (const threat of threats) {
      if (threat.severity === 'HIGH') {
        await this.alerting.sendImmediateAlert(threat);
      } else if (threat.severity === 'MEDIUM') {
        await this.alerting.queueAlert(threat);
      }
    }
  }
}
```

## Vulnerability Assessment and Mitigation Strategies

### Automated Vulnerability Scanning

```typescript
class VulnerabilityAssessment {
  private scanners: VulnerabilityScanner[] = [];
  private riskMatrix: RiskMatrix = new RiskMatrix();
  
  public async performComprehensiveAssessment(target: AssessmentTarget): Promise<AssessmentReport> {
    const vulnerabilities: Vulnerability[] = [];
    
    // Code vulnerability scanning
    const codeVulns = await this.scanCodeVulnerabilities(target.codebase);
    vulnerabilities.push(...codeVulns);
    
    // Dependency vulnerability scanning
    const depVulns = await this.scanDependencyVulnerabilities(target.dependencies);
    vulnerabilities.push(...depVulns);
    
    // Configuration vulnerability scanning
    const configVulns = await this.scanConfigurationVulnerabilities(target.configuration);
    vulnerabilities.push(...configVulns);
    
    // AI-specific vulnerability scanning
    const aiVulns = await this.scanAIVulnerabilities(target.aiComponents);
    vulnerabilities.push(...aiVulns);
    
    return this.generateAssessmentReport(vulnerabilities);
  }
  
  private async scanAIVulnerabilities(aiComponents: AIComponent[]): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];
    
    for (const component of aiComponents) {
      // Check for prompt injection vulnerabilities
      if (this.isVulnerableToPromptInjection(component)) {
        vulnerabilities.push({
          type: 'prompt_injection',
          severity: 'HIGH',
          component: component.name,
          description: 'Component may be vulnerable to prompt injection attacks',
          mitigation: 'Implement input sanitization and validation'
        });
      }
      
      // Check for context poisoning vulnerabilities
      if (this.isVulnerableToContextPoisoning(component)) {
        vulnerabilities.push({
          type: 'context_poisoning',
          severity: 'MEDIUM',
          component: component.name,
          description: 'Component may be vulnerable to context poisoning',
          mitigation: 'Implement context validation and filtering'
        });
      }
    }
    
    return vulnerabilities;
  }
  
  public async generateMitigationPlan(vulnerabilities: Vulnerability[]): Promise<MitigationPlan> {
    const plan: MitigationPlan = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };
    
    for (const vuln of vulnerabilities) {
      const priority = this.calculatePriority(vuln);
      const timeframe = this.determineTimeframe(priority);
      
      const action: MitigationAction = {
        vulnerability: vuln,
        action: vuln.mitigation,
        priority,
        estimatedEffort: this.estimateEffort(vuln),
        dependencies: this.identifyDependencies(vuln)
      };
      
      plan[timeframe].push(action);
    }
    
    return plan;
  }
}
```

## Implementation Checklist

### Security Setup Checklist

1. **Environment Security**
   - [ ] Configure secure secret management
   - [ ] Implement secret rotation policies
   - [ ] Set up environment variable validation
   - [ ] Deploy secret scanning in CI/CD pipeline

2. **Access Control**
   - [ ] Define role-based permissions
   - [ ] Implement AI context validation
   - [ ] Configure dynamic permission evaluation
   - [ ] Set up access logging

3. **Audit and Compliance**
   - [ ] Deploy comprehensive audit logging
   - [ ] Configure compliance rule evaluation
   - [ ] Set up real-time monitoring
   - [ ] Implement alert escalation

4. **Communication Security**
   - [ ] Enable end-to-end encryption
   - [ ] Configure secure key management
   - [ ] Implement message signing/verification
   - [ ] Set up secure channels

5. **Vulnerability Management**
   - [ ] Deploy automated scanning
   - [ ] Configure vulnerability detection
   - [ ] Set up mitigation workflows
   - [ ] Implement continuous assessment

### Security Validation

- [ ] Test secret detection accuracy
- [ ] Verify access control enforcement
- [ ] Validate audit log completeness
- [ ] Test incident response procedures
- [ ] Verify encryption implementation

---

*Generated by UBOS Research & Documentation Agent*
*Security Implementation Patterns v1.0*