/**
 * The fixed, deterministic dispatch table — `${targetService}:${targetOperation}`
 * to a curated, named {@link RelationshipManagement} method. This is
 * the only place a `Route` is ever actually invoked, and it is
 * intentionally **not** reflection or dynamic property access on an
 * arbitrary object: every entry is a real, explicit function
 * reference into the Relationship Layer's 16 named methods — the
 * same "integrate only through explicit public methods" discipline
 * every other package in this monorepo follows.
 *
 * @module dispatcher/invoker-map
 */
import type { RelationshipManagement } from '../relationship-management/service.impl.js';
import type { OrganizationId } from '../shared/identifiers.js';

export type TargetInvoker = (organizationId: OrganizationId, body: Readonly<Record<string, unknown>> | undefined) => Promise<unknown>;

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

/** Builds the fixed `targetService:targetOperation` -> invoker table over a real, injected {@link RelationshipManagement}. */
export function buildInvokerMap(relationships: RelationshipManagement): Readonly<Record<string, TargetInvoker>> {
  return {
    'ai-runtime:getAgentContext': (organizationId, body) => relationships.getAgentContext(organizationId, asString(body?.['runtimeAgentId'])),
    'workflow-engine:raiseGatewayApprovalWorkflow': (organizationId, body) =>
      relationships.raiseGatewayApprovalWorkflow(organizationId, { requestType: asString(body?.['requestType']) ?? 'default', notes: asString(body?.['notes']) }),
    'crm-engine:getCustomerContext': (organizationId, body) => relationships.getCustomerContext(organizationId, asString(body?.['customerId']) ?? ''),
    'sales-engine:getOpportunityContext': (organizationId, body) => relationships.getOpportunityContext(organizationId, asString(body?.['opportunityId']) ?? ''),
    'marketing-engine:getCampaignsContext': (organizationId) => relationships.getCampaignsContext(organizationId),
    'communication-hub:notifyGatewayEvent': (organizationId, body) =>
      relationships.notifyGatewayEvent(organizationId, { title: asString(body?.['title']) ?? '', body: asString(body?.['body']) }),
    'finance-engine:getChartOfAccountsContext': (organizationId) => relationships.getChartOfAccountsContext(organizationId),
    'hr-engine:getEmployeeContext': (organizationId, body) => relationships.getEmployeeContext(organizationId, asString(body?.['employeeId']) ?? ''),
    'inventory-engine:getInventoryItemContext': (organizationId, body) => relationships.getInventoryItemContext(organizationId, asString(body?.['itemId']) ?? ''),
    'project-management-engine:getProjectContext': (organizationId, body) => relationships.getProjectContext(organizationId, asString(body?.['projectId']) ?? ''),
    'customer-success-engine:getCustomerSuccessContext': (organizationId, body) => relationships.getCustomerSuccessContext(organizationId, asString(body?.['customerId']) ?? ''),
    'analytics-engine:recordGatewayMetric': (organizationId, body) =>
      relationships.recordGatewayMetric(organizationId, { metricName: asString(body?.['metricName']) ?? 'gateway.request', value: asNumber(body?.['value']) ?? 0 }),
    'observability-engine:getObservabilityHealthContext': (organizationId) => relationships.getObservabilityHealthContext(organizationId),
    'ai-security-engine:getSecurityPolicyContext': (organizationId) => relationships.getSecurityPolicyContext(organizationId),
    'ai-governance-engine:getGovernancePolicyContext': (organizationId) => relationships.getGovernancePolicyContext(organizationId),
    'ai-compliance-engine:getComplianceFrameworkContext': (organizationId) => relationships.getComplianceFrameworkContext(organizationId),
  };
}
