import { NextResponse } from 'next/server';
import { fetchMissionSummaryFromAiPm, fetchMissionsFromAiPm } from '@/lib/api/ai-pm-server';

export async function GET() {
  try {
    const [missions, summary] = await Promise.all([fetchMissionsFromAiPm(), fetchMissionSummaryFromAiPm()]);
    return NextResponse.json({ missions, summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Missions failed' }, { status: 502 });
  }
}
