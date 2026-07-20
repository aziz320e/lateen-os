import { NextResponse } from 'next/server';
import { analyticsFetch } from '@/lib/api/analytics-server';

export async function GET() {
  try {
    return NextResponse.json(await analyticsFetch('/api/dashboard'));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}
