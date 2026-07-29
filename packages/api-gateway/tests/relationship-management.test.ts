import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null/empty when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getAgentContext(ORG, 'agent-1')).toBeNull();
    expect(await relationships.raiseGatewayApprovalWorkflow(ORG, { requestType: 'custom' })).toBeNull();
    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toBeNull();
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toBeNull();
    expect(await relationships.getCampaignsContext(ORG)).toEqual([]);
    expect(await relationships.notifyGatewayEvent(ORG, { title: 't' })).toBeNull();
    expect(await relationships.getChartOfAccountsContext(ORG)).toEqual([]);
    expect(await relationships.getEmployeeContext(ORG, 'employee-1')).toBeNull();
    expect(await relationships.getInventoryItemContext(ORG, 'item-1')).toBeNull();
    expect(await relationships.getProjectContext(ORG, 'project-1')).toBeNull();
    expect(await relationships.getCustomerSuccessContext(ORG, 'customer-1')).toBeNull();
    expect(await relationships.recordGatewayMetric(ORG, { metricName: 'gateway.request', value: 1 })).toBeNull();
    expect(await relationships.getObservabilityHealthContext(ORG)).toEqual([]);
    expect(await relationships.getSecurityPolicyContext(ORG)).toEqual([]);
    expect(await relationships.getGovernancePolicyContext(ORG)).toEqual([]);
    expect(await relationships.getComplianceFrameworkContext(ORG)).toEqual([]);
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getAgentContext() delegates to the real AI Runtime findAgent query', async () => {
    const deps: RelationshipManagementDeps = {
      aiRuntime: { findAgent: async () => ({ agents: [{ id: 'agent-1', name: 'Support Agent' } as never] }) },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAgentContext(ORG, 'agent-1')).toEqual({ id: 'agent-1', name: 'Support Agent' });
  });

  it('getAgentContext() returns null when AI Runtime finds no matching agent', async () => {
    const deps: RelationshipManagementDeps = { aiRuntime: { findAgent: async () => ({ agents: [] }) } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getAgentContext(ORG, 'missing')).toBeNull();
  });

  it('raiseGatewayApprovalWorkflow() defines and starts a real Workflow Engine workflow', async () => {
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
    const result = await relationships.raiseGatewayApprovalWorkflow(ORG, { requestType: 'access-review' });
    expect(result).toEqual({ workflowDefinitionId: 'definition-1', workflowInstanceId: 'instance-1' });
    expect(defineCalls).toBe(1);
  });

  it('raiseGatewayApprovalWorkflow() reuses the cached definition for the same (org, requestType)', async () => {
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
    await relationships.raiseGatewayApprovalWorkflow(ORG, { requestType: 'access-review' });
    await relationships.raiseGatewayApprovalWorkflow(ORG, { requestType: 'access-review' });
    expect(defineCalls).toBe(1);
  });

  it('getCustomerContext() delegates to the real CRM Engine customer lifecycle', async () => {
    const deps: RelationshipManagementDeps = { crm: { customers: { get: async () => ({ id: 'customer-1', name: 'Acme Co' } as never) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toEqual({ id: 'customer-1', name: 'Acme Co' });
  });

  it('getOpportunityContext() delegates to the real Sales Engine opportunity pipeline', async () => {
    const deps: RelationshipManagementDeps = { sales: { opportunities: { get: async () => ({ id: 'opp-1', amount: '5000.00' } as never) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toEqual({ id: 'opp-1', amount: '5000.00' });
  });

  it('getCampaignsContext() delegates to the real Marketing Engine query layer', async () => {
    const deps: RelationshipManagementDeps = { marketing: { queries: { findCampaigns: async () => ({ campaigns: [{ id: 'campaign-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCampaignsContext(ORG)).toEqual([{ id: 'campaign-1' }]);
  });

  it('notifyGatewayEvent() creates and sends a real escalation notification', async () => {
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
    const result = await relationships.notifyGatewayEvent(ORG, { title: 'Route registered' });
    expect(sent).toEqual(['notif-1']);
    expect(result).toEqual({ id: 'notif-1', status: 'sent' });
  });

  it('getChartOfAccountsContext() delegates to the real Finance Engine chart of accounts', async () => {
    const deps: RelationshipManagementDeps = { finance: { chartOfAccounts: { list: async () => [{ id: 'account-1' } as never] } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getChartOfAccountsContext(ORG)).toEqual([{ id: 'account-1' }]);
  });

  it('getEmployeeContext() delegates to the real HR Engine employee directory', async () => {
    const deps: RelationshipManagementDeps = { hr: { employees: { get: async () => ({ id: 'employee-1' } as never) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getEmployeeContext(ORG, 'employee-1')).toEqual({ id: 'employee-1' });
  });

  it('getInventoryItemContext() delegates to the real Inventory Engine catalog', async () => {
    const deps: RelationshipManagementDeps = { inventory: { catalog: { get: async () => ({ id: 'item-1' } as never) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getInventoryItemContext(ORG, 'item-1')).toEqual({ id: 'item-1' });
  });

  it('getProjectContext() delegates to the real Project Management Engine project lifecycle', async () => {
    const deps: RelationshipManagementDeps = { projects: { projects: { get: async () => ({ id: 'project-1' } as never) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getProjectContext(ORG, 'project-1')).toEqual({ id: 'project-1' });
  });

  it('getCustomerSuccessContext() delegates to the real Customer Success Engine customer lookup', async () => {
    const deps: RelationshipManagementDeps = { customerSuccess: { customers: { findByCustomer: async () => ({ id: 'success-1' } as never) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerSuccessContext(ORG, 'customer-1')).toEqual({ id: 'success-1' });
  });

  it('recordGatewayMetric() delegates to the real Analytics Engine metrics service', async () => {
    const deps: RelationshipManagementDeps = {
      analytics: { metrics: { recordGauge: async (_org: string, metricName: string, value: number) => ({ id: 'metric-1', metricName, value } as never) } as never },
    };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.recordGatewayMetric(ORG, { metricName: 'gateway.request', value: 42 })).toEqual({ id: 'metric-1', metricName: 'gateway.request', value: 42 });
  });

  it('getObservabilityHealthContext() delegates to the real Observability Engine query layer', async () => {
    const deps: RelationshipManagementDeps = { observability: { queries: { findHealth: async () => ({ checks: [{ id: 'check-1' } as never], total: 1 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getObservabilityHealthContext(ORG)).toEqual([{ id: 'check-1' }]);
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

  it('getCustomerContext() returns null when CRM Engine is injected but the customer is unknown', async () => {
    const deps: RelationshipManagementDeps = { crm: { customers: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerContext(ORG, 'missing')).toBeNull();
  });

  it('getOpportunityContext() returns null when Sales Engine is injected but the opportunity is unknown', async () => {
    const deps: RelationshipManagementDeps = { sales: { opportunities: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getOpportunityContext(ORG, 'missing')).toBeNull();
  });

  it('getEmployeeContext() returns null when HR Engine is injected but the employee is unknown', async () => {
    const deps: RelationshipManagementDeps = { hr: { employees: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getEmployeeContext(ORG, 'missing')).toBeNull();
  });

  it('getInventoryItemContext() returns null when Inventory Engine is injected but the item is unknown', async () => {
    const deps: RelationshipManagementDeps = { inventory: { catalog: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getInventoryItemContext(ORG, 'missing')).toBeNull();
  });

  it('getProjectContext() returns null when Project Management Engine is injected but the project is unknown', async () => {
    const deps: RelationshipManagementDeps = { projects: { projects: { get: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getProjectContext(ORG, 'missing')).toBeNull();
  });

  it('getCustomerSuccessContext() returns null when Customer Success Engine is injected but no record exists', async () => {
    const deps: RelationshipManagementDeps = { customerSuccess: { customers: { findByCustomer: async () => null } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCustomerSuccessContext(ORG, 'missing')).toBeNull();
  });

  it('getCampaignsContext() returns an empty array when Marketing Engine has no campaigns', async () => {
    const deps: RelationshipManagementDeps = { marketing: { queries: { findCampaigns: async () => ({ campaigns: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getCampaignsContext(ORG)).toEqual([]);
  });

  it('getChartOfAccountsContext() returns an empty array when Finance Engine has no accounts', async () => {
    const deps: RelationshipManagementDeps = { finance: { chartOfAccounts: { list: async () => [] } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getChartOfAccountsContext(ORG)).toEqual([]);
  });

  it('getObservabilityHealthContext() returns an empty array when Observability Engine reports no checks', async () => {
    const deps: RelationshipManagementDeps = { observability: { queries: { findHealth: async () => ({ checks: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getObservabilityHealthContext(ORG)).toEqual([]);
  });

  it('getSecurityPolicyContext() returns an empty array when AI Security Engine has no policies', async () => {
    const deps: RelationshipManagementDeps = { aiSecurity: { queries: { findPolicies: async () => ({ policies: [], total: 0 }) } as never } };
    const relationships = createRelationshipManagement(deps);
    expect(await relationships.getSecurityPolicyContext(ORG)).toEqual([]);
  });

  it('raiseGatewayApprovalWorkflow() derives distinct definitions for two different request types', async () => {
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
    await relationships.raiseGatewayApprovalWorkflow(ORG, { requestType: 'access-review' });
    await relationships.raiseGatewayApprovalWorkflow(ORG, { requestType: 'budget-approval' });
    expect(defined).toEqual(['gateway.access-review', 'gateway.budget-approval']);
  });

  it('raiseGatewayApprovalWorkflow() passes optional notes through to the started instance variables', async () => {
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
    await relationships.raiseGatewayApprovalWorkflow(ORG, { requestType: 'access-review', notes: 'urgent' });
    expect(captured).toEqual([{ notes: 'urgent' }]);
  });

  it('notifyGatewayEvent() passes through an optional body', async () => {
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
    await relationships.notifyGatewayEvent(ORG, { title: 'Alert', body: 'Details here' });
    expect(captured).toEqual([{ title: 'Alert', body: 'Details here' }]);
  });
});
