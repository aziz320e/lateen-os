import { describe, expect, it } from 'vitest';
import { createAuthenticationEngine } from '../src/authentication/engine.impl.js';
import { signToken, verifyToken } from '../src/authentication/jwt.js';
import { createApiKeyRepository } from '../src/authentication/repository.impl.js';
import { createGatewayEventBus } from '../src/events/index.js';
import { ApiKeyNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createGatewayEventBus();
  const engine = createAuthenticationEngine(createApiKeyRepository(), eventBus);
  return { engine, eventBus };
}

describe('JWT abstraction — signToken/verifyToken', () => {
  it('signs and verifies a valid token', () => {
    const token = signToken({ sub: 'user-1' }, 'secret');
    const result = verifyToken(token, 'secret');
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.payload['sub']).toBe('user-1');
  });

  it('token has the standard three-segment JWT shape', () => {
    const token = signToken({ sub: 'user-1' }, 'secret');
    expect(token.split('.')).toHaveLength(3);
  });

  it('stamps a real iat claim', () => {
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const token = signToken({ sub: 'user-1' }, 'secret', { now: fixedNow });
    const result = verifyToken(token, 'secret', { now: fixedNow });
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.payload['iat']).toBe(Math.floor(new Date(fixedNow()).getTime() / 1000));
  });

  it('rejects a token signed with a different secret', () => {
    const token = signToken({ sub: 'user-1' }, 'secret-a');
    const result = verifyToken(token, 'secret-b');
    expect(result).toEqual({ valid: false, reason: 'invalid_signature' });
  });

  it('rejects a malformed token', () => {
    expect(verifyToken('not-a-jwt', 'secret')).toEqual({ valid: false, reason: 'malformed' });
  });

  it('rejects a tampered payload', () => {
    const token = signToken({ sub: 'user-1' }, 'secret');
    const [header, , signature] = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'attacker' })).toString('base64url');
    const tampered = `${header}.${tamperedPayload}.${signature}`;
    expect(verifyToken(tampered, 'secret').valid).toBe(false);
  });

  it('respects expiresInSeconds and expires deterministically', () => {
    const issuedAt = () => '2026-01-01T00:00:00.000Z';
    const token = signToken({ sub: 'user-1' }, 'secret', { expiresInSeconds: 60, now: issuedAt });

    const beforeExpiry = () => '2026-01-01T00:00:59.000Z';
    expect(verifyToken(token, 'secret', { now: beforeExpiry }).valid).toBe(true);

    const afterExpiry = () => '2026-01-01T00:01:00.000Z';
    expect(verifyToken(token, 'secret', { now: afterExpiry })).toEqual({ valid: false, reason: 'expired' });
  });

  it('a token with no expiresInSeconds never expires', () => {
    const token = signToken({ sub: 'user-1' }, 'secret', { now: () => '2026-01-01T00:00:00.000Z' });
    expect(verifyToken(token, 'secret', { now: () => '2030-01-01T00:00:00.000Z' }).valid).toBe(true);
  });
});

describe('AuthenticationEngine — API Key Registry', () => {
  it('issueApiKey() returns the raw key exactly once and never stores it', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key' });
    expect(issued.rawKey).toMatch(/^lgw_/);
    expect(issued.apiKey.keyHash).not.toBe(issued.rawKey);
  });

  it('publishes apikey.issued', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('apikey.issued', (payload) => (seen = payload));
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key' });
    expect(seen).toEqual({ organizationId: ORG, apiKeyId: issued.apiKey.id, name: 'CI Key' });
  });

  it('verifyApiKey() succeeds for a freshly issued key', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key' });
    const verified = await engine.verifyApiKey(ORG, issued.rawKey);
    expect(verified?.id).toBe(issued.apiKey.id);
  });

  it('verifyApiKey() returns null for an unknown raw key', async () => {
    const { engine } = setup();
    expect(await engine.verifyApiKey(ORG, 'lgw_totally-made-up')).toBeNull();
  });

  it('revokeApiKey() publishes apikey.revoked and verifyApiKey() then fails', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('apikey.revoked', (payload) => (seen = payload));
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key' });
    await engine.revokeApiKey(ORG, issued.apiKey.id);
    expect(seen).toEqual({ organizationId: ORG, apiKeyId: issued.apiKey.id });
    expect(await engine.verifyApiKey(ORG, issued.rawKey)).toBeNull();
  });

  it('revokeApiKey() throws ApiKeyNotFoundError for an unknown key', async () => {
    const { engine } = setup();
    await expect(engine.revokeApiKey(ORG, 'missing')).rejects.toBeInstanceOf(ApiKeyNotFoundError);
  });

  it('issueApiKey() accepts scopes and an expiresAt', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'Scoped Key', scopes: ['read', 'write'], expiresAt: '2027-01-01T00:00:00.000Z' });
    expect(issued.apiKey.scopes).toEqual(['read', 'write']);
    expect(issued.apiKey.expiresAt).toBe('2027-01-01T00:00:00.000Z');
  });

  it('verifyApiKey() returns null for an expired key', async () => {
    const fixedNow = () => '2027-06-01T00:00:00.000Z';
    const engine = createAuthenticationEngine(createApiKeyRepository(), undefined, fixedNow);
    const issued = await engine.issueApiKey(ORG, { name: 'Expiring Key', expiresAt: '2027-01-01T00:00:00.000Z' });
    expect(await engine.verifyApiKey(ORG, issued.rawKey)).toBeNull();
  });

  it('two issued keys never collide in hash', async () => {
    const { engine } = setup();
    const first = await engine.issueApiKey(ORG, { name: 'A' });
    const second = await engine.issueApiKey(ORG, { name: 'B' });
    expect(first.apiKey.keyHash).not.toBe(second.apiKey.keyHash);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const issued = await engine.issueApiKey(ORG, { name: 'A' });
    expect(await engine.get(ORG, issued.apiKey.id)).toEqual(issued.apiKey);
    expect(await engine.list(ORG)).toHaveLength(1);
  });
});

describe('AuthenticationEngine — issueJwt/verifyJwt wrappers', () => {
  it('issueJwt() and verifyJwt() round-trip through the engine', async () => {
    const { engine } = setup();
    const token = engine.issueJwt({ sub: 'user-1' }, 'secret', 3600);
    const result = engine.verifyJwt(token, 'secret');
    expect(result.valid).toBe(true);
  });
});

describe('AuthenticationEngine — authenticateRequest pipeline', () => {
  it('authenticates via a valid API key', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key', scopes: ['read'] });
    const result = await engine.authenticateRequest(ORG, { apiKey: issued.rawKey });
    expect(result).toEqual({ authenticated: true, principal: { type: 'apikey', id: issued.apiKey.id, scopes: ['read'] } });
  });

  it('rejects an invalid API key', async () => {
    const { engine } = setup();
    const result = await engine.authenticateRequest(ORG, { apiKey: 'lgw_invalid' });
    expect(result).toEqual({ authenticated: false, reason: 'invalid_api_key' });
  });

  it('authenticates via a valid bearer token', async () => {
    const { engine } = setup();
    const token = engine.issueJwt({ sub: 'user-1' }, 'secret');
    const result = await engine.authenticateRequest(ORG, { bearerToken: token, jwtSecret: 'secret' });
    expect(result.authenticated).toBe(true);
  });

  it('rejects an invalid bearer token', async () => {
    const { engine } = setup();
    const result = await engine.authenticateRequest(ORG, { bearerToken: 'not-a-jwt', jwtSecret: 'secret' });
    expect(result).toEqual({ authenticated: false, reason: 'malformed' });
  });

  it('prioritizes apiKey over bearerToken when both are given', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key' });
    const result = await engine.authenticateRequest(ORG, { apiKey: issued.rawKey, bearerToken: 'ignored', jwtSecret: 'secret' });
    expect(result.authenticated).toBe(true);
    if (result.authenticated) expect(result.principal.type).toBe('apikey');
  });

  it('rejects when no credentials are given at all', async () => {
    const { engine } = setup();
    const result = await engine.authenticateRequest(ORG, {});
    expect(result).toEqual({ authenticated: false, reason: 'no_credentials' });
  });

  it('rejects a bearerToken without a jwtSecret', async () => {
    const { engine } = setup();
    const result = await engine.authenticateRequest(ORG, { bearerToken: 'anything' });
    expect(result).toEqual({ authenticated: false, reason: 'no_credentials' });
  });

  it('rejects a revoked API key', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key' });
    await engine.revokeApiKey(ORG, issued.apiKey.id);
    const result = await engine.authenticateRequest(ORG, { apiKey: issued.rawKey });
    expect(result).toEqual({ authenticated: false, reason: 'invalid_api_key' });
  });

  it('rejects a bearer token signed with a different secret than the one supplied', async () => {
    const { engine } = setup();
    const token = engine.issueJwt({ sub: 'user-1' }, 'secret-a');
    const result = await engine.authenticateRequest(ORG, { bearerToken: token, jwtSecret: 'secret-b' });
    expect(result).toEqual({ authenticated: false, reason: 'invalid_signature' });
  });

  it('issueApiKey() defaults scopes to an empty array when none are given', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key' });
    expect(issued.apiKey.scopes).toEqual([]);
  });

  it('a JWT principal carries through the full decoded payload', async () => {
    const { engine } = setup();
    const token = engine.issueJwt({ sub: 'user-1', role: 'admin' }, 'secret');
    const result = await engine.authenticateRequest(ORG, { bearerToken: token, jwtSecret: 'secret' });
    expect(result.authenticated).toBe(true);
    if (result.authenticated && result.principal.type === 'jwt') {
      expect(result.principal.payload['role']).toBe('admin');
    }
  });

  it('verifyApiKey() is scoped per organization — a key issued in one org is not found in another', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key' });
    expect(await engine.verifyApiKey('org-2', issued.rawKey)).toBeNull();
  });

  it('API keys are listed per organization', async () => {
    const { engine } = setup();
    await engine.issueApiKey(ORG, { name: 'A' });
    await engine.issueApiKey('org-2', { name: 'B' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('issueApiKey() stores only a prefix of the raw key, not the full key', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key' });
    expect(issued.apiKey.prefix).toBe(issued.rawKey.slice(0, 12));
    expect(issued.apiKey.prefix.length).toBeLessThan(issued.rawKey.length);
  });

  it('verifyApiKey() returns null once the key has been revoked, even before the expiry check', async () => {
    const { engine } = setup();
    const issued = await engine.issueApiKey(ORG, { name: 'CI Key', expiresAt: '2027-01-01T00:00:00.000Z' });
    await engine.revokeApiKey(ORG, issued.apiKey.id);
    expect(await engine.verifyApiKey(ORG, issued.rawKey)).toBeNull();
  });

  it('signToken()/verifyToken() round-trip an empty payload', () => {
    const token = signToken({}, 'secret');
    const result = verifyToken(token, 'secret');
    expect(result.valid).toBe(true);
  });

  it('verifyToken() rejects a token with a completely empty string', () => {
    expect(verifyToken('', 'secret')).toEqual({ valid: false, reason: 'malformed' });
  });
});
