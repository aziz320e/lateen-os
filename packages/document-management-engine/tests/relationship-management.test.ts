import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await relationships.logDocumentDecisionToMemory(ORG, { decision: 'd', reason: 'r' })).toBeNull();
    expect(await relationships.notifyDocumentEvent(ORG, { title: 't' })).toBeNull();
    expect(await relationships.getProjectContext(ORG, 'project-1')).toBeNull();
    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toBeNull();
    expect(await relationships.getCustomerSuccessContext(ORG, 'customer-1')).toBeNull();
    expect(await relationships.raiseDocumentApprovalWorkflow(ORG, { requestType: 'contract_approval' })).toBeNull();
    expect(await relationships.recordDocumentMetric(ORG, { metricName: 'document.count', value: 10 })).toBeNull();
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getBusinessProfileContext() delegates to the real Business DNA business profile service', async () => {
    const deps: RelationshipManagementDeps = {
      businessDna: { businessProfile: { get: async () => ({ organizationId: ORG, legalName: 'Acme Corp' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBusinessProfileContext(ORG)).toEqual({ organizationId: ORG, legalName: 'Acme Corp' });
  });

  it('logDocumentDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        lifecycle: {
          create: async (_org: string, input: { title: string; knowledgeType: string }) => ({ id: 'know-1', title: input.title, knowledgeType: input.knowledgeType } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const entry = await relationships.logDocumentDecisionToMemory(ORG, { decision: 'Approved contract v3', reason: 'legal sign-off received' });
    expect(entry).toEqual({ id: 'know-1', title: 'Approved contract v3', knowledgeType: 'decision' });
  });

  it('notifyDocumentEvent() creates and sends a real escalation notification', async () => {
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
    const result = await relationships.notifyDocumentEvent(ORG, { title: 'Document pending approval' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('getProjectContext() delegates to the real Project Management Engine', async () => {
    const deps: RelationshipManagementDeps = {
      projects: { projects: { get: async () => ({ id: 'project-1', name: 'Website Revamp' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getProjectContext(ORG, 'project-1')).toEqual({ id: 'project-1', name: 'Website Revamp' });
  });

  it('getProjectContext() returns null when injected but the project is unknown', async () => {
    const deps: RelationshipManagementDeps = { projects: { projects: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getProjectContext(ORG, 'missing')).toBeNull();
  });

  it('getCustomerContext() delegates to the real CRM Engine customer lifecycle', async () => {
    const deps: RelationshipManagementDeps = {
      crm: { customers: { get: async () => ({ id: 'customer-1', name: 'Acme Retail' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toEqual({ id: 'customer-1', name: 'Acme Retail' });
  });

  it('getCustomerSuccessContext() delegates to the real Customer Success Engine', async () => {
    const deps: RelationshipManagementDeps = {
      customerSuccess: { customers: { findByCustomer: async () => ({ id: 'record-1', customerId: 'customer-1', status: 'onboarding' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerSuccessContext(ORG, 'customer-1')).toEqual({ id: 'record-1', customerId: 'customer-1', status: 'onboarding' });
  });

  it('raiseDocumentApprovalWorkflow() defines a workflow once and reuses it for subsequent requests', async () => {
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
    const first = await relationships.raiseDocumentApprovalWorkflow(ORG, { requestType: 'contract_approval' });
    const second = await relationships.raiseDocumentApprovalWorkflow(ORG, { requestType: 'contract_approval' });
    expect(defineCalls).toBe(1);
    expect(first).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
    expect(second).toEqual({ workflowDefinitionId: 'def-1', workflowInstanceId: 'instance-1' });
  });

  it('recordDocumentMetric() delegates to the real Analytics Engine metrics service', async () => {
    const deps: RelationshipManagementDeps = {
      analytics: {
        metrics: {
          recordGauge: async (_org: string, metricName: string, value: number) => ({ id: 'metric-1', metricName, value } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const metric = await relationships.recordDocumentMetric(ORG, { metricName: 'document.count', value: 42 });
    expect(metric).toEqual({ id: 'metric-1', metricName: 'document.count', value: 42 });
  });

  it('getCustomerContext() returns null when CRM Engine is injected but the customer is unknown', async () => {
    const deps: RelationshipManagementDeps = { crm: { customers: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerContext(ORG, 'missing')).toBeNull();
  });

  it('getCustomerSuccessContext() returns null when Customer Success Engine is injected but no record exists', async () => {
    const deps: RelationshipManagementDeps = { customerSuccess: { customers: { findByCustomer: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerSuccessContext(ORG, 'missing')).toBeNull();
  });

  it('getBusinessProfileContext() returns null when Business DNA has no profile for the organization', async () => {
    const deps: RelationshipManagementDeps = { businessDna: { businessProfile: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
  });

  it('notifyDocumentEvent() passes through an optional body', async () => {
    const captured: { title: string; body?: string }[] = [];
    const deps: RelationshipManagementDeps = {
      communicationHub: {
        notifications: {
          create: async (_org: string, input: { notificationType: string; title: string; body?: string }) => {
            captured.push({ title: input.title, body: input.body });
            return { id: 'notif-1' } as never;
          },
          send: async () => ({ id: 'notif-1', status: 'sent' } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.notifyDocumentEvent(ORG, { title: 'Alert', body: 'Details' });
    expect(captured).toEqual([{ title: 'Alert', body: 'Details' }]);
  });

  it('getProjectContext() returns null when Project Management Engine is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getProjectContext('org-1', 'project-1')).toBeNull();
  });

  it('logDocumentDecisionToMemory() returns null when Institutional Memory is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.logDocumentDecisionToMemory('org-1', { decision: 'd', reason: 'r' })).toBeNull();
  });

  it('raiseDocumentApprovalWorkflow() defines separate workflows for different requestTypes', async () => {
    let defineCalls = 0;
    const deps: RelationshipManagementDeps = {
      workflow: {
        defineWorkflow: async () => {
          defineCalls += 1;
          return { definition: { id: `def-${defineCalls}` }, version: { id: 'ver-1' } } as never;
        },
        startWorkflow: async () => ({ id: 'instance-1' } as never),
      },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.raiseDocumentApprovalWorkflow(ORG, { requestType: 'contract_approval' });
    await relationships.raiseDocumentApprovalWorkflow(ORG, { requestType: 'policy_approval' });
    expect(defineCalls).toBe(2);
  });
});
