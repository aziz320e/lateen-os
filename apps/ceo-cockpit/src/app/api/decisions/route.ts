import { NextResponse } from 'next/server';
import { listPolicies } from '@/lib/api/business-dna-server';
import { listRecommendations } from '@/lib/api/discovery-server';
import { fetchDecisionsFromAiPm } from '@/lib/api/ai-pm-server';
import { mapRecommendationsToDecisions } from '@/lib/api/view-mappers';

export async function GET() {
  try {
    const [aiPmDecisions, recommendations, policies] = await Promise.all([
      fetchDecisionsFromAiPm(),
      listRecommendations(),
      listPolicies(),
    ]);
    const decisions = aiPmDecisions.length > 0 ? aiPmDecisions : mapRecommendationsToDecisions(recommendations);
    return NextResponse.json({ decisions, policies });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Decisions failed' }, { status: 502 });
  }
}
