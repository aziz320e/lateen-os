import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, httpRequest, readJson } from '../src/lib/api/http';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Low-level HTTP layer — retry strategy and error mapping', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("readJson throws a real ApiError carrying the backend's own status and message on a non-ok response", async () => {
    const body = { statusCode: 404, message: 'Customer not found', error: 'CustomerNotFoundError' };
    await expect(readJson(jsonResponse(404, body))).rejects.toMatchObject({
      statusCode: 404,
      message: 'Customer not found',
    });
    await expect(readJson(jsonResponse(404, body))).rejects.toBeInstanceOf(ApiError);
  });

  it('retries a 5xx response with backoff and succeeds once the backend recovers', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        if (calls < 3) return jsonResponse(503, { message: 'Service unavailable' });
        return jsonResponse(200, { success: true, data: { ok: true } });
      }),
    );

    const { response } = await httpRequest('/api/v1/crm/customers', { retries: 3 });
    expect(calls).toBe(3);
    expect(response.status).toBe(200);
  });

  it('never retries a 4xx response — the request itself is wrong, not transient', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        calls += 1;
        return jsonResponse(400, { message: 'Bad request' });
      }),
    );

    const { response } = await httpRequest('/api/v1/crm/customers', { retries: 3 });
    expect(calls).toBe(1);
    expect(response.status).toBe(400);
  });

  it('forwards a manually-supplied Cookie header (server-to-server cookie relay)', async () => {
    let capturedHeaders: HeadersInit | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        capturedHeaders = init.headers;
        return jsonResponse(200, { success: true });
      }),
    );

    await httpRequest('/auth/me', { cookie: 'lateen_access_token=abc123' });
    expect((capturedHeaders as Record<string, string>).Cookie).toBe('lateen_access_token=abc123');
  });
});
