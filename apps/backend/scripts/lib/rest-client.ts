/**
 * Thin REST client for the demo seed/validation scripts — every call
 * goes over real HTTP to the running `apps/backend` process's real
 * `/api/v1/*` (Task 4) and platform (Task 1) endpoints. No repository
 * import, no direct database access, anywhere in this file.
 */
const BASE_URL = process.env.DEMO_API_BASE_URL ?? 'http://localhost:4013';

export class RestError extends Error {
  readonly statusCode: number;
  readonly path: string;
  readonly body: unknown;

  constructor(path: string, statusCode: number, body: unknown) {
    super(
      `${path} -> HTTP ${statusCode}: ${typeof body === 'object' ? JSON.stringify(body) : String(body)}`,
    );
    this.name = 'RestError';
    this.path = path;
    this.statusCode = statusCode;
    this.body = body;
  }
}

export interface PagedResult<T> {
  readonly data: readonly T[];
  readonly meta: { readonly total: number; readonly offset: number; readonly limit: number };
}

export interface RestClient {
  get<T>(path: string): Promise<T>;
  getPaged<T>(path: string): Promise<PagedResult<T>>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  del<T>(path: string): Promise<T>;
  /** Raw call, returning the full `{success, data, meta}` envelope untouched. */
  raw(path: string, method: string, body?: unknown): Promise<{ status: number; json: unknown }>;
}

export function createRestClient(token: string): RestClient {
  async function call<T>(path: string, method: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    const json: unknown = text ? JSON.parse(text) : undefined;
    if (!response.ok) throw new RestError(path, response.status, json);
    if (json && typeof json === 'object' && 'data' in json) return (json as { data: T }).data;
    return json as T;
  }

  async function callPaged<T>(path: string): Promise<PagedResult<T>> {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await response.text();
    const json: unknown = text ? JSON.parse(text) : undefined;
    if (!response.ok) throw new RestError(path, response.status, json);
    const envelope = json as { data: readonly T[]; meta?: PagedResult<T>['meta'] };
    return {
      data: envelope.data,
      meta: envelope.meta ?? {
        total: envelope.data.length,
        offset: 0,
        limit: envelope.data.length,
      },
    };
  }

  return {
    get: <T>(path: string) => call<T>(path, 'GET'),
    getPaged: <T>(path: string) => callPaged<T>(path),
    post: <T>(path: string, body?: unknown) => call<T>(path, 'POST', body),
    patch: <T>(path: string, body?: unknown) => call<T>(path, 'PATCH', body),
    del: <T>(path: string) => call<T>(path, 'DELETE'),
    async raw(path: string, method: string, body?: unknown) {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const text = await response.text();
      return { status: response.status, json: text ? JSON.parse(text) : undefined };
    },
  };
}

export { BASE_URL };
