/**
 * Real Relationship Layer — the Finance Engine's only integration
 * point with CRM Engine, Sales Engine, Business DNA, Workflow Engine,
 * Communication Hub, Analytics Engine, and Institutional Memory, each
 * exclusively through its public API (never a repository, never a
 * mock).
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the Finance Engine remains fully
 * usable — and fully tested — completely offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { KpiSnapshot } from '@lateen-os/analytics-engine';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { Customer, CustomerId } from '@lateen-os/crm-engine';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { SalesOpportunity, SalesOpportunityId } from '@lateen-os/sales-engine';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RaiseFinanceApprovalWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedFinanceWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifyFinanceEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RecordRevenueKpiInput {
  readonly value: number;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface LogFinanceDecisionInput {
  readonly decision: string;
  readonly reason: string;
}

export interface RelationshipManagement {
  /** Real CRM Engine customer, fetched by id. `null` if CRM Engine is not injected or the customer is unknown. */
  getCustomerContext(organizationId: OrganizationId, customerId: CustomerId): Promise<Customer | null>;
  /** Real Sales Engine opportunity, fetched by id — used to seed an AR invoice from a won deal. `null` if Sales Engine is not injected or the opportunity is unknown. */
  getOpportunityContext(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity | null>;
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
  /** Starts a real Workflow Engine finance-approval workflow. `null` if Workflow Engine is not injected. */
  raiseFinanceApprovalWorkflow(organizationId: OrganizationId, input: RaiseFinanceApprovalWorkflowInput): Promise<RaisedFinanceWorkflow | null>;
  /** Sends a real Communication Hub notification for a finance event. `null` if Communication Hub is not injected. */
  notifyFinanceEvent(organizationId: OrganizationId, input: NotifyFinanceEventInput): Promise<Notification | null>;
  /** Records a real Analytics Engine revenue KPI snapshot. `null` if Analytics Engine is not injected. */
  recordRevenueKpi(organizationId: OrganizationId, input: RecordRevenueKpiInput): Promise<KpiSnapshot | null>;
  /** Logs a significant finance decision as a real Institutional Memory `'decision'` knowledge entry. `null` if Institutional Memory is not injected. */
  logFinanceDecisionToMemory(organizationId: OrganizationId, input: LogFinanceDecisionInput): Promise<KnowledgeEntry | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  /** Idempotent per (organization, request type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  return {
    async getCustomerContext(organizationId, customerId) {
      if (!deps.crm) return null;
      return deps.crm.customers.get(organizationId, customerId);
    },

    async getOpportunityContext(organizationId, opportunityId) {
      if (!deps.sales) return null;
      return deps.sales.opportunities.get(organizationId, opportunityId);
    },

    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },

    async raiseFinanceApprovalWorkflow(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `finance.${input.requestType}`,
          name: `Finance Approval: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `finance.${input.requestType}`,
          name: `Finance Approval — ${input.requestType}`,
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

    async notifyFinanceEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },

    async recordRevenueKpi(organizationId, input) {
      if (!deps.analytics) return null;
      return deps.analytics.kpis.recordRevenue(organizationId, { value: input.value, context: input.context });
    },

    async logFinanceDecisionToMemory(organizationId, input) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: input.decision,
        content: input.reason,
        knowledgeType: 'decision',
        category: 'commercial',
        source: 'finance-engine',
        tags: ['finance'],
      });
    },
  };
}
