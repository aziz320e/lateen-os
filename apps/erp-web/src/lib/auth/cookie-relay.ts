/**
 * Cookie Relay — this app and `apps/backend` are separate origins
 * (different ports), so the backend's `Set-Cookie` response headers
 * never reach the browser automatically. This app instead re-issues the
 * exact same cookies under its own origin, and forwards its own
 * incoming `Cookie` header to the backend on every subsequent request —
 * a standard BFF (backend-for-frontend) cookie relay.
 */
export const ACCESS_TOKEN_COOKIE = 'lateen_access_token';
export const REFRESH_TOKEN_COOKIE = 'lateen_refresh_token';

export interface ParsedCookie {
  readonly name: string;
  readonly value: string;
  readonly httpOnly: boolean;
  readonly secure: boolean;
  readonly sameSite: 'lax' | 'strict' | 'none';
  readonly path: string;
  readonly maxAge?: number;
}

/** Parses one raw `Set-Cookie` header string (as returned by the backend) into structured attributes Next's `cookies().set()` API expects. */
export function parseSetCookie(raw: string): ParsedCookie | null {
  const parts = raw.split(';').map((part) => part.trim());
  const first = parts[0];
  if (!first) return null;
  const eq = first.indexOf('=');
  if (eq === -1) return null;
  const name = first.slice(0, eq);
  const value = first.slice(eq + 1);

  let httpOnly = false;
  let secure = false;
  let sameSite: ParsedCookie['sameSite'] = 'lax';
  let path = '/';
  let maxAge: number | undefined;

  for (const attribute of parts.slice(1)) {
    const [rawKey, rawValue] = attribute.split('=');
    const key = rawKey?.toLowerCase();
    if (key === 'httponly') httpOnly = true;
    else if (key === 'secure') secure = true;
    else if (key === 'samesite' && rawValue)
      sameSite = rawValue.toLowerCase() as ParsedCookie['sameSite'];
    else if (key === 'path' && rawValue) path = rawValue;
    else if (key === 'max-age' && rawValue) maxAge = Number(rawValue);
  }

  return { name, value, httpOnly, secure, sameSite, path, maxAge };
}

export function parseSetCookies(raw: readonly string[]): readonly ParsedCookie[] {
  return raw.map(parseSetCookie).filter((cookie): cookie is ParsedCookie => cookie !== null);
}
