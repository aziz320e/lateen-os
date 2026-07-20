import { listWorkflows } from '@/lib/api/business-dna-server';
import type { WorkflowView } from '@/types';

export async function listWorkflowViews(): Promise<WorkflowView[]> {
  const workflows = await listWorkflows();
  return workflows.map((w) => ({
    id: String(w.id),
    name: String(w.name ?? w.id),
    status: String(w.status ?? 'active'),
    steps: Array.isArray(w.steps) ? w.steps.length : undefined,
  }));
}

export function groupWorkflowsByStatus(workflows: WorkflowView[]) {
  return {
    active: workflows.filter((w) => w.status === 'active' || w.status === 'running'),
    paused: workflows.filter((w) => w.status === 'paused'),
    completed: workflows.filter((w) => w.status === 'completed'),
    cancelled: workflows.filter((w) => w.status === 'cancelled'),
  };
}
