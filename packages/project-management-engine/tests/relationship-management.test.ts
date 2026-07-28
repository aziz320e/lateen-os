import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toBeNull();
    expect(await relationships.getEmployeeContext(ORG, 'employee-1')).toBeNull();
    expect(await relationships.getAiWorkforceUtilizationContext(ORG)).toBeNull();
    expect(
      await relationships.recordProjectCostEntry(ORG, {
        projectAccountId: 'acct-1',
        offsetAccountId: 'acct-2',
        amount: '100.00',
        currency: 'USD',
        entryDate: '2026-01-01',
      }),
    ).toBeNull();
    expect(await relationships.reserveProjectMaterial(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '10.00' })).toBeNull();
    expect(await relationships.raiseProjectApprovalWorkflow(ORG, { requestType: 'budget_approval' })).toBeNull();
    expect(await relationships.notifyProjectEvent(ORG, { title: 't' })).toBeNull();
    expect(await relationships.recordProjectMetric(ORG, { metricName: 'project.progress', value: 50 })).toBeNull();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await relationships.logProjectDecisionToMemory(ORG, { decision: 'd', reason: 'r' })).toBeNull();
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getCustomerContext() delegates to the real CRM Engine customer lifecycle', async () => {
    const deps: RelationshipManagementDeps = {
      crm: { customers: { get: async () => ({ id: 'customer-1', name: 'Acme Co' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toEqual({ id: 'customer-1', name: 'Acme Co' });
  });

  it('getCustomerContext() returns null when CRM Engine is injected but the customer is unknown', async () => {
    const deps: RelationshipManagementDeps = { crm: { customers: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerContext(ORG, 'missing')).toBeNull();
  });

  it('getEmployeeContext() delegates to the real HR Engine employee management', async () => {
    const deps: RelationshipManagementDeps = {
      hr: { employees: { get: async () => ({ id: 'employee-1', firstName: 'Jane' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getEmployeeContext(ORG, 'employee-1')).toEqual({ id: 'employee-1', firstName: 'Jane' });
  });

  it('getAiWorkforceUtilizationContext() delegates to HR Engine’s own AI Workforce integration', async () => {
    const deps: RelationshipManagementDeps = {
      hr: {
        relationships: {
          getAiWorkforceUtilizationContext: async () => ({ busyCount: 2, activeCount: 5, utilizationPercentage: 40 } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAiWorkforceUtilizationContext(ORG)).toEqual({ busyCount: 2, activeCount: 5, utilizationPercentage: 40 });
  });

  it('recordProjectCostEntry() composes a real Finance Engine journal entry and posts it', async () => {
    const created: unknown[] = [];
    const posted: string[] = [];
    const deps: RelationshipManagementDeps = {
      finance: {
        generalLedger: {
          createJournalEntry: async (_org: string, input: unknown) => {
            created.push(input);
            return { id: 'entry-1', status: 'draft' } as never;
          },
          postJournalEntry: async (_org: string, entryId: string) => {
            posted.push(entryId);
            return { id: entryId, status: 'posted' } as never;
          },
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const entry = await relationships.recordProjectCostEntry(ORG, {
      projectAccountId: 'acct-1',
      offsetAccountId: 'acct-2',
      amount: '250.00',
      currency: 'USD',
      entryDate: '2026-01-15',
    });
    expect(created).toHaveLength(1);
    expect(posted).toEqual(['entry-1']);
    expect(entry).toEqual({ id: 'entry-1', status: 'posted' });
  });

  it('recordProjectCostEntry() builds balanced debit/credit lines', async () => {
    let capturedLines: readonly { debit: string; credit: string }[] = [];
    const deps: RelationshipManagementDeps = {
      finance: {
        generalLedger: {
          createJournalEntry: async (_org: string, input: { lines: readonly { debit: string; credit: string }[] }) => {
            capturedLines = input.lines;
            return { id: 'entry-1' } as never;
          },
          postJournalEntry: async () => ({ id: 'entry-1', status: 'posted' } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.recordProjectCostEntry(ORG, {
      projectAccountId: 'acct-1',
      offsetAccountId: 'acct-2',
      amount: '250.00',
      currency: 'USD',
      entryDate: '2026-01-15',
    });
    expect(capturedLines).toEqual([
      { accountId: 'acct-1', debit: '250.00', credit: '0.00' },
      { accountId: 'acct-2', debit: '0.00', credit: '250.00' },
    ]);
  });

  it('reserveProjectMaterial() delegates to the real Inventory Engine movement reservation', async () => {
    const deps: RelationshipManagementDeps = {
      inventory: { movements: { reserve: async (_org: string, input: unknown) => ({ id: 'movement-1', movementType: 'reservation', input } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    const movement = await relationships.reserveProjectMaterial(ORG, { itemId: 'item-1', warehouseId: 'wh-1', quantity: '10.00' });
    expect(movement).toMatchObject({ id: 'movement-1', movementType: 'reservation' });
  });

  it('raiseProjectApprovalWorkflow() defines a workflow once and reuses it for subsequent requests', async () => {
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
    const first = await relationships.raiseProjectApprovalWorkflow(ORG, { requestType: 'budget_approval' });
    const second = await relationships.raiseProjectApprovalWorkflow(ORG, { requestType: 'budget_approval' });
    expect(defineCalls).toBe(1);
    expect(first).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
    expect(second).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
  });

  it('notifyProjectEvent() creates and sends a real escalation notification', async () => {
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
    const result = await relationships.notifyProjectEvent(ORG, { title: 'Milestone at risk' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('recordProjectMetric() delegates to the real Analytics Engine metrics service', async () => {
    const deps: RelationshipManagementDeps = {
      analytics: {
        metrics: {
          recordGauge: async (_org: string, metricName: string, value: number) => ({ id: 'metric-1', metricName, value } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const metric = await relationships.recordProjectMetric(ORG, { metricName: 'project.progress', value: 75 });
    expect(metric).toEqual({ id: 'metric-1', metricName: 'project.progress', value: 75 });
  });

  it('getBusinessProfileContext() delegates to the real Business DNA business profile service', async () => {
    const deps: RelationshipManagementDeps = {
      businessDna: { businessProfile: { get: async () => ({ organizationId: ORG, legalName: 'Acme Corp' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBusinessProfileContext(ORG)).toEqual({ organizationId: ORG, legalName: 'Acme Corp' });
  });

  it('logProjectDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        lifecycle: {
          create: async (_org: string, input: { title: string; knowledgeType: string }) => ({ id: 'know-1', title: input.title, knowledgeType: input.knowledgeType } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const entry = await relationships.logProjectDecisionToMemory(ORG, { decision: 'Switched vendor', reason: 'cost overrun risk' });
    expect(entry).toEqual({ id: 'know-1', title: 'Switched vendor', knowledgeType: 'decision' });
  });
});
