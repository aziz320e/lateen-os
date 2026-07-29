/**
 * Real Authentication engine — API Key Registry (issue/revoke/verify)
 * and the Authentication Pipeline, composed with the real JWT
 * abstraction. API keys are generated with `crypto.randomBytes` and
 * stored only as a `crypto.createHash('sha256')` digest — the raw key
 * is returned exactly once, at issuance.
 *
 * @module authentication/engine.impl
 */
import { createHash, randomBytes } from 'node:crypto';
import type { GatewayEventBus } from '../events/gateway-event-bus.js';
import { ApiKeyNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ApiKeyId, OrganizationId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import { signToken, verifyToken, type JwtVerificationResult } from './jwt.js';
import type { ApiKeyRepository } from './repository.js';
import type { ApiKey } from './types.js';

function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

export interface IssueApiKeyInput {
  readonly name: string;
  readonly scopes?: readonly string[];
  readonly expiresAt?: ISODateTime;
}

export interface IssuedApiKey {
  readonly apiKey: ApiKey;
  /** The raw, usable key — returned only here, at issuance. It is never stored or retrievable again. */
  readonly rawKey: string;
}

export type AuthenticationPrincipal =
  | { readonly type: 'apikey'; readonly id: ApiKeyId; readonly scopes: readonly string[] }
  | { readonly type: 'jwt'; readonly payload: Record<string, unknown> };

export type AuthenticationResult =
  | { readonly authenticated: true; readonly principal: AuthenticationPrincipal }
  | { readonly authenticated: false; readonly reason: string };

export interface AuthenticateRequestInput {
  readonly apiKey?: string;
  readonly bearerToken?: string;
  readonly jwtSecret?: string;
}

export interface AuthenticationEngine {
  issueApiKey(organizationId: OrganizationId, input: IssueApiKeyInput): Promise<IssuedApiKey>;
  revokeApiKey(organizationId: OrganizationId, apiKeyId: ApiKeyId): Promise<ApiKey>;
  verifyApiKey(organizationId: OrganizationId, rawKey: string): Promise<ApiKey | null>;
  issueJwt(payload: Record<string, unknown>, secret: string, expiresInSeconds?: number): string;
  verifyJwt(token: string, secret: string): JwtVerificationResult;
  authenticateRequest(organizationId: OrganizationId, input: AuthenticateRequestInput): Promise<AuthenticationResult>;
  get(organizationId: OrganizationId, apiKeyId: ApiKeyId): Promise<ApiKey | null>;
  list(organizationId: OrganizationId): Promise<readonly ApiKey[]>;
}

/** Creates a real {@link AuthenticationEngine}. */
export function createAuthenticationEngine(
  repository: ApiKeyRepository,
  eventBus?: GatewayEventBus,
  now: () => string = nowIso,
): AuthenticationEngine {
  async function requireApiKey(organizationId: OrganizationId, apiKeyId: ApiKeyId): Promise<ApiKey> {
    const apiKey = await repository.findById(organizationId, apiKeyId);
    if (!apiKey) throw new ApiKeyNotFoundError(apiKeyId);
    return apiKey;
  }

  return {
    async issueApiKey(organizationId, input) {
      const rawKey = `lgw_${randomBytes(24).toString('base64url')}`;
      const timestamp = now();
      const apiKey: ApiKey = {
        id: generateId('gateway-apikey'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        keyHash: hashKey(rawKey),
        prefix: rawKey.slice(0, 12),
        status: 'active',
        scopes: input.scopes ?? [],
        expiresAt: input.expiresAt,
      };
      await repository.save(apiKey);
      eventBus?.publish('apikey.issued', { organizationId, apiKeyId: apiKey.id, name: apiKey.name });
      return { apiKey, rawKey };
    },

    async revokeApiKey(organizationId, apiKeyId) {
      const apiKey = await requireApiKey(organizationId, apiKeyId);
      const updated: ApiKey = { ...apiKey, status: 'revoked', updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('apikey.revoked', { organizationId, apiKeyId });
      return updated;
    },

    async verifyApiKey(organizationId, rawKey) {
      const apiKey = await repository.findByHash(organizationId, hashKey(rawKey));
      if (!apiKey) return null;
      if (apiKey.status !== 'active') return null;
      if (apiKey.expiresAt && apiKey.expiresAt <= now()) return null;
      return apiKey;
    },

    issueJwt(payload, secret, expiresInSeconds) {
      return signToken(payload, secret, { expiresInSeconds, now });
    },

    verifyJwt(token, secret) {
      return verifyToken(token, secret, { now });
    },

    async authenticateRequest(organizationId, input) {
      if (input.apiKey) {
        const apiKey = await repository.findByHash(organizationId, hashKey(input.apiKey));
        if (apiKey && apiKey.status === 'active' && !(apiKey.expiresAt && apiKey.expiresAt <= now())) {
          return { authenticated: true, principal: { type: 'apikey', id: apiKey.id, scopes: apiKey.scopes } };
        }
        return { authenticated: false, reason: 'invalid_api_key' };
      }

      if (input.bearerToken && input.jwtSecret) {
        const result = verifyToken(input.bearerToken, input.jwtSecret, { now });
        if (result.valid) {
          return { authenticated: true, principal: { type: 'jwt', payload: result.payload } };
        }
        return { authenticated: false, reason: result.reason };
      }

      return { authenticated: false, reason: 'no_credentials' };
    },

    async get(organizationId, apiKeyId) {
      return repository.findById(organizationId, apiKeyId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
