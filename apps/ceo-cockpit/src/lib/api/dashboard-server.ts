import {
  fetchEntityCounts,
  getOrganization,
  listAgents,
  listInvoices,
  listWorkflows,
} from '@/lib/api/business-dna-server';
import { listDiscoveryRuns, listRecommendations } from '@/lib/api/discovery-server';
import { fetchDecisionsFromAiPm, fetchMissionSummaryFromAiPm, fetchMissionsFromAiPm } from '@/lib/api/ai-pm-server';
import { collectPlatformHealth } from '@/lib/api/platform-health';
import {
  buildMemoryEntries,
  buildNotifications,
  mapAgentsToWorkers,
  mapRecommendationsToDecisions,
  mapWorkflowsFromBds,
} from '@/lib/api/view-mappers';
import type { ExecutiveDashboard, DecisionRecord } from '@/types';

export async function buildExecutiveDashboard(): Promise<ExecutiveDashboard> {
  const [organization, counts, health, missions, missionSummary, runs, recommendations, agents, workflows, invoices] =
    await Promise.all([
      getOrganization().catch(() => null),
      fetchEntityCounts().catch(() => ({
        branches: 0,
        departments: 0,
        employees: 0,
        products: 0,
        machines: 0,
        agents: 0,
        customers: 0,
        projects: 0,
        workflows: 0,
        policies: 0,
      })),
      collectPlatformHealth().catch(() => ({ status: 'degraded' as const, checkedAt: new Date().toISOString(), services: [] })),
      fetchMissionsFromAiPm(),
      fetchMissionSummaryFromAiPm(),
      listDiscoveryRuns(),
      listRecommendations(),
      listAgents(),
      listWorkflows(),
      listInvoices(),
    ]);

  const aiPmDecisions = (await fetchDecisionsFromAiPm().catch(() => [])) as DecisionRecord[];
  const decisions: DecisionRecord[] = aiPmDecisions.length > 0 ? aiPmDecisions : mapRecommendationsToDecisions(recommendations);
  const workers = mapAgentsToWorkers(agents);
  const workflowViews = mapWorkflowsFromBds(workflows);
  const memory = buildMemoryEntries(missions, decisions, recommendations);
  const notifications = buildNotifications(missions, decisions);

  const projectedRevenue = recommendations
    .reduce((sum, r) => sum + parseFloat(r.profitEstimate.projectedMonthlyProfit || '0'), 0)
    .toFixed(0);

  const projectedMargin =
    recommendations.length > 0
      ? (
          recommendations.reduce((sum, r) => sum + parseFloat(r.profitEstimate.estimatedMarginPercent || '0'), 0) /
          recommendations.length
        ).toFixed(1)
      : '0';

  return {
    organization,
    counts,
    health,
    missions,
    missionSummary,
    decisions,
    recommendations,
    runs,
    workers,
    workflows: workflowViews,
    memory,
    notifications,
    finance: {
      projectedRevenue,
      projectedMargin,
      openInvoices: invoices.length,
    },
    risk: {
      openRisks: decisions.filter((d) => d.risk === 'high').length + missionSummary.escalatedMissions,
      highRiskDecisions: decisions.filter((d) => d.risk === 'high').length,
      escalatedMissions: missionSummary.escalatedMissions,
    },
  };
}
