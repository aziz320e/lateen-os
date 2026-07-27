/**
 * Real Secrets service — Secret Store, Secret Rotation, Provider
 * Credentials, and Encryption Keys, backed entirely by real AES-256-GCM
 * (see `shared/crypto.ts`). The store never retains an encryption key
 * itself — callers supply the key at write and read time, exactly like
 * a real KMS-fronted secret store.
 *
 * @module secrets/service.impl
 */
import type { SecurityEventBus } from '../events/security-event-bus.js';
import { decryptValue, encryptValue, type RandomBytesFn } from '../shared/crypto.js';
import { InvalidSecretTransitionError, SecretNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, SecretId } from '../shared/identifiers.js';
import type { SecretRepository } from './repository.js';
import type { Secret, SecretType } from './types.js';

export interface CreateSecretInput {
  readonly secretType: SecretType;
  readonly name: string;
  readonly value: string;
  readonly encryptionKey: string;
  readonly randomBytesFn?: RandomBytesFn;
}

export interface RotateSecretInput {
  readonly newValue: string;
  readonly encryptionKey: string;
  readonly randomBytesFn?: RandomBytesFn;
}

export interface SecretsService {
  createSecret(organizationId: OrganizationId, input: CreateSecretInput): Promise<Secret>;
  rotateSecret(organizationId: OrganizationId, secretId: SecretId, input: RotateSecretInput): Promise<Secret>;
  revokeSecret(organizationId: OrganizationId, secretId: SecretId): Promise<Secret>;
  /** Decrypts and returns the real plaintext value. Throws if `encryptionKey` doesn't match (real AES-GCM authentication failure). */
  getSecretValue(organizationId: OrganizationId, secretId: SecretId, encryptionKey: string): Promise<string>;
  get(organizationId: OrganizationId, secretId: SecretId): Promise<Secret | null>;
  listByType(organizationId: OrganizationId, secretType: SecretType): Promise<readonly Secret[]>;
}

/** Creates a real {@link SecretsService} backed by a {@link SecretRepository}. */
export function createSecretsService(
  repository: SecretRepository,
  eventBus?: SecurityEventBus,
  now: () => string = nowIso,
): SecretsService {
  async function requireSecret(organizationId: OrganizationId, secretId: SecretId): Promise<Secret> {
    const secret = await repository.findById(organizationId, secretId);
    if (!secret) throw new SecretNotFoundError(secretId);
    return secret;
  }

  return {
    async createSecret(organizationId, input) {
      const timestamp = now();
      const encrypted = encryptValue(input.encryptionKey, input.value, input.randomBytesFn);
      const secret: Secret = {
        id: generateId('secret'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        secretType: input.secretType,
        name: input.name,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        version: 1,
        status: 'active',
      };
      await repository.save(secret);
      return secret;
    },

    async rotateSecret(organizationId, secretId, input) {
      const secret = await requireSecret(organizationId, secretId);
      if (secret.status !== 'active') {
        throw new InvalidSecretTransitionError(secretId, secret.status, 'rotated');
      }
      const encrypted = encryptValue(input.encryptionKey, input.newValue, input.randomBytesFn);
      const updated: Secret = {
        ...secret,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        version: secret.version + 1,
        rotatedAt: now(),
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('secret.rotated', { secretId, organizationId });
      return updated;
    },

    async revokeSecret(organizationId, secretId) {
      const secret = await requireSecret(organizationId, secretId);
      if (secret.status === 'revoked') {
        throw new InvalidSecretTransitionError(secretId, secret.status, 'revoked');
      }
      const updated: Secret = { ...secret, status: 'revoked', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getSecretValue(organizationId, secretId, encryptionKey) {
      const secret = await requireSecret(organizationId, secretId);
      return decryptValue(encryptionKey, { ciphertext: secret.ciphertext, iv: secret.iv, authTag: secret.authTag });
    },

    async get(organizationId, secretId) {
      return repository.findById(organizationId, secretId);
    },

    async listByType(organizationId, secretType) {
      return repository.findByType(organizationId, secretType);
    },
  };
}
