import { NextResponse } from 'next/server';
import { listMissions, startMission } from '@/lib/mission-store';

export async function GET() {
  return NextResponse.json({ missions: listMissions() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      opportunityTitle?: string;
      scenario?: 'happy_path' | 'escalation_path' | 'rejected_path' | 'retry_path';
    };
    const mission = startMission(body);
    return NextResponse.json(mission, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Mission start failed' },
      { status: 400 },
    );
  }
}
