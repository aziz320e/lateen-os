/**
 * Low-level HTTP layer — the only place in this app that calls
 * `fetch()` against `apps/backend`. Every domain/auth client is built on
 * top of this. Retries transient failures (network errors, 5xx) with
 * exponential backoff; never retries 4xx (the request itself is wrong,
 * retrying won't help).
 */
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4013';
const DEFAULT_RETRIES = 2;
const BASE_DELAY_MS = 200;

export class ApiError extends Error {
  readonly statusCode: number;
  readonly body: unknown;

  constructor(message: string, statusCode: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

export interface HttpRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  /** Raw `Cookie` header to forward to the backend (server-to-server; the browser's cookies aren't sent automatically across origins). */
  readonly cookie?: string;
  /** Number of retries for network errors / 5xx responses. */
  readonly retries?: number;
}

export interface HttpResult {
  readonly response: Response;
  readonly setCookies: readonly string[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractSetCookies(response: Response): readonly string[] {
  // `getSetCookie()` (Node 18.14+/undici) is the only correct way to read
  // multiple Set-Cookie headers — a plain `.get('set-cookie')` join breaks
  // on the commas inside `Expires=...` cookie attributes.
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const single = response.headers.get('set-cookie');
  return single ? [single] : [];
}

/** Performs one HTTP call against `apps/backend`, with retry/backoff for transient failures. Returns the raw `Response` plus any `Set-Cookie` headers — callers decide how to interpret the body and cookies. */
export async function httpRequest(
  path: string,
  options: HttpRequestOptions = {},
): Promise<HttpResult> {
  const { method = 'GET', body, headers = {}, cookie, retries = DEFAULT_RETRIES } = options;
  const url = `${API_BASE_URL}${path}`;
  const requestHeaders: Record<string, string> = { ...headers };
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
  if (cookie) requestHeaders['Cookie'] = cookie;

  let attempt = 0;
  for (;;) {
    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
      if (response.status >= 500 && attempt < retries) {
        attempt += 1;
        await sleep(BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
      return { response, setCookies: extractSetCookies(response) };
    } catch (error) {
      if (attempt >= retries) throw error;
      attempt += 1;
      await sleep(BASE_DELAY_MS * 2 ** attempt);
    }
  }
}

/** Reads and parses a response body as JSON, throwing a real `ApiError` (with the backend's own status/message) if the response was not ok. */
export async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const parsed: unknown = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    const message =
      parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, parsed);
  }
  return parsed as T;
}
