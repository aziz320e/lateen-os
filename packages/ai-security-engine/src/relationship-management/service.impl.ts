/**
 * Real Relationship Layer — integrates AI Brain, Workflow Engine,
 * Communication Hub, and Business DNA, each exclusively through its
 * public API (never a repository, never a mock). AI Runtime and AI
 * Provider Hub are integrated separately, by Tool Security and
 * Provider Security respectively.
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the AI Security Engine remains
 * fully usable offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { BrainExecutionPlanId, ExplainPlanResult } from '@lateen-os/ai-brain';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RaiseSecurityWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedSecurityWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifySecurityEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RelationshipManagement {
  /** Real AI Brain plan explanation, fetched by id. `null` if AI Brain is not injected or the plan is unknown. */
  getBrainPlanContext(organizationId: OrganizationId, planId: BrainExecutionPlanId): Promise<ExplainPlanResult | null>;
  /** Starts a real Workflow Engine incident-response workflow for a security event. `null` if Workflow Engine is not injected. */
  raiseSecurityWorkflowRequest(organizationId: OrganizationId, input: RaiseSecurityWorkflowInput): Promise<RaisedSecurityWorkflow | null>;
  /** Sends a real Communication Hub notification for a security event. `null` if Communication Hub is not injected. */
  notifySecurityEvent(organizationId: OrganizationId, input: NotifySecurityEventInput): Promise<Notification | null>;
  /** Real Business DNA business profile for the organization. `null` if Business DNA is not injected. */
  getBusinessProfileContext(organizationId: OrganizationId): Promise<BusinessProfile | null>;
}

/** Creates a real {@link RelationshipManagement} service over optionally-injected AI Brain / Workflow Engine / Communication Hub / Business DNA collaborators. */
export function createRelationshipManagement(deps: RelationshipManagementDeps): RelationshipManagement {
  /** Idempotent per (organization, request type) — defines the canonical single-step workflow at most once. */
  const definitionCache = new Map<string, string>();

  return {
    async getBrainPlanContext(organizationId, planId) {
      if (!deps.aiBrain) return null;
      try {
        return await deps.aiBrain.queries.explainPlan({ organizationId, planId });
      } catch {
        return null;
      }
    },

    async raiseSecurityWorkflowRequest(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `security.${input.requestType}`,
          name: `Security: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `security.${input.requestType}`,
          name: `Security Incident — ${input.requestType}`,
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

    async notifySecurityEvent(organizationId, input) {
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
