import { NextResponse } from 'next/server';
import { getMissionSummary, listMissions } from '@/lib/mission-store';
import { listAgents, listMachines, listProducts } from '@/lib/api/business-dna-server';
import {
  getPlatformHealth,
  listDiscoveryRuns,
  listRecommendations,
} from '@/lib/api/discovery-server';
import { buildRuntimeTasks } from '@/lib/api/runtime-server';
import { listDecisionOverrides, resolveDecisionStatus } from '@/lib/decision-store';
import type { DecisionRecord } from '@/types';

export async function GET() {
  try {
    const [runs, recommendations, tasks, health, products, machines] = await Promise.all([
      listDiscoveryRuns().catch(() => []),
      listRecommendations().catch(() => []),
      buildRuntimeTasks().catch(() => []),
      getPlatformHealth().catch(() => ({ status: 'degraded', services: [], infrastructure: [] })),
      listProducts().catch(() => []),
      listMachines().catch(() => []),
    ]);

    const overrides = listDecisionOverrides();
    const decisions: DecisionRecord[] = recommendations.map((rec) => ({
      id: rec.recommendationCandidate.id,
      title: rec.recommendationCandidate.title,
      status: resolveDecisionStatus(rec.id, rec.status),
      recommendationId: rec.id,
      confidence: rec.recommendationCandidate.score,
      risk: parseFloat(rec.capabilityMatch.overallMatchScore) >= 0.75 ? 'low' : 'medium',
      updatedAt: rec.updatedAt,
    }));

    for (const override of overrides) {
      const idx = decisions.findIndex((d) => d.recommendationId === override.recommendationId);
      if (idx >= 0) decisions[idx] = override;
    }

    return NextResponse.json({
      runs,
      recommendations,
      tasks,
      decisions,
      health,
      products,
      machines,
      missions: listMissions(),
      missionSummary: getMissionSummary(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dashboard load failed' },
      { status: 502 },
    );
  }
}
