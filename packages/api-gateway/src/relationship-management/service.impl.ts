/**
 * Real Relationship Layer — the API Gateway's only integration point
 * with all 16 required sibling packages, each exclusively through
 * its public API (never a repository, never a mock). Exactly one
 * method per collaborator, mirroring the convention used by every
 * other Relationship Layer in this monorepo.
 *
 * Every method degrades to a documented no-op (`null`/`[]`) when its
 * collaborator was not injected, so the API Gateway remains fully
 * usable — and fully tested — completely offline without any of
 * them.
 *
 * @module relationship-management/service.impl
 */
import type { Agent } from '@lateen-os/ai-runtime';
import type { ComplianceFramework } from '@lateen-os/ai-compliance-engine';
import type { GovernancePolicy } from '@lateen-os/ai-governance-engine';
import type { Policy as SecurityPolicy } from '@lateen-os/ai-security-engine';
import type { MetricSnapshot } from '@lateen-os/analytics-engine';
import type { Notification } from '@lateen-os/communication-hub';
import type { Customer } from '@lateen-os/crm-engine';
import type { CustomerSuccessRecord } from '@lateen-os/customer-success-engine';
import type { Account } from '@lateen-os/finance-engine';
import type { Employee } from '@lateen-os/hr-engine';
import type { InventoryItem } from '@lateen-os/inventory-engine';
import type { Campaign } from '@lateen-os/marketing-engine';
import type { HealthCheck } from '@lateen-os/observability-engine';
import type { Project } from '@lateen-os/project-management-engine';
import type { SalesOpportunity } from '@lateen-os/sales-engine';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RaiseGatewayApprovalWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedGatewayWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifyGatewayEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RecordGatewayMetricInput {
  readonly metricName: string;
  readonly value: number;
}

export interface RelationshipManagement {
  /** Real AI Runtime agent, fetched by id. `null` if AI Runtime is not injected or no agent matches. */
  getAgentContext(organizationId: OrganizationId, runtimeAgentId?: string): Promise<Agent | null>;
  /** Starts a real Workflow Engine gateway-approval workflow. `null` if Workflow Engine is not injected. */
  raiseGatewayApprovalWorkflow(organizationId: OrganizationId, input: RaiseGatewayApprovalWorkflowInput): Promise<RaisedGatewayWorkflow | null>;
  /** Real CRM Engine customer, fetched by id. `null` if CRM Engine is not injected or the customer is unknown. */
  getCustomerContext(organizationId: OrganizationId, customerId: string): Promise<Customer | null>;
  /** Real Sales Engine opportunity, fetched by id. `null` if Sales Engine is not injected or the opportunity is unknown. */
  getOpportunityContext(organizationId: OrganizationId, opportunityId: string): Promise<SalesOpportunity | null>;
  /** Every real Marketing Engine campaign for the organization. `[]` if Marketing Engine is not injected. */
  getCampaignsContext(organizationId: OrganizationId): Promise<readonly Campaign[]>;
  /** Sends a real Communication Hub notification for a gateway event. `null` if Communication Hub is not injected. */
  notifyGatewayEvent(organizationId: OrganizationId, input: NotifyGatewayEventInput): Promise<Notification | null>;
  /** Every real Finance Engine chart-of-accounts entry. `[]` if Finance Engine is not injected. */
  getChartOfAccountsContext(organizationId: OrganizationId): Promise<readonly Account[]>;
  /** Real HR Engine employee, fetched by id. `null` if HR Engine is not injected or the employee is unknown. */
  getEmployeeContext(organizationId: OrganizationId, employeeId: string): Promise<Employee | null>;
  /** Real Inventory Engine catalog item, fetched by id. `null` if Inventory Engine is not injected or the item is unknown. */
  getInventoryItemContext(organizationId: OrganizationId, itemId: string): Promise<InventoryItem | null>;
  /** Real Project Management Engine project, fetched by id. `null` if Project Management Engine is not injected or the project is unknown. */
  getProjectContext(organizationId: OrganizationId, projectId: string): Promise<Project | null>;
  /** Real Customer Success Engine record for a customer. `null` if Customer Success Engine is not injected or no record exists. */
  getCustomerSuccessContext(organizationId: OrganizationId, customerId: string): Promise<CustomerSuccessRecord | null>;
  /** Records a real Analytics Engine gauge metric snapshot. `null` if Analytics Engine is not injected. */
  recordGatewayMetric(organizationId: OrganizationId, input: RecordGatewayMetricInput): Promise<MetricSnapshot | null>;
  /** Every real Observability Engine health check. `[]` if Observability Engine is not injected. */
  getObservabilityHealthContext(organizationId: OrganizationId): Promise<readonly HealthCheck[]>;
  /** Every real AI Security Engine policy. `[]` if AI Security Engine is not injected. */
  getSecurityPolicyContext(organizationId: OrganizationId): Promise<readonly SecurityPolicy[]>;
  /** Every real AI Governance Engine policy. `[]` if AI Governance Engine is not injected. */
  getGovernancePolicyContext(organizationId: OrganizationId): Promise<readonly GovernancePolicy[]>;
  /** Every real AI Compliance Engine framework. `[]` if AI Compliance Engine is not injected. */
  getComplianceFrameworkContext(organizationId: OrganizationId): Promise<readonly ComplianceFramework[]>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  /** Idempotent per (organization, request type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  return {
    async getAgentContext(organizationId, runtimeAgentId) {
      if (!deps.aiRuntime) return null;
      const { agents } = await deps.aiRuntime.findAgent({ organizationId, runtimeAgentId });
      return agents[0] ?? null;
    },

    async raiseGatewayApprovalWorkflow(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `gateway.${input.requestType}`,
          name: `Gateway Approval: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `gateway.${input.requestType}`,
          name: `Gateway Approval — ${input.requestType}`,
          metadata: { category: 'custom' },
          version: '1.0.0',
          steps: [step],
          transitions: [],
        });
        workflowDefinitionId = definition.id;
        definitionCache.set(cacheKey, workflowDefinitionId);
      }

      const instance = await deps.workflow.startWorkflow({
        organizationId,
        definitionId: workflowDefinitionId,
        variables: { notes: input.notes },
      });

      return { workflowDefinitionId, workflowInstanceId: instance.id };
    },

    async getCustomerContext(organizationId, customerId) {
      if (!deps.crm) return null;
      return deps.crm.customers.get(organizationId, customerId);
    },

    async getOpportunityContext(organizationId, opportunityId) {
      if (!deps.sales) return null;
      return deps.sales.opportunities.get(organizationId, opportunityId);
    },

    async getCampaignsContext(organizationId) {
      if (!deps.marketing) return [];
      const { campaigns } = await deps.marketing.queries.findCampaigns({ organizationId });
      return campaigns;
    },

    async notifyGatewayEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },

    async getChartOfAccountsContext(organizationId) {
      if (!deps.finance) return [];
      return deps.finance.chartOfAccounts.list(organizationId);
    },

    async getEmployeeContext(organizationId, employeeId) {
      if (!deps.hr) return null;
      return deps.hr.employees.get(organizationId, employeeId);
    },

    async getInventoryItemContext(organizationId, itemId) {
      if (!deps.inventory) return null;
      return deps.inventory.catalog.get(organizationId, itemId);
    },

    async getProjectContext(organizationId, projectId) {
      if (!deps.projects) return null;
      return deps.projects.projects.get(organizationId, projectId);
    },

    async getCustomerSuccessContext(organizationId, customerId) {
      if (!deps.customerSuccess) return null;
      return deps.customerSuccess.customers.findByCustomer(organizationId, customerId);
    },

    async recordGatewayMetric(organizationId, input) {
      if (!deps.analytics) return null;
      return deps.analytics.metrics.recordGauge(organizationId, input.metricName, input.value);
    },

    async getObservabilityHealthContext(organizationId) {
      if (!deps.observability) return [];
      const { checks } = await deps.observability.queries.findHealth({ organizationId });
      return checks;
    },

    async getSecurityPolicyContext(organizationId) {
      if (!deps.aiSecurity) return [];
      const { policies } = await deps.aiSecurity.queries.findPolicies({ organizationId });
      return policies;
    },

    async getGovernancePolicyContext(organizationId) {
      if (!deps.aiGovernance) return [];
      const { policies } = await deps.aiGovernance.queries.findPolicies({ organizationId });
      return policies;
    },

    async getComplianceFrameworkContext(organizationId) {
      if (!deps.aiCompliance) return [];
      const { frameworks } = await deps.aiCompliance.queries.findFrameworks({ organizationId });
      return frameworks;
    },
  };
}
