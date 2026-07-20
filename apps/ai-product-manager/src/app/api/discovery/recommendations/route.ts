import { NextResponse } from 'next/server';
import { listRecommendations } from '@/lib/api/discovery-server';
import { resolveDecisionStatus } from '@/lib/decision-store';
import type { DiscoveryRecommendation } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId') ?? undefined;
    const recommendations = await listRecommendations(runId);

    const enriched = recommendations.map((rec) => ({
      ...rec,
      status: resolveDecisionStatus(rec.id, rec.status) === 'approved'
        ? 'approved'
        : resolveDecisionStatus(rec.id, rec.status) === 'rejected'
          ? 'rejected'
          : rec.status,
    })) as DiscoveryRecommendation[];

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list recommendations' },
      { status: 502 },
    );
  }
}
