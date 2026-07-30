import { cookies } from 'next/headers';
import * as authClient from './auth-client';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './cookie-relay';
import { decodeJwtPayload } from './jwt';

export { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE };

/** Reads the current request's access-token cookie, if any (read-only — safe to call from Server Components). */
export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_TOKEN_COOKIE)?.value;
}

/** Builds the raw `Cookie` header this app forwards to `apps/backend` for a given token cookie. */
function cookieHeader(name: string, value: string | undefined): string | undefined {
  return value ? `${name}=${value}` : undefined;
}

/**
 * The authenticated user's real profile, fetched fresh from
 * `GET /auth/me` on every call — never cached, never fabricated. Returns
 * `null` when there is no valid session (middleware is responsible for
 * refreshing an expired access token *before* a page renders; by the
 * time a Server Component calls this, the access token is expected to
 * already be current).
 */
export async function getCurrentUser(): Promise<authClient.CurrentUserProfile | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  return authClient.getCurrentUser(cookieHeader(ACCESS_TOKEN_COOKIE, accessToken));
}

/** Cheap, local (unverified) read of the current access token's roles/permissions — used for nav/UI gating without an extra network round trip. */
export async function getSessionClaims(): Promise<{
  roles: readonly string[];
  permissions: readonly string[];
} | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;
  return { roles: payload.roles, permissions: payload.permissions };
}

export function hasPermission(
  claims: { permissions: readonly string[] } | null,
  permission: string,
): boolean {
  return claims?.permissions.includes(permission) ?? false;
}
