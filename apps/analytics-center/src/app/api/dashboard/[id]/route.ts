import { NextResponse } from 'next/server';
import { analyticsFetch } from '@/lib/api/analytics-server';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return NextResponse.json(await analyticsFetch(`/api/dashboard/${id}?organizationId=org-1`));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}
