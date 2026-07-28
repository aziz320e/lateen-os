import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await relationships.recordPayrollTaxWithholding(ORG, { taxRuleId: 'tax-1', taxableAmount: '100.00' })).toBeNull();
    expect(await relationships.getAiWorkforceUtilizationContext(ORG)).toBeNull();
    expect(await relationships.raiseHrApprovalWorkflow(ORG, { requestType: 'termination_approval' })).toBeNull();
    expect(await relationships.notifyHrEvent(ORG, { title: 't' })).toBeNull();
    expect(await relationships.recordWorkforceUtilizationKpi(ORG, { value: 80 })).toBeNull();
    expect(await relationships.logHrDecisionToMemory(ORG, { decision: 'd', reason: 'r' })).toBeNull();
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getBusinessProfileContext() delegates to the real Business DNA service', async () => {
    const deps: RelationshipManagementDeps = {
      businessDna: { businessProfile: { get: async () => ({ id: 'profile-1' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBusinessProfileContext(ORG)).toEqual({ id: 'profile-1' });
  });

  it('recordPayrollTaxWithholding() delegates to the real Finance Engine tax service', async () => {
    const deps: RelationshipManagementDeps = {
      finance: {
        tax: {
          calculateAndRecord: async (_org: string, taxRuleId: string, taxableAmount: string) =>
            ({ id: 'calc-1', taxRuleId, taxableAmount, taxAmount: '15.00' } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const calc = await relationships.recordPayrollTaxWithholding(ORG, { taxRuleId: 'tax-1', taxableAmount: '100.00' });
    expect(calc).toEqual({ id: 'calc-1', taxRuleId: 'tax-1', taxableAmount: '100.00', taxAmount: '15.00' });
  });

  it('getAiWorkforceUtilizationContext() computes utilization from real AI Workforce worker statuses', async () => {
    const deps: RelationshipManagementDeps = {
      aiWorkforce: {
        findWorkers: async () => ({
          workers: [{ status: 'busy' }, { status: 'active' }, { status: 'idle' }] as never,
          total: 3,
        }),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const context = await relationships.getAiWorkforceUtilizationContext(ORG);
    expect(context).toEqual({ busyCount: 1, activeCount: 2, utilizationPercentage: 50 });
  });

  it('raiseHrApprovalWorkflow() defines a workflow once and reuses it for subsequent requests', async () => {
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
    const first = await relationships.raiseHrApprovalWorkflow(ORG, { requestType: 'termination_approval' });
    const second = await relationships.raiseHrApprovalWorkflow(ORG, { requestType: 'termination_approval' });
    expect(defineCalls).toBe(1);
    expect(first).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
    expect(second).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
  });

  it('notifyHrEvent() creates and sends a real escalation notification', async () => {
    const sent: string[] = [];
    const deps: RelationshipManagementDeps = {
      communicationHub: {
        notifications: {
          create: async (_organizationId: string, input: { notificationType: string; title: string }) =>
            ({ id: 'notif-1', notificationType: input.notificationType, title: input.title } as never),
          send: async (_organizationId: string, notificationId: string) => {
            sent.push(notificationId);
            return { id: notificationId, status: 'sent' } as never;
          },
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.notifyHrEvent(ORG, { title: 'Leave request pending' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('recordWorkforceUtilizationKpi() delegates to the real Analytics Engine KPI service', async () => {
    const deps: RelationshipManagementDeps = {
      analytics: { kpis: { recordWorkforceUtilization: async (_org: string, input: { value: number }) => ({ id: 'kpi-1', value: input.value } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    const kpi = await relationships.recordWorkforceUtilizationKpi(ORG, { value: 72 });
    expect(kpi).toEqual({ id: 'kpi-1', value: 72 });
  });

  it('getAiWorkforceUtilizationContext() is 0% when there are no active workers', async () => {
    const deps: RelationshipManagementDeps = {
      aiWorkforce: { findWorkers: async () => ({ workers: [] as never, total: 0 }) },
    };
    const relationships = createRelationshipManagement(deps);
    const context = await relationships.getAiWorkforceUtilizationContext(ORG);
    expect(context).toEqual({ busyCount: 0, activeCount: 0, utilizationPercentage: 0 });
  });

  it('logHrDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        lifecycle: {
          create: async (_org: string, input: { title: string; knowledgeType: string }) => ({ id: 'know-1', title: input.title, knowledgeType: input.knowledgeType } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const entry = await relationships.logHrDecisionToMemory(ORG, { decision: 'Approved reorg', reason: 'restructuring' });
    expect(entry).toEqual({ id: 'know-1', title: 'Approved reorg', knowledgeType: 'decision' });
  });
});
