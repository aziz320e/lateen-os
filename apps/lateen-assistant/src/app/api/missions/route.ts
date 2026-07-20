import { NextResponse } from 'next/server';
import { listMissionViews, groupMissionsByStatus } from '@/lib/api/mission-server';
import { startMission } from '@/lib/api/ai-pm-server';
import { recordTrace } from '@/lib/audit';

export async function GET() {
  const missions = await listMissionViews();
  return NextResponse.json({ missions, groups: groupMissionsByStatus(missions) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action: 'start' | 'retry' | 'escalate';
      opportunityTitle?: string;
      missionId?: string;
    };

    recordTrace({ service: 'ai-product-manager', action: `mission:${body.action}`, missionId: body.missionId });

    if (body.action === 'start') {
      const mission = await startMission({
        opportunityTitle: body.opportunityTitle ?? 'Assistant Mission',
        scenario: 'happy_path',
      });
      return NextResponse.json(mission, { status: 201 });
    }

    if (body.action === 'retry') {
      const mission = await startMission({ opportunityTitle: 'Retry Mission', scenario: 'retry_path' });
      return NextResponse.json(mission);
    }

    if (body.action === 'escalate') {
      const mission = await startMission({ opportunityTitle: 'Escalated Mission', scenario: 'escalation_path' });
      return NextResponse.json(mission);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Mission action failed' }, { status: 502 });
  }
}
