import type { JWTPayload } from 'jose';

export type AuthType = 'api-key' | 'oidc' | 'none';

export interface AuthContext {
  type: AuthType;
  // API key context
  apiKeyId?: string;
  apiKeyPrefix?: string;
  apiKeyName?: string;
  apiKeyScopes?: string[];
  // OIDC context
  userId?: string;
  subject?: string;
  email?: string;
  scopes?: string[];
  claims?: JWTPayload;
}

export interface RequestContext {
  correlationId: string;
  tenantId?: string;
  envId?: string;
  auth: AuthContext;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  correlationId: string;
}

// Utility to build consistent error responses
export function errorBody(error: string, message: string, correlationId: string): ApiErrorBody {
  return { error, message, correlationId };
}

