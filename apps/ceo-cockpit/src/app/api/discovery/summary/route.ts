import { NextResponse } from 'next/server';
import { listDiscoveryRuns, listRecommendations } from '@/lib/api/discovery-server';

export async function GET() {
  try {
    const [runs, recommendations] = await Promise.all([listDiscoveryRuns(), listRecommendations()]);
    return NextResponse.json({ runs, recommendations });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Discovery summary failed' }, { status: 502 });
  }
}
