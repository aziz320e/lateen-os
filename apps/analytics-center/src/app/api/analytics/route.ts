import { NextResponse } from 'next/server';
import { analyticsFetch } from '@/lib/api/analytics-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await analyticsFetch('/api/analytics', { method: 'POST', body: JSON.stringify(body) }), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}

export async function GET() {
  try {
    return NextResponse.json(await analyticsFetch('/api/analytics/pipeline'));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}
