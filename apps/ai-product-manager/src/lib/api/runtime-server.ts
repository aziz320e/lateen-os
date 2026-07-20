import { listDiscoveryRuns } from '@/lib/api/discovery-server';
import type { ActivityEvent, AiRuntimeTask } from '@/types';

export async function buildRuntimeTasks(): Promise<AiRuntimeTask[]> {
  const runs = await listDiscoveryRuns().catch(() => []);
  return runs.map((run) => ({
    id: run.id,
    title: `Discovery: ${run.rank?.opportunities[0]?.title ?? run.id.slice(0, 8)}`,
    status:
      run.status === 'completed'
        ? 'completed'
        : run.status === 'failed'
          ? 'failed'
          : 'running',
    priority: 'normal',
    runtimeAgentId: 'product-manager-ai',
    createdAt: run.startedAt,
    updatedAt: run.completedAt ?? run.startedAt,
    runId: run.id,
  }));
}

export async function buildActivityTimeline(): Promise<ActivityEvent[]> {
  const runs = await listDiscoveryRuns().catch(() => []);
  const events: ActivityEvent[] = [];

  for (const run of runs) {
    events.push({
      id: `${run.id}-started`,
      type: 'discovery_started',
      title: 'Discovery run started',
      description: `Pipeline initiated — stage: ${run.currentStage ?? 'collect_signals'}`,
      timestamp: run.startedAt,
      status: run.status,
    });

    if (run.collectSignals) {
      events.push({
        id: `${run.id}-signals`,
        type: 'signals_collected',
        title: 'Trend signals collected',
        description: `${run.collectSignals.signals.length} signals from ${Object.keys(run.collectSignals.sourceCounts).length} sources`,
        timestamp: run.startedAt,
        status: 'completed',
      });
    }

    if (run.decisionSubmission) {
      events.push({
        id: `${run.id}-decision`,
        type: 'decision_submitted',
        title: 'Submitted to Decision Engine',
        description: run.decisionSubmission.submission.title,
        timestamp: run.completedAt ?? run.startedAt,
        status: run.decisionSubmission.submission.status,
      });
    }

    if (run.recommendation?.recommendations.length) {
      events.push({
        id: `${run.id}-recommendations`,
        type: 'recommendations_created',
        title: 'Recommendations produced',
        description: `${run.recommendation.recommendations.length} manufacturable opportunities`,
        timestamp: run.completedAt ?? run.startedAt,
        status: 'completed',
      });
    }
  }

  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
