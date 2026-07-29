import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null/empty when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getApiGatewayContext(ORG)).toEqual([]);
    expect(await relationships.getObservabilityHealthContext(ORG)).toEqual([]);
    expect(await relationships.getAnalyticsSnapshotContext(ORG)).toEqual([]);
    expect(await relationships.getSecurityPolicyContext(ORG)).toEqual([]);
    expect(await relationships.getGovernancePolicyContext(ORG)).toEqual([]);
    expect(await relationships.getComplianceFrameworkContext(ORG)).toEqual([]);
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await relationships.logAdminDecisionToMemory(ORG, { decision: 'd', reason: 'r' })).toBeNull();
    expect(await relationships.notifyAdminEvent(ORG, { title: 't' })).toBeNull();
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getApiGatewayContext() delegates to the real API Gateway query layer', async () => {
    const deps: RelationshipManagementDeps = { apiGateway: { queries: { findApis: async () => ({ apis: [{ id: 'api-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getApiGatewayContext(ORG)).toEqual([{ id: 'api-1' }]);
  });

  it('getObservabilityHealthContext() delegates to the real Observability Engine query layer', async () => {
    const deps: RelationshipManagementDeps = { observability: { queries: { findHealth: async () => ({ checks: [{ id: 'check-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getObservabilityHealthContext(ORG)).toEqual([{ id: 'check-1' }]);
  });

  it('getAnalyticsSnapshotContext() delegates to the real Analytics Engine query layer', async () => {
    const deps: RelationshipManagementDeps = { analytics: { queries: { findKPIs: async () => ({ kpis: [{ id: 'kpi-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAnalyticsSnapshotContext(ORG)).toEqual([{ id: 'kpi-1' }]);
  });

  it('getSecurityPolicyContext() delegates to the real AI Security Engine query layer', async () => {
    const deps: RelationshipManagementDeps = { aiSecurity: { queries: { findPolicies: async () => ({ policies: [{ id: 'policy-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getSecurityPolicyContext(ORG)).toEqual([{ id: 'policy-1' }]);
  });

  it('getGovernancePolicyContext() delegates to the real AI Governance Engine query layer', async () => {
    const deps: RelationshipManagementDeps = { aiGovernance: { queries: { findPolicies: async () => ({ policies: [{ id: 'policy-2' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getGovernancePolicyContext(ORG)).toEqual([{ id: 'policy-2' }]);
  });

  it('getComplianceFrameworkContext() delegates to the real AI Compliance Engine query layer', async () => {
    const deps: RelationshipManagementDeps = { aiCompliance: { queries: { findFrameworks: async () => ({ frameworks: [{ id: 'framework-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getComplianceFrameworkContext(ORG)).toEqual([{ id: 'framework-1' }]);
  });

  it('getBusinessProfileContext() delegates to the real Business DNA business profile service', async () => {
    const deps: RelationshipManagementDeps = { businessDna: { businessProfile: { get: async () => ({ organizationId: ORG, displayName: 'Acme Corp' } as never) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBusinessProfileContext(ORG)).toEqual({ organizationId: ORG, displayName: 'Acme Corp' });
  });

  it('getBusinessProfileContext() returns null when Business DNA has no profile for the organization', async () => {
    const deps: RelationshipManagementDeps = { businessDna: { businessProfile: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
  });

  it('logAdminDecisionToMemory() logs a real Institutional Memory decision entry', async () => {
    const captured: { title: string; content: string; knowledgeType: string; category: string; source: string }[] = [];
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        lifecycle: {
          create: async (_org: string, input: { title: string; content: string; knowledgeType: string; category: string; source: string }) => {
            captured.push(input);
            return { id: 'knowledge-1', title: input.title } as never;
          },
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const entry = await relationships.logAdminDecisionToMemory(ORG, { decision: 'Suspended tenant', reason: 'billing failure' });
    expect(entry).toEqual({ id: 'knowledge-1', title: 'Suspended tenant' });
    expect(captured).toEqual([{ title: 'Suspended tenant', content: 'billing failure', knowledgeType: 'decision', category: 'operational', source: 'admin-console' }]);
  });

  it('notifyAdminEvent() creates and sends a real escalation notification', async () => {
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
    const result = await relationships.notifyAdminEvent(ORG, { title: 'Tenant suspended' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('getApiGatewayContext() returns an empty array when API Gateway has no registered apis', async () => {
    const deps: RelationshipManagementDeps = { apiGateway: { queries: { findApis: async () => ({ apis: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getApiGatewayContext(ORG)).toEqual([]);
  });

  it('getObservabilityHealthContext() returns an empty array when Observability Engine has no checks', async () => {
    const deps: RelationshipManagementDeps = { observability: { queries: { findHealth: async () => ({ checks: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getObservabilityHealthContext(ORG)).toEqual([]);
  });

  it('getGovernancePolicyContext() returns an empty array when AI Governance Engine has no policies', async () => {
    const deps: RelationshipManagementDeps = { aiGovernance: { queries: { findPolicies: async () => ({ policies: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getGovernancePolicyContext(ORG)).toEqual([]);
  });

  it('logAdminDecisionToMemory() always logs with the fixed "decision" knowledgeType and "operational" category', async () => {
    const captured: { knowledgeType: string; category: string }[] = [];
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        lifecycle: {
          create: async (_org: string, input: { knowledgeType: string; category: string }) => {
            captured.push({ knowledgeType: input.knowledgeType, category: input.category });
            return { id: 'knowledge-1' } as never;
          },
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.logAdminDecisionToMemory(ORG, { decision: 'd', reason: 'r' });
    expect(captured).toEqual([{ knowledgeType: 'decision', category: 'operational' }]);
  });

  it('getComplianceFrameworkContext() returns an empty array when AI Compliance Engine has no frameworks', async () => {
    const deps: RelationshipManagementDeps = { aiCompliance: { queries: { findFrameworks: async () => ({ frameworks: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getComplianceFrameworkContext(ORG)).toEqual([]);
  });

  it('getAnalyticsSnapshotContext() returns an empty array when Analytics Engine has no KPI snapshots', async () => {
    const deps: RelationshipManagementDeps = { analytics: { queries: { findKPIs: async () => ({ kpis: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAnalyticsSnapshotContext(ORG)).toEqual([]);
  });

  it('notifyAdminEvent() returns null when Communication Hub is not injected, even with a body given', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.notifyAdminEvent(ORG, { title: 't', body: 'b' })).toBeNull();
  });

  it('logAdminDecisionToMemory() returns null when Institutional Memory is not injected, even with full input given', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.logAdminDecisionToMemory(ORG, { decision: 'Full decision text', reason: 'Full reason text' })).toBeNull();
  });

  it('getApiGatewayContext() with an injected apiGateway that has no findApis-matching results returns an empty array', async () => {
    const deps: RelationshipManagementDeps = { apiGateway: { queries: { findApis: async () => ({ apis: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getApiGatewayContext(ORG)).toEqual([]);
  });

  it('each Relationship Layer method only calls its own collaborator, never another one', async () => {
    let apiGatewayCalls = 0;
    let observabilityCalls = 0;
    const deps: RelationshipManagementDeps = {
      apiGateway: { queries: { findApis: async () => { apiGatewayCalls += 1; return { apis: [], total: 0 }; } } as never },
      observability: { queries: { findHealth: async () => { observabilityCalls += 1; return { checks: [], total: 0 }; } } as never },
    };
    const relationships = createRelationshipManagement(deps);
    await relationships.getApiGatewayContext(ORG);
    expect(apiGatewayCalls).toBe(1);
    expect(observabilityCalls).toBe(0);
  });

  it('notifyAdminEvent() passes through an optional body', async () => {
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
    await relationships.notifyAdminEvent(ORG, { title: 'Alert', body: 'Details here' });
    expect(captured).toEqual([{ title: 'Alert', body: 'Details here' }]);
  });
});
