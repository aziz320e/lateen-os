/**
 * Real Relationship Layer — integrates AI Security Engine, Business
 * DNA, Workflow Engine, and Communication Hub, each exclusively
 * through its public API (never a repository, never a mock). AI
 * Governance Engine is integrated separately, by Gap Analysis's
 * "orphaned policies" check.
 *
 * Every method degrades to a documented no-op (`null`) when its
 * collaborator was not injected, so the AI Compliance Engine remains
 * fully usable offline without any of them.
 *
 * @module relationship-management/service.impl
 */
import type { AuditEvent as SecurityAuditEvent } from '@lateen-os/ai-security-engine';
import type { BusinessProfile } from '@lateen-os/business-dna';
import type { Notification } from '@lateen-os/communication-hub';
import type { HumanTask } from '@lateen-os/workflow-engine';
import { generateId } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { RelationshipManagementDeps } from './types.js';

export interface RaiseComplianceWorkflowInput {
  readonly requestType: string;
  readonly notes?: string;
}

export interface RaisedComplianceWorkflow {
  readonly workflowDefinitionId: string;
  readonly workflowInstanceId: string;
}

export interface NotifyComplianceEventInput {
  readonly title: string;
  readonly body?: string;
}

export interface RelationshipManagement {
  /** Real AI Security Engine security violations for the organization. `null` if AI Security Engine is not injected. */
  getSecurityViolationsContext(organizationId: OrganizationId): Promise<readonly SecurityAuditEvent[] | null>;
  /** Starts a real Workflow Engine compliance-review workflow. `null` if Workflow Engine is not injected. */
  raiseComplianceWorkflowRequest(organizationId: OrganizationId, input: RaiseComplianceWorkflowInput): Promise<RaisedComplianceWorkflow | null>;
  /** Sends a real Communication Hub notification for a compliance event. `null` if Communication Hub is not injected. */
  notifyComplianceEvent(organizationId: OrganizationId, input: NotifyComplianceEventInput): Promise<Notification | null>;
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

    async raiseComplianceWorkflowRequest(organizationId, input) {
      if (!deps.workflow) return null;

      const cacheKey = `${organizationId}::${input.requestType}`;
      let workflowDefinitionId = definitionCache.get(cacheKey);
      if (!workflowDefinitionId) {
        const step: HumanTask = {
          stepId: generateId('workflow-step'),
          code: `compliance.${input.requestType}`,
          name: `Compliance: ${input.requestType}`,
          type: 'human',
          optional: false,
        };
        const { definition } = await deps.workflow.defineWorkflow({
          organizationId,
          code: `compliance.${input.requestType}`,
          name: `Compliance Review — ${input.requestType}`,
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

    async notifyComplianceEvent(organizationId, input) {
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
