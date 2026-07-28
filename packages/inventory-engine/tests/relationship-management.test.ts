import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getProductContext(ORG, 'product-1')).toBeNull();
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toBeNull();
    expect(
      await relationships.recordInventoryValuationEntry(ORG, {
        inventoryAccountId: 'acct-1',
        offsetAccountId: 'acct-2',
        amount: '100.00',
        currency: 'USD',
        entryDate: '2026-01-01',
      }),
    ).toBeNull();
    expect(await relationships.raiseInventoryApprovalWorkflow(ORG, { requestType: 'purchase_approval' })).toBeNull();
    expect(await relationships.notifyInventoryEvent(ORG, { title: 't' })).toBeNull();
    expect(await relationships.recordInventoryValueMetric(ORG, { metricName: 'inventory.total_value', value: 1000 })).toBeNull();
    expect(await relationships.logInventoryDecisionToMemory(ORG, { decision: 'd', reason: 'r' })).toBeNull();
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getProductContext() delegates to the real Business DNA product catalog', async () => {
    const deps: RelationshipManagementDeps = {
      businessDna: { products: { getProduct: async () => ({ id: 'product-1', name: 'Widget' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getProductContext(ORG, 'product-1')).toEqual({ id: 'product-1', name: 'Widget' });
  });

  it('getOpportunityContext() delegates to the real Sales Engine opportunity pipeline', async () => {
    const deps: RelationshipManagementDeps = {
      sales: { opportunities: { get: async () => ({ id: 'opp-1', amount: '5000.00' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toEqual({ id: 'opp-1', amount: '5000.00' });
  });

  it('recordInventoryValuationEntry() composes a real Finance Engine journal entry and posts it', async () => {
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
    const entry = await relationships.recordInventoryValuationEntry(ORG, {
      inventoryAccountId: 'acct-1',
      offsetAccountId: 'acct-2',
      amount: '250.00',
      currency: 'USD',
      entryDate: '2026-01-15',
    });
    expect(created).toHaveLength(1);
    expect(posted).toEqual(['entry-1']);
    expect(entry).toEqual({ id: 'entry-1', status: 'posted' });
  });

  it('recordInventoryValuationEntry() builds balanced debit/credit lines', async () => {
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
    await relationships.recordInventoryValuationEntry(ORG, {
      inventoryAccountId: 'acct-1',
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

  it('raiseInventoryApprovalWorkflow() defines a workflow once and reuses it for subsequent requests', async () => {
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
    const first = await relationships.raiseInventoryApprovalWorkflow(ORG, { requestType: 'purchase_approval' });
    const second = await relationships.raiseInventoryApprovalWorkflow(ORG, { requestType: 'purchase_approval' });
    expect(defineCalls).toBe(1);
    expect(first).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
    expect(second).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
  });

  it('notifyInventoryEvent() creates and sends a real escalation notification', async () => {
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
    const result = await relationships.notifyInventoryEvent(ORG, { title: 'Stock shortage detected' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('recordInventoryValueMetric() delegates to the real Analytics Engine metrics service', async () => {
    const deps: RelationshipManagementDeps = {
      analytics: {
        metrics: {
          recordGauge: async (_org: string, metricName: string, value: number) => ({ id: 'metric-1', metricName, value } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const metric = await relationships.recordInventoryValueMetric(ORG, { metricName: 'inventory.total_value', value: 12000 });
    expect(metric).toEqual({ id: 'metric-1', metricName: 'inventory.total_value', value: 12000 });
  });

  it('getProductContext() returns null when Business DNA is injected but the product is unknown', async () => {
    const deps: RelationshipManagementDeps = {
      businessDna: { products: { getProduct: async () => null } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getProductContext(ORG, 'missing')).toBeNull();
  });

  it('logInventoryDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        lifecycle: {
          create: async (_org: string, input: { title: string; knowledgeType: string }) => ({ id: 'know-1', title: input.title, knowledgeType: input.knowledgeType } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const entry = await relationships.logInventoryDecisionToMemory(ORG, { decision: 'Switched to FIFO for SKU-100', reason: 'cost volatility' });
    expect(entry).toEqual({ id: 'know-1', title: 'Switched to FIFO for SKU-100', knowledgeType: 'decision' });
  });
});
