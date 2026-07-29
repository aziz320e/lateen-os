import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null/empty when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getApiGatewayContext(ORG)).toEqual([]);
    expect(await relationships.getAdminOrganizationContext(ORG)).toBeNull();
    expect(await relationships.getAgentContext(ORG, 'agent-1')).toBeNull();
    expect(await relationships.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish' })).toBeNull();
    expect(await relationships.getAnalyticsSnapshotContext(ORG)).toEqual([]);
    expect(await relationships.getObservabilityHealthContext(ORG)).toEqual([]);
    expect(await relationships.notifyMarketplaceEvent(ORG, { title: 't' })).toBeNull();
    expect(await relationships.logMarketplaceDecisionToMemory(ORG, { decision: 'd', reason: 'r' })).toBeNull();
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getApiGatewayContext() delegates to the real API Gateway query layer', async () => {
    const deps: RelationshipManagementDeps = { apiGateway: { queries: { findApis: async () => ({ apis: [{ id: 'api-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getApiGatewayContext(ORG)).toEqual([{ id: 'api-1' }]);
  });

  it('getAdminOrganizationContext() delegates to the real Admin Console organization registry', async () => {
    const deps: RelationshipManagementDeps = { adminConsole: { organizations: { getOrganization: async () => ({ id: ORG, name: 'Acme Co' } as never) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAdminOrganizationContext(ORG)).toEqual({ id: ORG, name: 'Acme Co' });
  });

  it('getAdminOrganizationContext() returns null when Admin Console has no record for the organization', async () => {
    const deps: RelationshipManagementDeps = { adminConsole: { organizations: { getOrganization: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAdminOrganizationContext(ORG)).toBeNull();
  });

  it('getAgentContext() delegates to the real AI Runtime findAgent query', async () => {
    const deps: RelationshipManagementDeps = { aiRuntime: { findAgent: async () => ({ agents: [{ id: 'agent-1' } as never] }) } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAgentContext(ORG, 'agent-1')).toEqual({ id: 'agent-1' });
  });

  it('getAgentContext() returns null when AI Runtime finds no matching agent', async () => {
    const deps: RelationshipManagementDeps = { aiRuntime: { findAgent: async () => ({ agents: [] }) } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAgentContext(ORG, 'missing')).toBeNull();
  });

  it('raiseExtensionApprovalWorkflow() defines and starts a real Workflow Engine workflow', async () => {
    let defineCalls = 0;
    const deps: RelationshipManagementDeps = {
      workflow: {
        defineWorkflow: async () => {
          defineCalls += 1;
          return { definition: { id: 'definition-1' } as never };
        },
        startWorkflow: async () => ({ id: 'instance-1' } as never),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish' });
    expect(result).toEqual({ workflowDefinitionId: 'definition-1', workflowInstanceId: 'instance-1' });
    expect(defineCalls).toBe(1);
  });

  it('raiseExtensionApprovalWorkflow() reuses the cached definition for the same (org, requestType)', async () => {
    let defineCalls = 0;
    const deps: RelationshipManagementDeps = {
      workflow: {
        defineWorkflow: async () => {
          defineCalls += 1;
          return { definition: { id: 'definition-1' } as never };
        },
        startWorkflow: async () => ({ id: 'instance-1' } as never),
      },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish' });
    await relationships.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish' });
    expect(defineCalls).toBe(1);
  });

  it('getAnalyticsSnapshotContext() delegates to the real Analytics Engine query layer', async () => {
    const deps: RelationshipManagementDeps = { analytics: { queries: { findKPIs: async () => ({ kpis: [{ id: 'kpi-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAnalyticsSnapshotContext(ORG)).toEqual([{ id: 'kpi-1' }]);
  });

  it('getObservabilityHealthContext() delegates to the real Observability Engine query layer', async () => {
    const deps: RelationshipManagementDeps = { observability: { queries: { findHealth: async () => ({ checks: [{ id: 'check-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getObservabilityHealthContext(ORG)).toEqual([{ id: 'check-1' }]);
  });

  it('notifyMarketplaceEvent() creates and sends a real escalation notification', async () => {
    const sent: string[] = [];
    const deps: RelationshipManagementDeps = {
      communicationHub: {
        notifications: {
          create: async (_organizationId: string, input: { notificationType: string; title: string }) => ({ id: 'notif-1', notificationType: input.notificationType, title: input.title } as never),
          send: async (_organizationId: string, notificationId: string) => {
            sent.push(notificationId);
            return { id: notificationId, status: 'sent' } as never;
          },
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.notifyMarketplaceEvent(ORG, { title: 'Extension installed' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('notifyMarketplaceEvent() passes through an optional body', async () => {
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
    await relationships.notifyMarketplaceEvent(ORG, { title: 'Alert', body: 'Details here' });
    expect(captured).toEqual([{ title: 'Alert', body: 'Details here' }]);
  });

  it('logMarketplaceDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const captured: { knowledgeType: string; category: string; source: string }[] = [];
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        lifecycle: {
          create: async (_org: string, input: { knowledgeType: string; category: string; source: string }) => {
            captured.push({ knowledgeType: input.knowledgeType, category: input.category, source: input.source });
            return { id: 'knowledge-1' } as never;
          },
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const entry = await relationships.logMarketplaceDecisionToMemory(ORG, { decision: 'Approved extension publish', reason: 'passed review' });
    expect(entry).toEqual({ id: 'knowledge-1' });
    expect(captured).toEqual([{ knowledgeType: 'decision', category: 'operational', source: 'marketplace' }]);
  });

  it('getApiGatewayContext() returns an empty array when API Gateway has no registered apis', async () => {
    const deps: RelationshipManagementDeps = { apiGateway: { queries: { findApis: async () => ({ apis: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getApiGatewayContext(ORG)).toEqual([]);
  });

  it('getAnalyticsSnapshotContext() returns an empty array when Analytics Engine has no KPI snapshots', async () => {
    const deps: RelationshipManagementDeps = { analytics: { queries: { findKPIs: async () => ({ kpis: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAnalyticsSnapshotContext(ORG)).toEqual([]);
  });

  it('getObservabilityHealthContext() returns an empty array when Observability Engine has no checks', async () => {
    const deps: RelationshipManagementDeps = { observability: { queries: { findHealth: async () => ({ checks: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getObservabilityHealthContext(ORG)).toEqual([]);
  });

  it('notifyMarketplaceEvent() returns null when Communication Hub is not injected, even with a body given', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.notifyMarketplaceEvent(ORG, { title: 't', body: 'b' })).toBeNull();
  });

  it('logMarketplaceDecisionToMemory() returns null when Institutional Memory is not injected, even with full input given', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.logMarketplaceDecisionToMemory(ORG, { decision: 'Full decision', reason: 'Full reason' })).toBeNull();
  });

  it('raiseExtensionApprovalWorkflow() derives distinct definitions for two different request types', async () => {
    const defined: string[] = [];
    const deps: RelationshipManagementDeps = {
      workflow: {
        defineWorkflow: async (input: { code: string }) => {
          defined.push(input.code);
          return { definition: { id: `definition-${defined.length}` } as never };
        },
        startWorkflow: async () => ({ id: 'instance-1' } as never),
      },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish' });
    await relationships.raiseExtensionApprovalWorkflow(ORG, { requestType: 'uninstall-review' });
    expect(defined).toEqual(['marketplace.publish', 'marketplace.uninstall-review']);
  });

  it('each Relationship Layer method only calls its own collaborator, never another one', async () => {
    let apiGatewayCalls = 0;
    let analyticsCalls = 0;
    const deps: RelationshipManagementDeps = {
      apiGateway: { queries: { findApis: async () => { apiGatewayCalls += 1; return { apis: [], total: 0 }; } } as never },
      analytics: { queries: { findKPIs: async () => { analyticsCalls += 1; return { kpis: [], total: 0 }; } } as never },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.getApiGatewayContext(ORG);
    expect(apiGatewayCalls).toBe(1);
    expect(analyticsCalls).toBe(0);
  });

  it('raiseExtensionApprovalWorkflow() passes optional notes through to the started instance variables', async () => {
    const captured: unknown[] = [];
    const deps: RelationshipManagementDeps = {
      workflow: {
        defineWorkflow: async () => ({ definition: { id: 'definition-1' } as never }),
        startWorkflow: async (input: { variables?: Readonly<Record<string, unknown>> }) => {
          captured.push(input.variables);
          return { id: 'instance-1' } as never;
        },
      },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.raiseExtensionApprovalWorkflow(ORG, { requestType: 'publish', notes: 'urgent review' });
    expect(captured).toEqual([{ notes: 'urgent review' }]);
  });

  it('getAgentContext() without a runtimeAgentId still queries AI Runtime', async () => {
    let received: unknown;
    const deps: RelationshipManagementDeps = { aiRuntime: { findAgent: async (query: unknown) => { received = query; return { agents: [] }; } } };
    const relationships = createRelationshipManagement(deps);
    await relationships.getAgentContext(ORG);
    expect(received).toEqual({ organizationId: ORG, runtimeAgentId: undefined });
  });

  it('getAdminOrganizationContext() only calls Admin Console, never any other collaborator', async () => {
    let adminCalls = 0;
    let apiGatewayCalls = 0;
    const deps: RelationshipManagementDeps = {
      adminConsole: { organizations: { getOrganization: async () => { adminCalls += 1; return null; } } as never },
      apiGateway: { queries: { findApis: async () => { apiGatewayCalls += 1; return { apis: [], total: 0 }; } } as never },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.getAdminOrganizationContext(ORG);
    expect(adminCalls).toBe(1);
    expect(apiGatewayCalls).toBe(0);
  });

  it('getObservabilityHealthContext() only calls Observability Engine, never any other collaborator', async () => {
    let observabilityCalls = 0;
    let communicationCalls = 0;
    const deps: RelationshipManagementDeps = {
      observability: { queries: { findHealth: async () => { observabilityCalls += 1; return { checks: [], total: 0 }; } } as never },
      communicationHub: { notifications: { create: async () => { communicationCalls += 1; return { id: 'n' } as never; }, send: async () => ({ id: 'n' } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.getObservabilityHealthContext(ORG);
    expect(observabilityCalls).toBe(1);
    expect(communicationCalls).toBe(0);
  });

  it('notifyMarketplaceEvent() without a body still sends a notification', async () => {
    const deps: RelationshipManagementDeps = {
      communicationHub: {
        notifications: {
          create: async () => ({ id: 'notif-1' } as never),
          send: async () => ({ id: 'notif-1', status: 'sent' } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.notifyMarketplaceEvent(ORG, { title: 'No body' });
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });
});
