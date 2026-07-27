import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getSecurityViolationsContext(ORG)).toBeNull();
    expect(await relationships.getRuntimeAgentContext(ORG)).toBeNull();
    expect(await relationships.getRuntimeStateContext(ORG)).toBeNull();
    expect(await relationships.getBrainPlanContext(ORG, 'plan-1')).toBeNull();
    expect(await relationships.raiseGovernanceWorkflowRequest(ORG, { requestType: 'policy_review' })).toBeNull();
    expect(await relationships.notifyGovernanceEvent(ORG, { title: 't' })).toBeNull();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getSecurityViolationsContext() delegates to the real AI Security Engine queries', async () => {
    const deps: RelationshipManagementDeps = {
      aiSecurity: {
        queries: {
          findViolations: async () => ({ violations: [{ id: 'v1' }] as never, total: 1 }),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const violations = await relationships.getSecurityViolationsContext(ORG);
    expect(violations).toHaveLength(1);
  });

  it('getRuntimeAgentContext() delegates to the real AI Runtime queries', async () => {
    const deps: RelationshipManagementDeps = {
      aiRuntime: {
        findAgent: async () => ({ agents: [{ id: 'a1' }] as never }),
        findRuntimeState: async () => ({ state: 'idle', activeSessionCount: 0, queuedTaskCount: 0 } as never),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.getRuntimeAgentContext(ORG, 'agent-1');
    expect(result?.agents).toHaveLength(1);
  });

  it('getRuntimeStateContext() delegates to the real AI Runtime queries', async () => {
    const deps: RelationshipManagementDeps = {
      aiRuntime: {
        findAgent: async () => ({ agents: [] }),
        findRuntimeState: async () => ({ state: 'idle', activeSessionCount: 2, queuedTaskCount: 0 } as never),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.getRuntimeStateContext(ORG);
    expect(result?.activeSessionCount).toBe(2);
  });

  it('getBrainPlanContext() returns null when the plan is unknown (catches the thrown error)', async () => {
    const deps: RelationshipManagementDeps = {
      aiBrain: {
        queries: {
          explainPlan: async () => {
            throw new Error('plan not found');
          },
        },
      },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBrainPlanContext(ORG, 'missing-plan')).toBeNull();
  });

  it('getBrainPlanContext() returns the real explanation when the plan is known', async () => {
    const deps: RelationshipManagementDeps = {
      aiBrain: {
        queries: {
          explainPlan: async () => ({ summary: 'explained' } as never),
        },
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.getBrainPlanContext(ORG, 'plan-1');
    expect(result).toEqual({ summary: 'explained' });
  });

  it('raiseGovernanceWorkflowRequest() defines a workflow once and reuses it for subsequent requests', async () => {
    let defineCalls = 0;
    const deps: RelationshipManagementDeps = {
      workflow: {
        defineWorkflow: async () => {
          defineCalls += 1;
          return { definition: { id: 'def-1' }, version: { id: 'ver-1' } } as never;
        },
        startWorkflow: async () => ({ id: 'instance-1' } as never),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const first = await relationships.raiseGovernanceWorkflowRequest(ORG, { requestType: 'policy_review' });
    const second = await relationships.raiseGovernanceWorkflowRequest(ORG, { requestType: 'policy_review' });
    expect(defineCalls).toBe(1);
    expect(first).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
    expect(second).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
  });

  it('notifyGovernanceEvent() creates and sends a real escalation notification', async () => {
    const sent: string[] = [];
    const deps: RelationshipManagementDeps = {
      communicationHub: {
        notifications: {
          create: async (_organizationId: string, input: { notificationType: string; title: string }) => ({
            id: 'notif-1',
            notificationType: input.notificationType,
            title: input.title,
          } as never),
          send: async (_organizationId: string, notificationId: string) => {
            sent.push(notificationId);
            return { id: notificationId, status: 'sent' } as never;
          },
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.notifyGovernanceEvent(ORG, { title: 'Risk escalated' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('getBusinessProfileContext() delegates to the real Business DNA service', async () => {
    const deps: RelationshipManagementDeps = {
      businessDna: {
        businessProfile: {
          get: async () => ({ id: 'profile-1' } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const profile = await relationships.getBusinessProfileContext(ORG);
    expect(profile).toEqual({ id: 'profile-1' });
  });
});
