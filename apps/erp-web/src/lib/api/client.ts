/**
 * REST API v1 Client — the only place any `src/lib/platform/*` domain
 * adapter reaches `apps/backend`'s `/api/v1/*` controllers (built in
 * Task 4). Every response from those controllers is wrapped in a
 * `{ success, data, meta? }` envelope by the backend's own
 * `ResponseInterceptor` — this client unwraps it once, here, so domain
 * adapters just work with plain data.
 *
 * Retry strategy: transient network errors and `5xx` responses are
 * retried with backoff inside `httpRequest()`. A `401` (expired access
 * token) is retried exactly once here, by calling `POST /auth/refresh`
 * with the current refresh-token cookie and re-issuing the original
 * request with the new access token — Server Components can't persist
 * the refreshed cookie themselves (Next.js only allows cookie writes
 * from Route Handlers/Server Actions), so this refresh is scoped to the
 * current request only; the cookie itself is refreshed for real the
 * next time the user hits a Route Handler (login/logout) or once
 * middleware-based refresh is added as a follow-up.
 */
import * as authClient from '../auth/auth-client';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../auth/cookie-relay';
import { decodeJwtPayload } from '../auth/jwt';
import { getAccessToken, getRefreshToken } from '../auth/session';
import { ApiError, httpRequest, readJson } from './http';

export interface PagedResponse<T> {
  readonly data: readonly T[];
  readonly meta: { readonly total: number; readonly offset: number; readonly limit: number };
}

interface Envelope<T> {
  readonly success: boolean;
  readonly data: T;
  readonly meta?: { readonly total: number; readonly offset: number; readonly limit: number };
}

export interface ApiRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  readonly query?: Record<string, string | number | boolean | undefined>;
}

function buildPath(path: string, query?: ApiRequestOptions['query']): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function requestOnce<T>(
  path: string,
  options: ApiRequestOptions,
  accessToken: string | undefined,
): Promise<Envelope<T>> {
  const { response } = await httpRequest(buildPath(path, options.query), {
    method: options.method ?? 'GET',
    body: options.body,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  return readJson<Envelope<T>>(response);
}

/** Issues one `/api/v1/*` request, transparently retrying once with a freshly refreshed access token on a `401`. */
async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<Envelope<T>> {
  const accessToken = await getAccessToken();
  try {
    return await requestOnce<T>(path, options, accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.statusCode !== 401) throw error;

    const refreshToken = await getRefreshToken();
    const refreshCookie = refreshToken ? `${REFRESH_TOKEN_COOKIE}=${refreshToken}` : undefined;
    const organizationId = accessToken ? decodeJwtPayload(accessToken)?.organizationId : undefined;
    if (!refreshCookie || !organizationId) throw error;

    const refreshResult = await authClient.refresh(refreshCookie, organizationId);
    if (!refreshResult.refreshed) throw error;

    const newAccessToken = refreshResult.setCookies
      .find((cookie) => cookie.startsWith(`${ACCESS_TOKEN_COOKIE}=`))
      ?.split(';')[0]
      ?.split('=')[1];
    if (!newAccessToken) throw error;

    return requestOnce<T>(path, options, newAccessToken);
  }
}

export async function apiGet<T>(path: string, query?: ApiRequestOptions['query']): Promise<T> {
  return (await request<T>(path, { method: 'GET', query })).data;
}

export async function apiGetPaged<T>(
  path: string,
  query?: ApiRequestOptions['query'],
): Promise<PagedResponse<T>> {
  const envelope = await request<readonly T[]>(path, { method: 'GET', query });
  return {
    data: envelope.data,
    meta: envelope.meta ?? { total: envelope.data.length, offset: 0, limit: envelope.data.length },
  };
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return (await request<T>(path, { method: 'POST', body })).data;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return (await request<T>(path, { method: 'PATCH', body })).data;
}

export async function apiDelete<T>(path: string): Promise<T> {
  return (await request<T>(path, { method: 'DELETE' })).data;
}
