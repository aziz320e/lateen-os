/**
 * Real Relationship Layer — integrates AI Security Engine, AI Runtime,
 * AI Brain, Workflow Engine, Business DNA, and Communication Hub, each
 * exclusively through its public API (never a repository, never a
 * mock). Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the AI Governance Engine remains
 * fully usable offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { BrainExecutionPlanId, ExplainPlanResult } from '@lateen-os/ai-brain';
import type { AuditEvent as SecurityAuditEvent } from '@lateen-os/ai-security-engine';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

type FindAgentResult = Awaited<ReturnType<NonNullable<RelationshipManagementDeps['aiRuntime']>['findAgent']>>;
type FindRuntimeStateResult = Awaited<ReturnType<NonNullable<RelationshipManagementDeps['aiRuntime']>['findRuntimeState']>>;

export interface RaiseGovernanceWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedGovernanceWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifyGovernanceEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RelationshipManagement {
  /** Real AI Security Engine security violations for the organization. `null` if AI Security Engine is not injected. */
  getSecurityViolationsContext(organizationId: OrganizationId): Promise<readonly SecurityAuditEvent[] | null>;
  /** Real AI Runtime agent lookup. `null` if AI Runtime is not injected. */
  getRuntimeAgentContext(organizationId: OrganizationId, runtimeAgentId?: string): Promise<FindAgentResult | null>;
  /** Real AI Runtime state snapshot. `null` if AI Runtime is not injected. */
  getRuntimeStateContext(organizationId: OrganizationId): Promise<FindRuntimeStateResult | null>;
  /** Real AI Brain plan explanation, fetched by id. `null` if AI Brain is not injected or the plan is unknown. */
  getBrainPlanContext(organizationId: OrganizationId, planId: BrainExecutionPlanId): Promise<ExplainPlanResult | null>;
  /** Starts a real Workflow Engine governance workflow. `null` if Workflow Engine is not injected. */
  raiseGovernanceWorkflowRequest(organizationId: OrganizationId, input: RaiseGovernanceWorkflowInput): Promise<RaisedGovernanceWorkflow | null>;
  /** Sends a real Communication Hub notification for a governance event. `null` if Communication Hub is not injected. */
  notifyGovernanceEvent(organizationId: OrganizationId, input: NotifyGovernanceEventInput): Promise<Notification | null>;
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  /** Idempotent per (organization, request type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  return {
    async getSecurityViolationsContext(organizationId) {
      if (!deps.aiSecurity) return null;
      const result = await deps.aiSecurity.queries.findViolations({ organizationId });
      return result.violations;
    },

    async getRuntimeAgentContext(organizationId, runtimeAgentId) {
      if (!deps.aiRuntime) return null;
      return deps.aiRuntime.findAgent({ organizationId, runtimeAgentId });
    },

    async getRuntimeStateContext(organizationId) {
      if (!deps.aiRuntime) return null;
      return deps.aiRuntime.findRuntimeState({ organizationId });
    },

    async getBrainPlanContext(organizationId, planId) {
      if (!deps.aiBrain) return null;
      try {
        return await deps.aiBrain.queries.explainPlan({ organizationId, planId });
      } catch {
        return null;
      }
    },

    async raiseGovernanceWorkflowRequest(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `governance.${input.requestType}`,
          name: `Governance: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `governance.${input.requestType}`,
          name: `Governance Review — ${input.requestType}`,
          metadata: { category: 'governance' },
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

    async notifyGovernanceEvent(organizationId, input) {
      if (!deps.communicationHub) return null;
      const notification = await deps.communicationHub.notifications.create(organizationId, {
        notificationType: 'escalation',
        title: input.title,
        body: input.body,
      });
      return deps.communicationHub.notifications.send(organizationId, notification.id);
    },

    async getBusinessProfileContext(organizationId) {
      if (!deps.businessDna) return null;
      return deps.businessDna.businessProfile.get(organizationId);
    },
  };
}
