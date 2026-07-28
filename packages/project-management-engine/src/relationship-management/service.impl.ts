/**
 * Real Relationship Layer — the Project Management Engine's only
 * integration point with CRM Engine, HR Engine, Finance Engine,
 * Inventory Engine, Workflow Engine, Communication Hub, Analytics
 * Engine, Business DNA, and Institutional Memory, each exclusively
 * through its public API (never a repository, never a mock).
 *
 * AI Workforce context is reached only through HR Engine's own
 * public `relationships.getAiWorkforceUtilizationContext()` —
 * composing an already-integrated capability rather than duplicating
 * workforce logic or adding a direct dependency.
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the Project Management Engine
 * remains fully usable — and fully tested — completely offline
 * without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { Customer } from '@lateen-os/crm-engine';
import type { JournalEntry } from '@lateen-os/finance-engine';
import type { Employee, relationshipManagement as hrRelationshipManagement } from '@lateen-os/hr-engine';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { MovementRecord } from '@lateen-os/inventory-engine';
import type { MetricSnapshot } from '@lateen-os/analytics-engine';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export type AiWorkforceUtilizationContext = hrRelationshipManagement.AiWorkforceUtilizationContext;

export interface RaiseProjectApprovalWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedProjectWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifyProjectEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RecordProjectMetricInput {
  readonly metricName: string;
  readonly value: number;
}

export interface LogProjectDecisionInput {
  readonly decision: string;
  readonly reason: string;
}

export interface RecordProjectCostEntryInput {
  readonly projectAccountId: string;
  readonly offsetAccountId: string;
  readonly amount: string;
  readonly currency: string;
  readonly entryDate: string;
  readonly memo?: string;
}

export interface ReserveProjectMaterialInput {
  readonly itemId: string;
  readonly warehouseId: string;
  readonly quantity: string;
}

export interface RelationshipManagement {
  /** Real CRM Engine customer, fetched by id. `null` if CRM Engine is not injected or the customer is unknown. */
  getCustomerContext(organizationId: OrganizationId, customerId: string): Promise<Customer | null>;
  /** Real HR Engine employee, fetched by id. `null` if HR Engine is not injected or the employee is unknown. */
  getEmployeeContext(organizationId: OrganizationId, employeeId: string): Promise<Employee | null>;
  /** Real AI Workforce utilization, reached only through HR Engine's own public integration. `null` if HR Engine is not injected (or was injected without its own AI Workforce collaborator). */
  getAiWorkforceUtilizationContext(organizationId: OrganizationId): Promise<AiWorkforceUtilizationContext | null>;
  /** Composes a real, posted Finance Engine journal entry for project spend — the only place this package touches accounting, and it never implements the accounting itself. `null` if Finance Engine is not injected. */
  recordProjectCostEntry(organizationId: OrganizationId, input: RecordProjectCostEntryInput): Promise<JournalEntry | null>;
  /** Composes a real Inventory Engine stock reservation for a project's material requirement — this package never manages inventory directly. `null` if Inventory Engine is not injected. */
  reserveProjectMaterial(organizationId: OrganizationId, input: ReserveProjectMaterialInput): Promise<MovementRecord | null>;
  /** Starts a real Workflow Engine project-approval workflow. `null` if Workflow Engine is not injected. */
  raiseProjectApprovalWorkflow(organizationId: OrganizationId, input: RaiseProjectApprovalWorkflowInput): Promise<RaisedProjectWorkflow | null>;
  /** Sends a real Communication Hub notification for a project event. `null` if Communication Hub is not injected. */
  notifyProjectEvent(organizationId: OrganizationId, input: NotifyProjectEventInput): Promise<Notification | null>;
  /** Records a real Analytics Engine gauge metric snapshot. `null` if Analytics Engine is not injected. */
  recordProjectMetric(organizationId: OrganizationId, input: RecordProjectMetricInput): Promise<MetricSnapshot | null>;
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
  /** Logs a significant project decision as a real Institutional Memory `'decision'` knowledge entry. `null` if Institutional Memory is not injected. */
  logProjectDecisionToMemory(organizationId: OrganizationId, input: LogProjectDecisionInput): Promise<KnowledgeEntry | null>;
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

    async getEmployeeContext(organizationId, employeeId) {
      if (!deps.hr) return null;
      return deps.hr.employees.get(organizationId, employeeId);
    },

    async getAiWorkforceUtilizationContext(organizationId) {
      if (!deps.hr) return null;
      return deps.hr.relationships.getAiWorkforceUtilizationContext(organizationId);
    },

    async recordProjectCostEntry(organizationId, input) {
      if (!deps.finance) return null;
      const entry = await deps.finance.generalLedger.createJournalEntry(organizationId, {
        entryDate: input.entryDate,
        currency: input.currency,
        memo: input.memo,
        lines: [
          { accountId: input.projectAccountId, debit: input.amount, credit: '0.00' },
          { accountId: input.offsetAccountId, debit: '0.00', credit: input.amount },
        ],
      });
      return deps.finance.generalLedger.postJournalEntry(organizationId, entry.id);
    },

    async reserveProjectMaterial(organizationId, input) {
      if (!deps.inventory) return null;
      return deps.inventory.movements.reserve(organizationId, { itemId: input.itemId, warehouseId: input.warehouseId, quantity: input.quantity });
    },

    async raiseProjectApprovalWorkflow(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `project.${input.requestType}`,
          name: `Project Approval: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `project.${input.requestType}`,
          name: `Project Approval — ${input.requestType}`,
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

    async notifyProjectEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },

    async recordProjectMetric(organizationId, input) {
      if (!deps.analytics) return null;
      return deps.analytics.metrics.recordGauge(organizationId, input.metricName, input.value);
    },

    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },

    async logProjectDecisionToMemory(organizationId, input) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: input.decision,
        content: input.reason,
        knowledgeType: 'decision',
        category: 'operational',
        source: 'project-management-engine',
        tags: ['project'],
      });
    },
  };
}
