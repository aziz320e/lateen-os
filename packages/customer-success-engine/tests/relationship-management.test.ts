import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null/empty when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toBeNull();
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toBeNull();
    expect(await relationships.getCustomerProjectsContext(ORG, 'customer-1')).toEqual([]);
    expect(await relationships.notifyCustomerSuccessEvent(ORG, { title: 't' })).toBeNull();
    expect(await relationships.recordCustomerSuccessMetric(ORG, { metricName: 'customer.health', value: 80 })).toBeNull();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await relationships.logCustomerSuccessDecisionToMemory(ORG, { decision: 'd', reason: 'r' })).toBeNull();
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

  it('getOpportunityContext() delegates to the real Sales Engine opportunity pipeline', async () => {
    const deps: RelationshipManagementDeps = {
      sales: { opportunities: { get: async () => ({ id: 'opp-1', amount: '5000.00' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toEqual({ id: 'opp-1', amount: '5000.00' });
  });

  it('getCustomerProjectsContext() delegates to the real Project Management Engine query layer, filtering by customerId', async () => {
    const deps: RelationshipManagementDeps = {
      projects: {
        queries: {
          findProjects: async () => ({
            projects: [
              { id: 'project-1', customerId: 'customer-1', name: 'A' } as never,
              { id: 'project-2', customerId: 'customer-2', name: 'B' } as never,
            ],
            total: 2,
          }),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const projects = await relationships.getCustomerProjectsContext(ORG, 'customer-1');
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({ id: 'project-1' });
  });

  it('notifyCustomerSuccessEvent() creates and sends a real escalation notification', async () => {
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
    const result = await relationships.notifyCustomerSuccessEvent(ORG, { title: 'Customer at risk' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('recordCustomerSuccessMetric() delegates to the real Analytics Engine metrics service', async () => {
    const deps: RelationshipManagementDeps = {
      analytics: {
        metrics: {
          recordGauge: async (_org: string, metricName: string, value: number) => ({ id: 'metric-1', metricName, value } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const metric = await relationships.recordCustomerSuccessMetric(ORG, { metricName: 'customer.health', value: 80 });
    expect(metric).toEqual({ id: 'metric-1', metricName: 'customer.health', value: 80 });
  });

  it('getBusinessProfileContext() delegates to the real Business DNA business profile service', async () => {
    const deps: RelationshipManagementDeps = {
      businessDna: { businessProfile: { get: async () => ({ organizationId: ORG, legalName: 'Acme Corp' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBusinessProfileContext(ORG)).toEqual({ organizationId: ORG, legalName: 'Acme Corp' });
  });

  it('getCustomerProjectsContext() returns an empty array when the customer has no linked projects', async () => {
    const deps: RelationshipManagementDeps = {
      projects: { queries: { findProjects: async () => ({ projects: [{ id: 'p1', customerId: 'other-customer' } as never], total: 1 }) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerProjectsContext(ORG, 'customer-1')).toEqual([]);
  });

  it('getOpportunityContext() returns null when Sales Engine is injected but the opportunity is unknown', async () => {
    const deps: RelationshipManagementDeps = { sales: { opportunities: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getOpportunityContext(ORG, 'missing')).toBeNull();
  });

  it('getBusinessProfileContext() returns null when Business DNA has no profile for the organization', async () => {
    const deps: RelationshipManagementDeps = { businessDna: { businessProfile: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
  });

  it('notifyCustomerSuccessEvent() passes through an optional body', async () => {
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
    await relationships.notifyCustomerSuccessEvent(ORG, { title: 'Alert', body: 'Details here' });
    expect(captured).toEqual([{ title: 'Alert', body: 'Details here' }]);
  });

  it('logCustomerSuccessDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        lifecycle: {
          create: async (_org: string, input: { title: string; knowledgeType: string }) => ({ id: 'know-1', title: input.title, knowledgeType: input.knowledgeType } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const entry = await relationships.logCustomerSuccessDecisionToMemory(ORG, { decision: 'Escalated to CSM', reason: 'health score dropped' });
    expect(entry).toEqual({ id: 'know-1', title: 'Escalated to CSM', knowledgeType: 'decision' });
  });
});
