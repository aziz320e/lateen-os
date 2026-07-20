import { NextResponse } from 'next/server';
import { analyticsFetch } from '@/lib/api/analytics-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId') ?? 'org-1';
  try {
    return NextResponse.json(await analyticsFetch(`/api/metrics?organizationId=${organizationId}`));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}
