import { NextResponse } from 'next/server';
import { getMission } from '@/lib/mission-store';

export async function GET(_request: Request, context: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await context.params;
  const mission = getMission(missionId);
  if (!mission) {
    return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
  }
  return NextResponse.json(mission);
}
