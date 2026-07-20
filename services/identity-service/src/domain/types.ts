export const IDENTITY_EVENT_NAMES = {
  UserLoggedIn: 'UserLoggedIn',
  UserLoggedOut: 'UserLoggedOut',
  SessionExpired: 'SessionExpired',
  ApiKeyCreated: 'ApiKeyCreated',
  PermissionGranted: 'PermissionGranted',
  PermissionRevoked: 'PermissionRevoked',
} as const;

export type IdentityEventName = (typeof IDENTITY_EVENT_NAMES)[keyof typeof IDENTITY_EVENT_NAMES];

export interface IdentityDomainEvent {
  readonly eventId: string;
  readonly eventName: IdentityEventName;
  readonly occurredAt: string;
  readonly organizationId?: string;
  readonly payload: Record<string, unknown>;
}

export interface AuthContext {
  readonly subject: string;
  readonly subjectType: 'user' | 'service_account' | 'api_key';
  readonly organizationId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly sessionId?: string;
}

export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: 'Bearer';
}

export interface LoginRequest {
  readonly organizationId: string;
  readonly username: string;
  readonly password: string;
  readonly rememberMe?: boolean;
  readonly deviceId?: string;
  readonly deviceName?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface RefreshRequest {
  readonly refreshToken: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface CreateApiKeyRequest {
  readonly organizationId: string;
  readonly name: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
  readonly expiresAt?: Date;
  readonly actorSubject: string;
}

export interface CreateServiceAccountRequest {
  readonly organizationId: string;
  readonly name: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
  readonly actorSubject: string;
}

export interface AuthorizationRequest {
  readonly organizationId: string;
  readonly resource: string;
  readonly action: string;
  readonly subject: string;
}

export interface PasswordPolicy {
  readonly minLength: number;
  readonly requireUppercase: boolean;
  readonly requireLowercase: boolean;
  readonly requireDigit: boolean;
  readonly requireSpecial: boolean;
}

export interface SecretRotationContract {
  readonly secretType: 'jwt' | 'api_key' | 'service_account' | 'keycloak_client';
  readonly currentVersion: number;
  readonly rotateBefore: string;
  readonly rotationProcedure: string;
}

export interface AuditEntry {
  readonly organizationId?: string;
  readonly actorSubject: string;
  readonly action: string;
  readonly resource: string;
  readonly resourceId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly outcome: 'success' | 'failure';
  readonly metadata?: Record<string, unknown>;
}
