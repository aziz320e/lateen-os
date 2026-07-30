/**
 * Local, unverified JWT payload decoding — used only for cheap UI-side
 * concerns (expiry hinting, reading roles/permissions to drive
 * navigation). This never substitutes for real authorization: every
 * backend endpoint independently verifies the token's signature via its
 * own `AuthenticationEngine` and enforces access via its own guards.
 */
export interface AccessTokenPayload {
  readonly sub: string;
  readonly organizationId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly exp?: number;
}

/** Web-standard base64url decode (no Node `Buffer`) — safe on both the Node and Edge runtimes, since Next.js middleware may run on either. */
function base64UrlDecode(segment: string): string {
  const base64 = segment
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(segment.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token: string): AccessTokenPayload | null {
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(segments[1] as string)) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function isExpired(payload: Pick<AccessTokenPayload, 'exp'>, skewSeconds = 10): boolean {
  if (typeof payload.exp !== 'number') return false;
  return Math.floor(Date.now() / 1000) >= payload.exp - skewSeconds;
}
