/**
 * Real Identity service — AI Identity, Service Identity, Session
 * Identity, and API Keys. Session tokens and API keys are real,
 * cryptographically random secrets (see `shared/crypto.ts`); only their
 * SHA-256 hash is ever persisted, and the plaintext secret is returned
 * to the caller exactly once, at creation time.
 *
 * @module identity/service.impl
 */
import { generateRandomToken, hashValue, type RandomBytesFn } from '../shared/crypto.js';
import { generateId, nowIso } from '../shared/id.js';
import { IdentityNotFoundError, InvalidIdentityTransitionError } from '../shared/errors.js';
import type { IdentityId, OrganizationId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { IdentityRepository } from './repository.js';
import type { Identity } from './types.js';

export interface CreatePrincipalInput {
  readonly name: string;
  readonly referenceId?: string;
}

export interface CreateSecretIdentityInput {
  readonly name: string;
  readonly ttlMs?: number;
  readonly randomBytesFn?: RandomBytesFn;
}

export interface IssuedSecretIdentity {
  readonly identity: Identity;
  /** The real plaintext secret — returned exactly once. Only its hash is ever stored. */
  readonly secret: string;
}

export interface IdentityService {
  createAiIdentity(organizationId: OrganizationId, input: CreatePrincipalInput): Promise<Identity>;
  createServiceIdentity(organizationId: OrganizationId, input: CreatePrincipalInput): Promise<Identity>;
  createSessionIdentity(organizationId: OrganizationId, input: CreateSecretIdentityInput): Promise<IssuedSecretIdentity>;
  createApiKeyIdentity(organizationId: OrganizationId, input: CreateSecretIdentityInput): Promise<IssuedSecretIdentity>;
  revoke(organizationId: OrganizationId, identityId: IdentityId): Promise<Identity>;
  get(organizationId: OrganizationId, identityId: IdentityId): Promise<Identity | null>;
  listByType(organizationId: OrganizationId, identityType: Identity['identityType']): Promise<readonly Identity[]>;
  /** Finds the identity matching a given plaintext secret's hash, if any (used by Authentication). */
  findBySecret(organizationId: OrganizationId, secret: string): Promise<Identity | null>;
}

/** Creates a real {@link IdentityService} backed by an {@link IdentityRepository}. */
export function createIdentityService(repository: IdentityRepository, now: () => string = nowIso): IdentityService {
  async function requireIdentity(organizationId: OrganizationId, identityId: IdentityId): Promise<Identity> {
    const identity = await repository.findById(organizationId, identityId);
    if (!identity) throw new IdentityNotFoundError(identityId);
    return identity;
  }

  async function issueSecretIdentity(
    organizationId: OrganizationId,
    identityType: 'session_identity' | 'api_key',
    input: CreateSecretIdentityInput,
  ): Promise<IssuedSecretIdentity> {
    const timestamp = now();
    const secret = generateRandomToken(32, input.randomBytesFn);
    const expiresAt: ISODateTime | undefined = input.ttlMs !== undefined ? new Date(new Date(timestamp).getTime() + input.ttlMs).toISOString() : undefined;
    const identity: Identity = {
      id: generateId('identity'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      identityType,
      name: input.name,
      status: 'active',
      secretHash: hashValue(secret),
      expiresAt,
    };
    await repository.save(identity);
    return { identity, secret };
  }

  return {
    async createAiIdentity(organizationId, input) {
      const timestamp = now();
      const identity: Identity = {
        id: generateId('identity'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        identityType: 'ai_identity',
        name: input.name,
        status: 'active',
        referenceId: input.referenceId,
      };
      await repository.save(identity);
      return identity;
    },

    async createServiceIdentity(organizationId, input) {
      const timestamp = now();
      const identity: Identity = {
        id: generateId('identity'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        identityType: 'service_identity',
        name: input.name,
        status: 'active',
        referenceId: input.referenceId,
      };
      await repository.save(identity);
      return identity;
    },

    async createSessionIdentity(organizationId, input) {
      return issueSecretIdentity(organizationId, 'session_identity', input);
    },

    async createApiKeyIdentity(organizationId, input) {
      return issueSecretIdentity(organizationId, 'api_key', input);
    },

    async revoke(organizationId, identityId) {
      const identity = await requireIdentity(organizationId, identityId);
      if (identity.status === 'revoked') {
        throw new InvalidIdentityTransitionError(identityId, identity.status, 'revoked');
      }
      const updated: Identity = { ...identity, status: 'revoked', revokedAt: now(), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, identityId) {
      return repository.findById(organizationId, identityId);
    },

    async listByType(organizationId, identityType) {
      return repository.findByType(organizationId, identityType);
    },

    async findBySecret(organizationId, secret) {
      return repository.findBySecretHash(organizationId, hashValue(secret));
    },
  };
}
