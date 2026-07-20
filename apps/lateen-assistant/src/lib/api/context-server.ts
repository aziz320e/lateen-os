import { getOrganizationId, getAuthSubject } from '@/lib/auth';
import { listAgents, listWorkflows } from '@/lib/api/business-dna-server';
import { fetchMissions } from '@/lib/api/ai-pm-server';
import { buildMemoryEntries } from '@/lib/api/orchestrator';
import type { ConversationContext } from '@/types';

export async function buildConversationContext(): Promise<ConversationContext> {
  const [agents, workflows, missions, memory] = await Promise.all([
    listAgents().catch(() => []),
    listWorkflows().catch(() => []),
    fetchMissions().catch(() => []),
    buildMemoryEntries().catch(() => []),
  ]);

  const runningMission = missions.find((m) => m.status === 'active' || m.status === 'escalated');
  const activeWorkflow = workflows.find((w) => w.status === 'active' || w.status === 'running');

  return {
    organizationId: getOrganizationId(),
    userId: getAuthSubject(),
    permissions: ['read:organization', 'write:entities', 'execute:workflows', 'execute:missions'],
    currentMissionId: runningMission?.id,
    currentWorkflowId: activeWorkflow ? String(activeWorkflow.id) : undefined,
    workforceAgentIds: agents.map((a) => a.id),
    memorySnippetCount: memory.length,
  };
}
