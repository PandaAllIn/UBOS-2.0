/**
 * UBOS CodeRabbit Integration Module
 * Export all CodeRabbit integration components
 */

export { CodeRabbitService, codeRabbitService } from './coderabbitService.js';
export { default as codeRabbitWebhook } from './coderabbitWebhook.js';
export type { 
  CodeRabbitReview, 
  CodeRabbitIssue, 
  CodeRabbitSuggestion, 
  CodeRabbitWebhookPayload 
} from './coderabbitService.js';