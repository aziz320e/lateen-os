import { describe, expect, it } from 'vitest';
import { decodeJwtPayload, isExpired } from '../src/lib/auth/jwt';

function fakeToken(payload: Record<string, unknown>): string {
  const base64url = (value: string) => Buffer.from(value).toString('base64url');
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  return `${header}.${body}.unverified-signature`;
}

describe('Local JWT payload decoding (unverified — UI concerns only)', () => {
  it('decodes a real access-token payload shape', () => {
    const token = fakeToken({
      sub: 'user-1',
      organizationId: 'org-1',
      roles: ['admin'],
      permissions: ['crm:read'],
      iat: 1000,
      exp: 2000,
    });
    const payload = decodeJwtPayload(token);
    expect(payload).toEqual({
      sub: 'user-1',
      organizationId: 'org-1',
      roles: ['admin'],
      permissions: ['crm:read'],
      iat: 1000,
      exp: 2000,
    });
  });

  it('returns null for a malformed token (wrong segment count)', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
  });

  it('returns null when the payload segment is not valid JSON', () => {
    expect(decodeJwtPayload('header.not-json.sig')).toBeNull();
  });

  it('reports a token expired once `exp` has passed (minus the skew window)', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    expect(isExpired({ exp: nowSeconds - 100 })).toBe(true);
    expect(isExpired({ exp: nowSeconds + 100 })).toBe(false);
  });

  it('treats a token within the default 10s skew window as already expired', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    expect(isExpired({ exp: nowSeconds + 5 })).toBe(true);
  });

  it('treats a token with no `exp` claim as never expiring', () => {
    expect(isExpired({})).toBe(false);
  });
});
