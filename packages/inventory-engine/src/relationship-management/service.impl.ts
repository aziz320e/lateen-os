/**
 * Real Relationship Layer — the Inventory Engine's only integration
 * point with Finance Engine, Sales Engine, Business DNA, Workflow
 * Engine, Communication Hub, Analytics Engine, and Institutional
 * Memory, each exclusively through its public API (never a
 * repository, never a mock).
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the Inventory Engine remains
 * fully usable — and fully tested — completely offline without any
 * of them.
 *
 * @module relationship-management/service.impl
 */
import type { MetricSnapshot } from '@lateen-os/analytics-engine';
import type { Product } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { JournalEntry } from '@lateen-os/finance-engine';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { SalesOpportunity, SalesOpportunityId } from '@lateen-os/sales-engine';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId, ProductId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RaiseInventoryApprovalWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedInventoryWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifyInventoryEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RecordInventoryValueMetricInput {
  readonly metricName: string;
  readonly value: number;
}

export interface LogInventoryDecisionInput {
  readonly decision: string;
  readonly reason: string;
}

export interface RecordInventoryValuationEntryInput {
  readonly inventoryAccountId: string;
  readonly offsetAccountId: string;
  readonly amount: string;
  readonly currency: string;
  readonly entryDate: string;
  readonly memo?: string;
}

export interface RelationshipManagement {
  /** Real Business DNA catalog product, fetched by id. `null` if Business DNA is not injected or the product is unknown. */
  getProductContext(organizationId: OrganizationId, productId: ProductId): Promise<Product | null>;
  /** Real Sales Engine opportunity, fetched by id. `null` if Sales Engine is not injected or the opportunity is unknown. */
  getOpportunityContext(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<SalesOpportunity | null>;
  /** Composes a real, posted Finance Engine journal entry for an inventory valuation movement — the only place this package touches accounting, and it never implements the accounting itself. `null` if Finance Engine is not injected. */
  recordInventoryValuationEntry(organizationId: OrganizationId, input: RecordInventoryValuationEntryInput): Promise<JournalEntry | null>;
  /** Starts a real Workflow Engine inventory-approval workflow. `null` if Workflow Engine is not injected. */
  raiseInventoryApprovalWorkflow(organizationId: OrganizationId, input: RaiseInventoryApprovalWorkflowInput): Promise<RaisedInventoryWorkflow | null>;
  /** Sends a real Communication Hub notification for an inventory event. `null` if Communication Hub is not injected. */
  notifyInventoryEvent(organizationId: OrganizationId, input: NotifyInventoryEventInput): Promise<Notification | null>;
  /** Records a real Analytics Engine gauge metric snapshot. `null` if Analytics Engine is not injected. */
  recordInventoryValueMetric(organizationId: OrganizationId, input: RecordInventoryValueMetricInput): Promise<MetricSnapshot | null>;
  /** Logs a significant inventory decision as a real Institutional Memory `'decision'` knowledge entry. `null` if Institutional Memory is not injected. */
  logInventoryDecisionToMemory(organizationId: OrganizationId, input: LogInventoryDecisionInput): Promise<KnowledgeEntry | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  /** Idempotent per (organization, request type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  return {
    async getProductContext(organizationId, productId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.products.getProduct(organizationId, productId);
    },

    async getOpportunityContext(organizationId, opportunityId) {
      if (!deps.sales) return null;
      return deps.sales.opportunities.get(organizationId, opportunityId);
    },

    async recordInventoryValuationEntry(organizationId, input) {
      if (!deps.finance) return null;
      const entry = await deps.finance.generalLedger.createJournalEntry(organizationId, {
        entryDate: input.entryDate,
        currency: input.currency,
        memo: input.memo,
        lines: [
          { accountId: input.inventoryAccountId, debit: input.amount, credit: '0.00' },
          { accountId: input.offsetAccountId, debit: '0.00', credit: input.amount },
        ],
      });
      return deps.finance.generalLedger.postJournalEntry(organizationId, entry.id);
    },

    async raiseInventoryApprovalWorkflow(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `inventory.${input.requestType}`,
          name: `Inventory Approval: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `inventory.${input.requestType}`,
          name: `Inventory Approval — ${input.requestType}`,
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

    async notifyInventoryEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },

    async recordInventoryValueMetric(organizationId, input) {
      if (!deps.analytics) return null;
      return deps.analytics.metrics.recordGauge(organizationId, input.metricName, input.value);
    },

    async logInventoryDecisionToMemory(organizationId, input) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: input.decision,
        content: input.reason,
        knowledgeType: 'decision',
        category: 'operational',
        source: 'inventory-engine',
        tags: ['inventory'],
      });
    },
  };
}
