import { describe, expect, it, vi } from 'vitest';
import { createSecretRepository } from '../src/secrets/repository.impl.js';
import { createSecretsService } from '../src/secrets/service.impl.js';
import { generateEncryptionKey } from '../src/shared/crypto.js';
import { createSecurityEventBus } from '../src/events/security-event-bus.js';
import { InvalidSecretTransitionError, SecretNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createSecurityEventBus()) {
  const repository = createSecretRepository();
  const service = createSecretsService(repository, eventBus);
  return { repository, service, eventBus };
}

describe('createSecretsService', () => {
  it('createSecret() encrypts the value — never stores plaintext', async () => {
    const { service } = setup();
    const key = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'generic', name: 'api-token', value: 'plaintext-value', encryptionKey: key });
    expect(secret.status).toBe('active');
    expect(secret.version).toBe(1);
    expect(JSON.stringify(secret)).not.toContain('plaintext-value');
  });

  it('supports all 3 deterministic secret types', async () => {
    const { service } = setup();
    const key = generateEncryptionKey();
    const types = ['generic', 'provider_credential', 'encryption_key'] as const;
    for (const secretType of types) {
      const secret = await service.createSecret(ORG, { secretType, name: `secret-${secretType}`, value: 'v', encryptionKey: key });
      expect(secret.secretType).toBe(secretType);
    }
  });

  it('getSecretValue() decrypts the real plaintext with the correct key', async () => {
    const { service } = setup();
    const key = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'provider_credential', name: 'openai-key', value: 'sk-real-value', encryptionKey: key });
    expect(await service.getSecretValue(ORG, secret.id, key)).toBe('sk-real-value');
  });

  it('getSecretValue() throws with the wrong key (real AES-GCM authentication failure)', async () => {
    const { service } = setup();
    const key = generateEncryptionKey();
    const wrongKey = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'generic', name: 's', value: 'v', encryptionKey: key });
    await expect(service.getSecretValue(ORG, secret.id, wrongKey)).rejects.toThrow();
  });

  it('rotateSecret() re-encrypts, increments version, and stamps rotatedAt', async () => {
    const { service } = setup();
    const key = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'generic', name: 's', value: 'v1', encryptionKey: key });
    const rotated = await service.rotateSecret(ORG, secret.id, { newValue: 'v2', encryptionKey: key });
    expect(rotated.version).toBe(2);
    expect(rotated.rotatedAt).toBeDefined();
    expect(await service.getSecretValue(ORG, secret.id, key)).toBe('v2');
  });

  it('rotateSecret() can rotate under a new encryption key', async () => {
    const { service } = setup();
    const oldKey = generateEncryptionKey();
    const newKey = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'generic', name: 's', value: 'v1', encryptionKey: oldKey });
    await service.rotateSecret(ORG, secret.id, { newValue: 'v2', encryptionKey: newKey });
    expect(await service.getSecretValue(ORG, secret.id, newKey)).toBe('v2');
  });

  it('rotateSecret() rejects a revoked secret', async () => {
    const { service } = setup();
    const key = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'generic', name: 's', value: 'v', encryptionKey: key });
    await service.revokeSecret(ORG, secret.id);
    await expect(service.rotateSecret(ORG, secret.id, { newValue: 'v2', encryptionKey: key })).rejects.toBeInstanceOf(InvalidSecretTransitionError);
  });

  it('revokeSecret() sets status revoked', async () => {
    const { service } = setup();
    const key = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'generic', name: 's', value: 'v', encryptionKey: key });
    const revoked = await service.revokeSecret(ORG, secret.id);
    expect(revoked.status).toBe('revoked');
  });

  it('revokeSecret() rejects an already-revoked secret', async () => {
    const { service } = setup();
    const key = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'generic', name: 's', value: 'v', encryptionKey: key });
    await service.revokeSecret(ORG, secret.id);
    await expect(service.revokeSecret(ORG, secret.id)).rejects.toBeInstanceOf(InvalidSecretTransitionError);
  });

  it('throws SecretNotFoundError for an unknown secret', async () => {
    const { service } = setup();
    await expect(service.revokeSecret(ORG, 'missing')).rejects.toBeInstanceOf(SecretNotFoundError);
  });

  it('get() returns null for an unknown secret', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('listByType() returns every secret of a given type', async () => {
    const { service } = setup();
    const key = generateEncryptionKey();
    await service.createSecret(ORG, { secretType: 'generic', name: 'a', value: 'v', encryptionKey: key });
    await service.createSecret(ORG, { secretType: 'generic', name: 'b', value: 'v', encryptionKey: key });
    await service.createSecret(ORG, { secretType: 'encryption_key', name: 'c', value: 'v', encryptionKey: key });

    const generics = await service.listByType(ORG, 'generic');
    expect(generics).toHaveLength(2);
  });

  it('publishes secret.rotated', async () => {
    const eventBus = createSecurityEventBus();
    const rotated = vi.fn();
    eventBus.subscribe('secret.rotated', rotated);
    const { service } = setup(eventBus);
    const key = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'generic', name: 's', value: 'v', encryptionKey: key });
    await service.rotateSecret(ORG, secret.id, { newValue: 'v2', encryptionKey: key });
    await Promise.resolve();
    expect(rotated).toHaveBeenCalledTimes(1);
  });

  it('does not publish secret.rotated on create', async () => {
    const eventBus = createSecurityEventBus();
    const rotated = vi.fn();
    eventBus.subscribe('secret.rotated', rotated);
    const { service } = setup(eventBus);
    const key = generateEncryptionKey();
    await service.createSecret(ORG, { secretType: 'generic', name: 's', value: 'v', encryptionKey: key });
    await Promise.resolve();
    expect(rotated).not.toHaveBeenCalled();
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const key = generateEncryptionKey();
    const secret = await service.createSecret(ORG, { secretType: 'generic', name: 's', value: 'v', encryptionKey: key });
    expect(await repository.findById('org-2', secret.id)).toBeNull();
  });
});
