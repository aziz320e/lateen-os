import { NextResponse } from 'next/server';
import { getAuthHeaders, getOrganizationId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL;

async function proxyRequest(request: Request, pathSegments: string[]) {
  const orgId = getOrganizationId();
  const resolved = pathSegments.map((s) => (s === 'current' ? orgId : s));
  const url = new URL(request.url);
  const targetPath = resolved.join('/');
  const targetUrl = `${baseUrl}/api/v1/${targetPath}${url.search}`;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: getAuthHeaders(),
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
    cache: 'no-store',
  });

  if (response.status === 204) return new NextResponse(null, { status: 204 });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
  });
}

async function handle(request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    return proxyRequest(request, path);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Proxy failed' }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
