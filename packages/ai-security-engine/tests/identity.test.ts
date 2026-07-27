import { describe, expect, it } from 'vitest';
import { createIdentityRepository } from '../src/identity/repository.impl.js';
import { createIdentityService } from '../src/identity/service.impl.js';
import { InvalidIdentityTransitionError, IdentityNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createIdentityRepository();
  const service = createIdentityService(repository);
  return { repository, service };
}

describe('createIdentityService', () => {
  it('createAiIdentity() creates an active identity with no secret material', async () => {
    const { service } = setup();
    const identity = await service.createAiIdentity(ORG, { name: 'Sales Assistant AI', referenceId: 'agent-1' });
    expect(identity.identityType).toBe('ai_identity');
    expect(identity.status).toBe('active');
    expect(identity.secretHash).toBeUndefined();
  });

  it('createServiceIdentity() creates an active identity', async () => {
    const { service } = setup();
    const identity = await service.createServiceIdentity(ORG, { name: 'Billing Service', referenceId: 'employee-1' });
    expect(identity.identityType).toBe('service_identity');
    expect(identity.referenceId).toBe('employee-1');
  });

  it('createSessionIdentity() issues a real random token, storing only its hash', async () => {
    const { service } = setup();
    const { identity, secret } = await service.createSessionIdentity(ORG, { name: 'Jordan session' });
    expect(identity.identityType).toBe('session_identity');
    expect(identity.secretHash).toBeDefined();
    expect(identity.secretHash).not.toBe(secret);
  });

  it('createSessionIdentity() with a ttlMs stamps a real expiresAt', async () => {
    const { service } = setup();
    const { identity } = await service.createSessionIdentity(ORG, { name: 'Jordan session', ttlMs: 60_000 });
    expect(identity.expiresAt).toBeDefined();
    expect(new Date(identity.expiresAt!).getTime()).toBeGreaterThan(Date.now());
  });

  it('createApiKeyIdentity() issues a real random key, storing only its hash', async () => {
    const { service } = setup();
    const { identity, secret } = await service.createApiKeyIdentity(ORG, { name: 'Integration key' });
    expect(identity.identityType).toBe('api_key');
    expect(identity.secretHash).toBeDefined();
    expect(identity.secretHash).not.toBe(secret);
  });

  it('two issued secrets never collide', async () => {
    const { service } = setup();
    const first = await service.createApiKeyIdentity(ORG, { name: 'Key A' });
    const second = await service.createApiKeyIdentity(ORG, { name: 'Key B' });
    expect(first.secret).not.toBe(second.secret);
  });

  it('revoke() sets status revoked and stamps revokedAt', async () => {
    const { service } = setup();
    const identity = await service.createAiIdentity(ORG, { name: 'AI Worker' });
    const revoked = await service.revoke(ORG, identity.id);
    expect(revoked.status).toBe('revoked');
    expect(revoked.revokedAt).toBeDefined();
  });

  it('revoke() rejects an already-revoked identity', async () => {
    const { service } = setup();
    const identity = await service.createAiIdentity(ORG, { name: 'AI Worker' });
    await service.revoke(ORG, identity.id);
    await expect(service.revoke(ORG, identity.id)).rejects.toBeInstanceOf(InvalidIdentityTransitionError);
  });

  it('throws IdentityNotFoundError for an unknown identity', async () => {
    const { service } = setup();
    await expect(service.revoke(ORG, 'missing')).rejects.toBeInstanceOf(IdentityNotFoundError);
  });

  it('get() returns null for an unknown identity', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('listByType() returns every identity of a given type', async () => {
    const { service } = setup();
    await service.createAiIdentity(ORG, { name: 'AI A' });
    await service.createAiIdentity(ORG, { name: 'AI B' });
    await service.createServiceIdentity(ORG, { name: 'Service A' });

    const aiIdentities = await service.listByType(ORG, 'ai_identity');
    expect(aiIdentities).toHaveLength(2);
  });

  it('findBySecret() resolves an identity by its plaintext secret', async () => {
    const { service } = setup();
    const { identity, secret } = await service.createSessionIdentity(ORG, { name: 'Session' });
    const found = await service.findBySecret(ORG, secret);
    expect(found?.id).toBe(identity.id);
  });

  it('findBySecret() returns null for an unknown secret', async () => {
    const { service } = setup();
    expect(await service.findBySecret(ORG, 'not-a-real-secret')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const identity = await service.createAiIdentity(ORG, { name: 'AI Worker' });
    expect(await repository.findById('org-2', identity.id)).toBeNull();
  });
});
