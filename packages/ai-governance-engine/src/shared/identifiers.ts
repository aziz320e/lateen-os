/**
 * Identifier types for the AI Governance Engine bounded context.
 *
 * Where a sibling package already owns a canonical id (Organization,
 * Employee from Business DNA; RuntimeAgentId from AI Runtime; IdentityId
 * from AI Security Engine), it is reused directly rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { EmployeeId, OrganizationId } from '@lateen-os/business-dna';
export type { RuntimeAgentId } from '@lateen-os/ai-runtime';
export type { IdentityId } from '@lateen-os/ai-security-engine';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Governance Policy identifier. */
export type GovernancePolicyId = Identifier;

/** Governance Policy version snapshot identifier. */
export type PolicyVersionId = Identifier;

/** Generic AI Governance record identifier (providers/models/agents/workers/brain/runtime). */
export type AiGovernanceRecordId = Identifier;

/** Model Governance record identifier. */
export type ModelGovernanceRecordId = Identifier;

/** Agent Governance record identifier. */
export type AgentGovernanceRecordId = Identifier;

/** Workflow Governance record identifier. */
export type WorkflowGovernanceRecordId = Identifier;

/** Human Approval Engine request identifier. */
export type ApprovalRequestId = Identifier;

/** Granted governance exception identifier. */
export type GovernanceExceptionId = Identifier;

/** Risk register entry identifier. */
export type RiskId = Identifier;

/** Decision Tracking entry identifier. */
export type DecisionId = Identifier;

/** Governance Rules Engine rule identifier. */
export type GovernanceRuleId = Identifier;
