import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createMultiAgentRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('Integration: Collaboration Orchestrator + real Workflow Engine', () => {
  it('genuinely starts a real workflow instance when advancing a mapped coordination step', async () => {
    const workflowRuntime = createWorkflowRuntime({
      stepHandlers: {
        service: async () => ({ success: true, output: { done: true } }),
      },
    });

    const { definition } = await workflowRuntime.defineWorkflow({
      organizationId: ORG,
      code: 'fulfillment',
      name: 'Fulfillment',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps: [
        {
          stepId: 's1',
          code: 'ship',
          name: 'Ship order',
          type: 'service',
          optional: false,
          serviceRef: 'svc://shipping',
          operation: 'ship',
          inputVariableKeys: [],
        },
      ],
      transitions: [],
    });

    const runtime = createMultiAgentRuntime({
      workflowRuntime,
      workflowDefinitionIdForStep: () => definition.id,
    });

    const mission = await runtime.missions.create({
      organizationId: ORG,
      code: 'fulfill-order',
      title: 'Fulfill customer order',
      description: 'Real workflow-backed coordination step.',
      priority: 'high',
      leadWorkerRole: 'operations_ai',
    });
    const team = await runtime.team.assemble({
      organizationId: ORG,
      missionId: mission.id,
      name: 'Fulfillment team',
      leaderWorkerId: 'ops-worker',
      leaderRole: 'operations_ai',
      requiredRoles: ['operations_ai'],
    });
    await runtime.team.addMember(ORG, team.id, 'ops-worker', { role: 'operations_ai', responsibilities: [], decisionAuthority: 'approve' });

    await runtime.orchestrator.startMission(ORG, mission.id);
    const { steps } = await runtime.queries.findCoordinationPlan({ organizationId: ORG, missionId: mission.id });
    const stepId = steps[0]!.id;

    await runtime.orchestrator.advanceStep(ORG, stepId); // pending -> ready
    const status = await runtime.orchestrator.advanceStep(ORG, stepId); // ready -> genuinely starts the workflow instance

    expect(status).toBe('completed'); // the real workflow's single service step has a handler and completes synchronously

    const { steps: updated } = await runtime.queries.findCoordinationPlan({ organizationId: ORG, missionId: mission.id });
    expect(updated[0]?.workflowInstanceId).toBeTruthy();

    const instances = await workflowRuntime.queries.findRunningWorkflows({ organizationId: ORG, status: 'completed' });
    expect(instances.instances).toHaveLength(1);
    expect(instances.instances[0]?.id).toBe(updated[0]?.workflowInstanceId);
  });

  it('falls back to direct step progression when no workflow definition is mapped for the step', async () => {
    const workflowRuntime = createWorkflowRuntime();
    const runtime = createMultiAgentRuntime({ workflowRuntime, workflowDefinitionIdForStep: () => undefined });

    const mission = await runtime.missions.create({
      organizationId: ORG,
      code: 'no-mapping',
      title: 'No mapping',
      description: 'No workflow definition mapped for this step.',
      priority: 'low',
      leadWorkerRole: 'hr_ai',
    });
    const team = await runtime.team.assemble({
      organizationId: ORG,
      missionId: mission.id,
      name: 'HR team',
      leaderWorkerId: 'hr-worker',
      leaderRole: 'hr_ai',
      requiredRoles: ['hr_ai'],
    });
    await runtime.team.addMember(ORG, team.id, 'hr-worker', { role: 'hr_ai', responsibilities: [], decisionAuthority: 'none' });

    await runtime.orchestrator.startMission(ORG, mission.id);
    const { steps } = await runtime.queries.findCoordinationPlan({ organizationId: ORG, missionId: mission.id });

    // The team's only member owns step index 0, which starts life already 'ready' (not 'pending').
    const status = await runtime.orchestrator.advanceStep(ORG, steps[0]!.id); // ready -> running (no workflow started)
    expect(status).toBe('running');
  });
});
