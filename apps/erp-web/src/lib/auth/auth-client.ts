/**
 * Authentication Client — the only place this app calls
 * `apps/backend`'s real `/auth/*` endpoints (`POST /auth/login`,
 * `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`). These
 * responses are NOT wrapped in the `{ success, data }` envelope the
 * `/api/v1/*` domain controllers use, so this client is intentionally
 * separate from `src/lib/api/client.ts`.
 */
import { httpRequest, readJson, type HttpResult } from '../api/http';

export interface CurrentUserProfile {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

export interface LoginInput {
  readonly organizationId: string;
  readonly email: string;
  readonly password: string;
}

export interface LoginResult extends HttpResult {
  readonly user: { readonly id: string; readonly email: string; readonly displayName: string };
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const result = await httpRequest('/auth/login', { method: 'POST', body: input, retries: 0 });
  const body = await readJson<{
    user: LoginResult['user'];
    roles: readonly string[];
    permissions: readonly string[];
  }>(result.response);
  return { ...result, ...body };
}

/** Logs out the session identified by `refreshTokenCookie` (the raw `Cookie` header value to forward to the backend). */
export async function logout(refreshTokenCookie: string | undefined): Promise<HttpResult> {
  return httpRequest('/auth/logout', { method: 'POST', cookie: refreshTokenCookie, retries: 0 });
}

export interface RefreshResult extends HttpResult {
  readonly refreshed: boolean;
}

/** Exchanges a refresh token (via the forwarded `Cookie` header) for a new access + refresh token pair. */
export async function refresh(
  refreshTokenCookie: string | undefined,
  organizationId: string,
): Promise<RefreshResult> {
  const result = await httpRequest('/auth/refresh', {
    method: 'POST',
    cookie: refreshTokenCookie,
    body: { organizationId },
    retries: 0,
  });
  if (!result.response.ok) return { ...result, refreshed: false };
  const body = await readJson<{ refreshed: boolean }>(result.response);
  return { ...result, ...body };
}

/** Fetches the authenticated user's real profile (id, email, display name, roles, effective permissions) via the forwarded access-token `Cookie` header. */
export async function getCurrentUser(
  accessTokenCookie: string | undefined,
): Promise<CurrentUserProfile | null> {
  const { response } = await httpRequest('/auth/me', { cookie: accessTokenCookie, retries: 0 });
  if (!response.ok) return null;
  return readJson<CurrentUserProfile>(response);
}
