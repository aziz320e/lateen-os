import { NextResponse } from 'next/server';
import { listRecommendations } from '@/lib/api/discovery-server';
import { listDecisionOverrides, resolveDecisionStatus, setDecisionOverride } from '@/lib/decision-store';
import type { DecisionRecord } from '@/types';

export async function GET() {
  try {
    const recommendations = await listRecommendations();
    const overrides = listDecisionOverrides();

    const fromRecommendations: DecisionRecord[] = recommendations.map((rec) => {
      const status = resolveDecisionStatus(rec.id, rec.status);
      return {
        id: rec.recommendationCandidate.id,
        title: rec.recommendationCandidate.title,
        status,
        recommendationId: rec.id,
        confidence: rec.recommendationCandidate.score,
        risk: parseFloat(rec.capabilityMatch.overallMatchScore) >= 0.75 ? 'low' : 'medium',
        updatedAt: rec.updatedAt,
      };
    });

    const merged = [...fromRecommendations];
    for (const override of overrides) {
      const idx = merged.findIndex((d) => d.recommendationId === override.recommendationId);
      if (idx >= 0) merged[idx] = override;
      else merged.push(override);
    }

    return NextResponse.json(merged);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list decisions' },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { recommendationId: string; action: 'approve' | 'reject' };
    const recommendations = await listRecommendations();
    const rec = recommendations.find((r) => r.id === body.recommendationId);
    if (!rec) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const record = setDecisionOverride({
      id: rec.recommendationCandidate.id,
      title: rec.recommendationCandidate.title,
      status: body.action === 'approve' ? 'approved' : 'rejected',
      recommendationId: rec.id,
      confidence: rec.recommendationCandidate.score,
      risk: parseFloat(rec.capabilityMatch.overallMatchScore) >= 0.75 ? 'low' : 'medium',
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Decision action failed' },
      { status: 502 },
    );
  }
}
