import { describe, expect, it, vi } from 'vitest';
import { createIdentityRepository } from '../src/identity/repository.impl.js';
import { createIdentityService } from '../src/identity/service.impl.js';
import { createAuthenticationService } from '../src/authentication/service.impl.js';
import { createAuditEventRepository } from '../src/audit/repository.impl.js';
import { createAuditService } from '../src/audit/service.impl.js';
import { createSecurityEventBus } from '../src/events/security-event-bus.js';

const ORG = 'org-1';

function setup(eventBus = createSecurityEventBus()) {
  const identityRepository = createIdentityRepository();
  const identity = createIdentityService(identityRepository);
  const auditRepository = createAuditEventRepository();
  const audit = createAuditService(auditRepository, eventBus);
  const authentication = createAuthenticationService(identity, audit, eventBus);
  return { identity, audit, authentication, eventBus };
}

describe('createAuthenticationService', () => {
  it('validateToken() accepts a real, active session token', async () => {
    const { identity, authentication } = setup();
    const { secret } = await identity.createSessionIdentity(ORG, { name: 'Session' });
    const validated = await authentication.validateToken(ORG, secret);
    expect(validated).not.toBeNull();
  });

  it('validateToken() accepts a real, active API key', async () => {
    const { identity, authentication } = setup();
    const { secret: key } = await identity.createApiKeyIdentity(ORG, { name: 'Key' });
    const validated = await authentication.validateToken(ORG, key);
    expect(validated).not.toBeNull();
  });

  it('validateToken() rejects an unknown token', async () => {
    const { authentication } = setup();
    expect(await authentication.validateToken(ORG, 'not-a-real-token')).toBeNull();
  });

  it('validateToken() rejects a revoked identity', async () => {
    const { identity, authentication } = setup();
    const { identity: issued, secret } = await identity.createSessionIdentity(ORG, { name: 'Session' });
    await identity.revoke(ORG, issued.id);
    expect(await authentication.validateToken(ORG, secret)).toBeNull();
  });

  it('validateToken() rejects an expired session', async () => {
    const { identity, authentication } = setup();
    const { secret } = await identity.createSessionIdentity(ORG, { name: 'Session', ttlMs: -1000 });
    expect(await authentication.validateToken(ORG, secret)).toBeNull();
  });

  it('validateSession() only accepts session_identity secrets', async () => {
    const { identity, authentication } = setup();
    const { secret: key } = await identity.createApiKeyIdentity(ORG, { name: 'Key' });
    expect(await authentication.validateSession(ORG, key)).toBeNull();
  });

  it('validateSession() accepts a real session token', async () => {
    const { identity, authentication } = setup();
    const { secret } = await identity.createSessionIdentity(ORG, { name: 'Session' });
    expect(await authentication.validateSession(ORG, secret)).not.toBeNull();
  });

  it('validateApiKey() only accepts api_key secrets', async () => {
    const { identity, authentication } = setup();
    const { secret } = await identity.createSessionIdentity(ORG, { name: 'Session' });
    expect(await authentication.validateApiKey(ORG, secret)).toBeNull();
  });

  it('validateApiKey() accepts a real API key', async () => {
    const { identity, authentication } = setup();
    const { secret: key } = await identity.createApiKeyIdentity(ORG, { name: 'Key' });
    expect(await authentication.validateApiKey(ORG, key)).not.toBeNull();
  });

  it('publishes authentication.failed on invalid validation', async () => {
    const eventBus = createSecurityEventBus();
    const failed = vi.fn();
    eventBus.subscribe('authentication.failed', failed);
    const { authentication } = setup(eventBus);
    await authentication.validateToken(ORG, 'not-a-real-token');
    await Promise.resolve();
    expect(failed).toHaveBeenCalledTimes(1);
  });

  it('does not publish authentication.failed on a valid validation', async () => {
    const eventBus = createSecurityEventBus();
    const failed = vi.fn();
    eventBus.subscribe('authentication.failed', failed);
    const { identity, authentication } = setup(eventBus);
    const { secret } = await identity.createSessionIdentity(ORG, { name: 'Session' });
    await authentication.validateToken(ORG, secret);
    await Promise.resolve();
    expect(failed).not.toHaveBeenCalled();
  });

  it('records a success entry in the shared audit service', async () => {
    const { identity, audit, authentication } = setup();
    const { secret } = await identity.createSessionIdentity(ORG, { name: 'Session' });
    await authentication.validateToken(ORG, secret);
    const events = await audit.findByCategory(ORG, 'authentication');
    expect(events.some((event) => event.outcome === 'success')).toBe(true);
  });

  it('records a failure entry with a reason in the shared audit service', async () => {
    const { audit, authentication } = setup();
    await authentication.validateToken(ORG, 'not-a-real-token');
    const events = await audit.findByCategory(ORG, 'authentication');
    const failure = events.find((event) => event.outcome === 'failure');
    expect(failure?.details?.reason).toBe('not_found');
  });

  it('is organization-scoped', async () => {
    const { identity, authentication } = setup();
    const { secret } = await identity.createSessionIdentity(ORG, { name: 'Session' });
    expect(await authentication.validateToken('org-2', secret)).toBeNull();
  });
});
