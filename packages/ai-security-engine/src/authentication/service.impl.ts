/**
 * Real Authentication service — Token validation, Session validation,
 * and API Key validation, composing the real Identity service (never
 * a repository from another module) and recording every attempt to the
 * shared Audit service.
 *
 * @module authentication/service.impl
 */
import type { SecurityEventBus } from '../events/security-event-bus.js';
import type { AuditService } from '../audit/index.js';
import type { Identity, IdentityService } from '../identity/index.js';
import { nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';

export interface AuthenticationService {
  /** Validates any secret-bearing identity (session or API key) by its plaintext token. */
  validateToken(organizationId: OrganizationId, token: string): Promise<Identity | null>;
  /** Validates specifically a `session_identity`. */
  validateSession(organizationId: OrganizationId, token: string): Promise<Identity | null>;
  /** Validates specifically an `api_key` identity. */
  validateApiKey(organizationId: OrganizationId, key: string): Promise<Identity | null>;
}

/** Creates a real {@link AuthenticationService} over the Identity service and the shared Audit service. */
export function createAuthenticationService(
  identity: Pick<IdentityService, 'findBySecret'>,
  audit?: Pick<AuditService, 'record'>,
  eventBus?: SecurityEventBus,
  now: () => string = nowIso,
): AuthenticationService {
  async function validate(
    organizationId: OrganizationId,
    secret: string,
    expectedType: 'session_identity' | 'api_key' | undefined,
    action: string,
  ): Promise<Identity | null> {
    const found = await identity.findBySecret(organizationId, secret);

    const isValid =
      found !== null &&
      found.status === 'active' &&
      (expectedType === undefined || found.identityType === expectedType) &&
      (found.expiresAt === undefined || found.expiresAt > now());

    if (isValid) {
      await audit?.record(organizationId, { category: 'authentication', action, actorId: found!.id, outcome: 'success' });
      return found;
    }

    const reason = !found ? 'not_found' : found.status !== 'active' ? `status_${found.status}` : found.expiresAt !== undefined && found.expiresAt <= now() ? 'expired' : 'type_mismatch';
    await audit?.record(organizationId, { category: 'authentication', action, actorId: found?.id, outcome: 'failure', details: { reason } });
    eventBus?.publish('authentication.failed', { organizationId, reason });
    return null;
  }

  return {
    async validateToken(organizationId, token) {
      return validate(organizationId, token, undefined, 'validate_token');
    },
    async validateSession(organizationId, token) {
      return validate(organizationId, token, 'session_identity', 'validate_session');
    },
    async validateApiKey(organizationId, key) {
      return validate(organizationId, key, 'api_key', 'validate_api_key');
    },
  };
}
