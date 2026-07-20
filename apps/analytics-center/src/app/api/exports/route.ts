import { NextResponse } from 'next/server';
import { analyticsFetch } from '@/lib/api/analytics-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId') ?? 'org-1';
  try {
    return NextResponse.json(await analyticsFetch(`/api/exports?organizationId=${organizationId}`));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await analyticsFetch('/api/exports', { method: 'POST', body: JSON.stringify(body) }), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}
