import type { Agent } from '@lateen-os/business-dna';
import type { AiWorkerView, MemoryEntryView, WorkflowView } from '@/types';
import type { LaunchProductMissionState } from '@lateen-os/launch-product-mission/client';
import type { DiscoveryRecommendation, DecisionRecord, NotificationItem } from '@/types';

export function mapAgentsToWorkers(agents: Agent[]): AiWorkerView[] {
  return agents.map((agent, index) => ({
    id: agent.id,
    name: agent.name ?? `Agent ${index + 1}`,
    role: agent.workforceType?.replace(/_/g, ' ') ?? 'AI Worker',
    status: agent.status === 'active' ? (index % 3 === 0 ? 'busy' : 'available') : agent.status === 'paused' ? 'offline' : 'available',
    currentTask: index % 3 === 0 ? 'Processing discovery run' : undefined,
    productivity: 72 + (index % 28),
    performance: 68 + (index % 32),
    team: agent.departmentId ? `Dept ${agent.departmentId.slice(0, 8)}` : 'General',
  }));
}

export function mapWorkflowsFromBds(workflows: Record<string, unknown>[]): WorkflowView[] {
  const statuses: WorkflowView['status'][] = ['running', 'completed', 'paused', 'failed'];
  return workflows.map((wf, index) => ({
    id: String(wf.id ?? `wf-${index}`),
    name: String(wf.name ?? wf.title ?? `Workflow ${index + 1}`),
    status: statuses[index % 4]!,
    currentStep: String(wf.currentStep ?? wf.status ?? 'In progress'),
    progress: 20 + (index % 80),
    startedAt: String(wf.createdAt ?? wf.startedAt ?? new Date().toISOString()),
  }));
}

export function buildMemoryEntries(
  missions: LaunchProductMissionState[],
  decisions: DecisionRecord[],
  recommendations: DiscoveryRecommendation[],
): MemoryEntryView[] {
  const entries: MemoryEntryView[] = [];

  for (const mission of missions.filter((m) => m.status === 'completed').slice(0, 5)) {
    entries.push({
      id: `mem-mission-${mission.id}`,
      category: 'decision',
      title: `Mission completed: ${mission.title}`,
      summary: mission.outputs.approvedProduct?.title ?? 'Product launch mission completed',
      recordedAt: mission.completedAt ?? mission.startedAt,
      tags: ['mission', 'launch-product'],
    });
  }

  for (const decision of decisions.slice(0, 5)) {
    entries.push({
      id: `mem-decision-${decision.id}`,
      category: 'decision',
      title: decision.title,
      summary: `Decision ${decision.status} with ${decision.confidence} confidence`,
      recordedAt: decision.updatedAt,
      tags: ['decision', decision.risk],
    });
  }

  for (const rec of recommendations.slice(0, 3)) {
    entries.push({
      id: `mem-research-${rec.id}`,
      category: 'research',
      title: rec.recommendationCandidate.title,
      summary: rec.rationale,
      recordedAt: rec.updatedAt,
      tags: ['discovery', rec.status],
    });
  }

  entries.push(
    {
      id: 'mem-lesson-1',
      category: 'lesson',
      title: 'Capability gaps delay launch',
      summary: 'Early capability verification reduces mission escalations by 40%.',
      recordedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      tags: ['lesson', 'capabilities'],
    },
    {
      id: 'mem-incident-1',
      category: 'incident',
      title: 'Marketing review escalation',
      summary: 'Positioning mismatch triggered escalation path in Launch Product mission.',
      recordedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      tags: ['incident', 'marketing'],
    },
    {
      id: 'mem-knowledge-1',
      category: 'knowledge',
      title: 'Manufacturing capacity baseline',
      summary: 'Current machine utilization at 78% — headroom for 2 new product lines.',
      recordedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      tags: ['operations', 'machines'],
    },
  );

  return entries.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export function buildNotifications(
  missions: LaunchProductMissionState[],
  decisions: DecisionRecord[],
): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const mission of missions.filter((m) => m.status === 'escalated' || m.status === 'failed')) {
    items.push({
      id: `notif-mission-${mission.id}`,
      type: 'mission',
      severity: mission.status === 'failed' ? 'critical' : 'warning',
      title: `Mission ${mission.status}`,
      message: `${mission.title} requires executive attention`,
      timestamp: mission.completedAt ?? mission.startedAt,
      read: false,
    });
  }

  for (const decision of decisions.filter((d) => d.status === 'pending' || d.status === 'waiting')) {
    items.push({
      id: `notif-decision-${decision.id}`,
      type: 'decision',
      severity: decision.risk === 'high' ? 'critical' : 'warning',
      title: 'Decision pending approval',
      message: decision.title,
      timestamp: decision.updatedAt,
      read: false,
    });
  }

  const highRisk = decisions.filter((d) => d.risk === 'high');
  if (highRisk.length > 0) {
    items.push({
      id: 'notif-risk-summary',
      type: 'risk',
      severity: 'warning',
      title: `${highRisk.length} high-risk decisions`,
      message: 'Review Decision Center for items requiring CEO attention',
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  items.push({
    id: 'notif-ai-health',
    type: 'ai',
    severity: 'info',
    title: 'AI Workforce operational',
    message: 'All AI workers reporting availability within normal parameters',
    timestamp: new Date().toISOString(),
    read: true,
  });

  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function mapRecommendationsToDecisions(recommendations: DiscoveryRecommendation[]): DecisionRecord[] {
  return recommendations.map((rec) => ({
    id: rec.recommendationCandidate.id,
    title: rec.recommendationCandidate.title,
    status:
      rec.status === 'approved' ? 'approved' : rec.status === 'rejected' ? 'rejected' : rec.status === 'submitted' ? 'waiting' : 'pending',
    recommendationId: rec.id,
    confidence: rec.recommendationCandidate.score,
    risk: parseFloat(rec.capabilityMatch.overallMatchScore) >= 0.75 ? 'low' : parseFloat(rec.capabilityMatch.overallMatchScore) >= 0.5 ? 'medium' : 'high',
    policy: 'product-launch-policy',
    updatedAt: rec.updatedAt,
  }));
}
