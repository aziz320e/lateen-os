import { describe, expect, it } from 'vitest';
import { parseSetCookie, parseSetCookies } from '../src/lib/auth/cookie-relay';

describe("Cookie Relay — parsing the backend's real Set-Cookie headers", () => {
  it('parses name, value, and every attribute off a real HttpOnly access-token cookie', () => {
    const parsed = parseSetCookie(
      'lateen_access_token=abc.def.ghi; Max-Age=900; Path=/; HttpOnly; SameSite=Lax',
    );
    expect(parsed).toEqual({
      name: 'lateen_access_token',
      value: 'abc.def.ghi',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 900,
    });
  });

  it('parses a Secure cookie scoped to a narrower path (the refresh token)', () => {
    const parsed = parseSetCookie(
      'lateen_refresh_token=xyz123; Max-Age=1209600; Path=/auth; HttpOnly; Secure; SameSite=Lax',
    );
    expect(parsed?.path).toBe('/auth');
    expect(parsed?.secure).toBe(true);
    expect(parsed?.maxAge).toBe(1_209_600);
  });

  it('defaults path to "/" and sameSite to "lax" when attributes are omitted', () => {
    const parsed = parseSetCookie('some_cookie=value');
    expect(parsed).toEqual({
      name: 'some_cookie',
      value: 'value',
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: undefined,
    });
  });

  it('returns null for a malformed header with no name=value pair', () => {
    expect(parseSetCookie('; Path=/')).toBeNull();
  });

  it('parses multiple real Set-Cookie headers (access + refresh) from one response', () => {
    const cookies = parseSetCookies([
      'lateen_access_token=abc; Max-Age=900; Path=/; HttpOnly; SameSite=Lax',
      'lateen_refresh_token=def; Max-Age=1209600; Path=/auth; HttpOnly; SameSite=Lax',
    ]);
    expect(cookies).toHaveLength(2);
    expect(cookies.map((cookie) => cookie.name)).toEqual([
      'lateen_access_token',
      'lateen_refresh_token',
    ]);
  });
});
