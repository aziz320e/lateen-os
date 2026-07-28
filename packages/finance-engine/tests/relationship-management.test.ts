import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getCustomerContext(ORG, 'cust-1')).toBeNull();
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toBeNull();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await relationships.raiseFinanceApprovalWorkflow(ORG, { requestType: 'invoice_approval' })).toBeNull();
    expect(await relationships.notifyFinanceEvent(ORG, { title: 't' })).toBeNull();
    expect(await relationships.recordRevenueKpi(ORG, { value: 100 })).toBeNull();
    expect(await relationships.logFinanceDecisionToMemory(ORG, { decision: 'd', reason: 'r' })).toBeNull();
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getCustomerContext() delegates to the real CRM Engine customer service', async () => {
    const deps: RelationshipManagementDeps = {
      crm: { customers: { get: async () => ({ id: 'cust-1', displayName: 'Acme' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerContext(ORG, 'cust-1')).toEqual({ id: 'cust-1', displayName: 'Acme' });
  });

  it('getOpportunityContext() delegates to the real Sales Engine opportunity pipeline', async () => {
    const deps: RelationshipManagementDeps = {
      sales: { opportunities: { get: async () => ({ id: 'opp-1', amount: '5000.00' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toEqual({ id: 'opp-1', amount: '5000.00' });
  });

  it('getBusinessProfileContext() delegates to the real Business DNA service', async () => {
    const deps: RelationshipManagementDeps = {
      businessDna: { businessProfile: { get: async () => ({ id: 'profile-1' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBusinessProfileContext(ORG)).toEqual({ id: 'profile-1' });
  });

  it('raiseFinanceApprovalWorkflow() defines a workflow once and reuses it for subsequent requests', async () => {
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
    const first = await relationships.raiseFinanceApprovalWorkflow(ORG, { requestType: 'invoice_approval' });
    const second = await relationships.raiseFinanceApprovalWorkflow(ORG, { requestType: 'invoice_approval' });
    expect(defineCalls).toBe(1);
    expect(first).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
    expect(second).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
  });

  it('notifyFinanceEvent() creates and sends a real escalation notification', async () => {
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
    const result = await relationships.notifyFinanceEvent(ORG, { title: 'Invoice overdue' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('recordRevenueKpi() delegates to the real Analytics Engine KPI service', async () => {
    const deps: RelationshipManagementDeps = {
      analytics: { kpis: { recordRevenue: async (_org: string, input: { value: number }) => ({ id: 'kpi-1', value: input.value } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    const kpi = await relationships.recordRevenueKpi(ORG, { value: 5000 });
    expect(kpi).toEqual({ id: 'kpi-1', value: 5000 });
  });

  it('logFinanceDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        lifecycle: {
          create: async (_org: string, input: { title: string; knowledgeType: string }) => ({ id: 'know-1', title: input.title, knowledgeType: input.knowledgeType } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const entry = await relationships.logFinanceDecisionToMemory(ORG, { decision: 'Closed FY2025', reason: 'year-end close' });
    expect(entry).toEqual({ id: 'know-1', title: 'Closed FY2025', knowledgeType: 'decision' });
  });
});
