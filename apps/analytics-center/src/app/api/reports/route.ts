import { NextResponse } from 'next/server';
import { analyticsFetch } from '@/lib/api/analytics-server';

export async function GET() {
  try {
    return NextResponse.json(await analyticsFetch('/api/reports'));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}
