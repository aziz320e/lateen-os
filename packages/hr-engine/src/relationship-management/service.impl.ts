/**
 * Real Relationship Layer — the HR Engine's only integration point
 * with Finance Engine, AI Workforce, Business DNA, Workflow Engine,
 * Communication Hub, Analytics Engine, and Institutional Memory, each
 * exclusively through its public API (never a repository, never a
 * mock).
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the HR Engine remains fully
 * usable — and fully tested — completely offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { KpiSnapshot } from '@lateen-os/analytics-engine';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { TaxCalculation } from '@lateen-os/finance-engine';
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RaiseHrApprovalWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedHrWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifyHrEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RecordWorkforceUtilizationKpiInput {
  readonly value: number;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface LogHrDecisionInput {
  readonly decision: string;
  readonly reason: string;
}

export interface RecordPayrollTaxWithholdingInput {
  readonly taxRuleId: string;
  readonly taxableAmount: string;
}

export interface AiWorkforceUtilizationContext {
  readonly busyCount: number;
  readonly activeCount: number;
  readonly utilizationPercentage: number;
}

const ACTIVE_AI_WORKER_STATUSES = new Set(['active', 'busy']);

export interface RelationshipManagement {
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
  /** Real Finance Engine tax withholding calculation for a payroll run. `null` if Finance Engine is not injected. Preparation, not accounting — this only calls Finance Engine's own public tax API, it never posts a ledger entry itself. */
  recordPayrollTaxWithholding(organizationId: OrganizationId, input: RecordPayrollTaxWithholdingInput): Promise<TaxCalculation | null>;
  /** Real AI Workforce utilization (busy/active digital workers), for a combined human + AI workforce view. `null` if AI Workforce is not injected. */
  getAiWorkforceUtilizationContext(organizationId: OrganizationId): Promise<AiWorkforceUtilizationContext | null>;
  /** Starts a real Workflow Engine HR-approval workflow. `null` if Workflow Engine is not injected. */
  raiseHrApprovalWorkflow(organizationId: OrganizationId, input: RaiseHrApprovalWorkflowInput): Promise<RaisedHrWorkflow | null>;
  /** Sends a real Communication Hub notification for an HR event. `null` if Communication Hub is not injected. */
  notifyHrEvent(organizationId: OrganizationId, input: NotifyHrEventInput): Promise<Notification | null>;
  /** Records a real Analytics Engine workforce-utilization KPI snapshot. `null` if Analytics Engine is not injected. */
  recordWorkforceUtilizationKpi(organizationId: OrganizationId, input: RecordWorkforceUtilizationKpiInput): Promise<KpiSnapshot | null>;
  /** Logs a significant HR decision as a real Institutional Memory `'decision'` knowledge entry. `null` if Institutional Memory is not injected. */
  logHrDecisionToMemory(organizationId: OrganizationId, input: LogHrDecisionInput): Promise<KnowledgeEntry | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  /** Idempotent per (organization, request type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  return {
    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },

    async recordPayrollTaxWithholding(organizationId, input) {
      if (!deps.finance) return null;
      return deps.finance.tax.calculateAndRecord(organizationId, input.taxRuleId, input.taxableAmount);
    },

    async getAiWorkforceUtilizationContext(organizationId) {
      if (!deps.aiWorkforce) return null;
      const { workers } = await deps.aiWorkforce.findWorkers({ organizationId });
      const activeCount = workers.filter((worker) => ACTIVE_AI_WORKER_STATUSES.has(worker.status)).length;
      const busyCount = workers.filter((worker) => worker.status === 'busy').length;
      return {
        busyCount,
        activeCount,
        utilizationPercentage: activeCount === 0 ? 0 : Math.round((busyCount / activeCount) * 10000) / 100,
      };
    },

    async raiseHrApprovalWorkflow(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `hr.${input.requestType}`,
          name: `HR Approval: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `hr.${input.requestType}`,
          name: `HR Approval — ${input.requestType}`,
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

    async notifyHrEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },

    async recordWorkforceUtilizationKpi(organizationId, input) {
      if (!deps.analytics) return null;
      return deps.analytics.kpis.recordWorkforceUtilization(organizationId, { value: input.value, context: input.context });
    },

    async logHrDecisionToMemory(organizationId, input) {
      if (!deps.institutionalMemory) return null;
      return deps.institutionalMemory.lifecycle.create(organizationId, {
        title: input.decision,
        content: input.reason,
        knowledgeType: 'decision',
        category: 'people',
        source: 'hr-engine',
        tags: ['hr'],
      });
    },
  };
}
