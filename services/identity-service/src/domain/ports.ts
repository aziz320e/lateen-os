import type {
  AuditEntry,
  AuthContext,
  AuthorizationRequest,
  IdentityDomainEvent,
  TokenPair,
} from './types';

export interface IdentityEventPublisher {
  publish(event: IdentityDomainEvent): Promise<void>;
}

export interface AuditLogger {
  log(entry: AuditEntry): Promise<void>;
}

export interface TokenService {
  issueAccessToken(context: AuthContext): Promise<string>;
  verifyAccessToken(token: string): Promise<AuthContext | null>;
  issueRefreshToken(): string;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

export interface RateLimiter {
  check(key: string, max: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }>;
}

export interface SessionStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
}

export interface AuthorizationProvider {
  authorize(request: AuthorizationRequest): Promise<boolean>;
  loadRolesAndPermissions(
    organizationId: string,
    subject: string,
  ): Promise<{ roles: string[]; permissions: string[] }>;
}

export interface KeycloakAdapter {
  exchangePassword(username: string, password: string): Promise<TokenPair | null>;
  exchangeCode(code: string, redirectUri: string): Promise<TokenPair | null>;
  refresh(refreshToken: string): Promise<TokenPair | null>;
  introspect(token: string): Promise<AuthContext | null>;
  logout(refreshToken: string): Promise<void>;
}

export interface BusinessDnaClient {
  getOrganizationRoles(organizationId: string): Promise<{ code: string; permissions: string[] }[]>;
  getOrganizationPolicies(organizationId: string): Promise<{ code: string; rules: unknown }[]>;
}

export interface DecisionEngineClient {
  evaluatePolicy(
    organizationId: string,
    policyCode: string,
    context: Record<string, unknown>,
  ): Promise<boolean>;
}

export { type TokenPair, type AuthContext, type AuditEntry, type IdentityDomainEvent };
