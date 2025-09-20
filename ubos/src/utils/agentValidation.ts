// Context7-guided: Enhanced Agent Validation System (Spec Phase 3)
import { AgentRunOptions, AgentContext, AgentFeature, BaseAgent } from '../agents/premium/baseAgent.js';
import { AgentResult } from '../orchestrator/types.js';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidatedAgentOptions extends AgentRunOptions {
  _validated: boolean; // Marker for validated options
  timestamp: string;
}

/**
 * Context7-Powered Agent Validation System
 * Implements Spec Phase 3 Requirements for Type Safety
 */
export class AgentValidationSystem {
  /**
   * Enhanced validation with Context7 patterns (Spec Section 3.2)
   */
  static validateAgentOptions(options: AgentRunOptions, context?: AgentContext): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    // Enhanced userId validation
    if (!options?.userId?.trim()) {
      result.warnings.push('userId missing; defaulting to "system" context');
      options.userId = 'system';
    }

    // Input validation
    if (!options?.input?.trim()) {
      result.isValid = false;
      result.errors.push('Invalid input format: must be non-empty string');
    }

    // Context validation if provided
    if (context && !isValidContext(context as Record<string, unknown>)) {
      result.isValid = false;
      result.errors.push('Invalid context structure');
    }

    return result;
  }

  /**
   * Validate AgentFeature objects
   */
  static validateAgentFeature(feature: AgentFeature): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    if (!feature?.type?.trim()) {
      result.isValid = false;
      result.errors.push('AgentFeature type is required and must be non-empty');
    }

    if (!Array.isArray(feature.capabilities) || feature.capabilities.length === 0) {
      result.isValid = false;
      result.errors.push('AgentFeature capabilities must be non-empty array');
    }

    return result;
  }

  /**
   * Validate BaseAgent implementation compliance
   */
  static validateBaseAgentImplementation(agent: BaseAgent): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    if (!agent.id?.trim()) {
      result.isValid = false;
      result.errors.push('BaseAgent id is required');
    }

    if (!agent.requirementId?.trim()) {
      result.isValid = false;
      result.errors.push('BaseAgent requirementId is required');
    }

    if (typeof agent.feature !== 'object') {
      result.isValid = false;
      result.errors.push('BaseAgent feature must be AgentFeature object');
    } else {
      const featureResult = this.validateAgentFeature(agent.feature);
      if (!featureResult.isValid) {
        result.isValid = false;
        result.errors.push(...featureResult.errors.map(e => `Feature: ${e}`));
      }
    }

    if (typeof agent.run !== 'function') {
      result.isValid = false;
      result.errors.push('BaseAgent must implement run method');
    }

    return result;
  }

  /**
   * Comprehensive agent system validation
   */
  static validateAgentSystem(agents: BaseAgent[]): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    for (const agent of agents) {
      const agentValidation = this.validateBaseAgentImplementation(agent);
      if (!agentValidation.isValid) {
        result.isValid = false;
        result.errors.push(`Agent ${agent.id}: ${agentValidation.errors.join(', ')}`);
      }
    }

    return result;
  }
}

// Enhanced context validation function (Spec Section 3.1)
export function isValidContext(context: Record<string, unknown>): boolean {
  if (typeof context !== 'object' || context === null) {
    return false;
  }

  try {
    JSON.stringify(context);
    return true;
  } catch {
    return false; // Not serializable
  }
}

/**
 * Comprehensive Agent System Health Check
 * Implements Spec Acceptance Criteria Verification
 */
export class AgentSystemHealthCheck {
  static async performFullValidation(agentSystem: {
    agents: BaseAgent[];
    validationOptions?: { strictMode?: boolean };
  }): Promise<{
    healthy: boolean;
    summary: string;
    details: {
      agentCount: number;
      validations: ValidationResult[];
      performance?: any;
    };
  }> {
    const { agents, validationOptions = {} } = agentSystem;
    const { strictMode = false } = validationOptions;

    let healthy = true;
    const details: any = { agentCount: agents.length, validations: [] };

    // Core validation
    for (const agent of agents) {
      const validation = AgentValidationSystem.validateBaseAgentImplementation(agent);
      details.validations.push(validation);

      if (!validation.isValid && strictMode) {
        healthy = false;
      }
    }

    // Cross-agent validation
    const systemValidation = AgentValidationSystem.validateAgentSystem(agents);
    details.validations.push(systemValidation);

    if (!systemValidation.isValid && strictMode) {
      healthy = false;
    }

    const summary = `Agent System Health: ${healthy ? '🟢 HEALTHY' : '🔴 ISSUES DETECTED'} (${agents.length} agents)`;

    return { healthy, summary, details };
  }
}
