/**
 * Identifier types for the AI Workforce bounded context.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type {
  AgentId,
  DepartmentId,
  EmployeeId,
  OrganizationId,
  RoleId,
} from '@lateen-os/business-dna';
export type { RuntimeAgentId, TaskId } from '@lateen-os/ai-runtime';
export type { DecisionId } from '@lateen-os/decision-engine';
export type { KnowledgeEntryId } from '@lateen-os/institutional-memory';
export type { RecommendationCandidateId } from '@lateen-os/intelligence-engine';

/** Workforce digital employee identifier (distinct from Business DNA AgentId and RuntimeAgentId). */
export type WorkerId = Identifier;

export type WorkerRegistrationId = Identifier;
export type WorkerRoleId = Identifier;
export type WorkerSkillId = Identifier;
export type SkillId = Identifier;
export type TeamId = Identifier;
export type TeamMemberId = Identifier;
export type DelegationId = Identifier;
export type DelegationRuleId = Identifier;
export type WorkforceConversationId = Identifier;
export type TaskAssignmentId = Identifier;
export type SharedContextId = Identifier;
export type SupervisorId = Identifier;
export type ReviewId = Identifier;
export type EscalationId = Identifier;
export type GoalId = Identifier;
export type ObjectiveId = Identifier;
export type KeyResultId = Identifier;
export type PerformanceMetricsId = Identifier;
export type AvailabilityScheduleId = Identifier;
export type WorkforceNotificationId = Identifier;
export type ApprovalRequirementId = Identifier;
export type ComplianceCheckId = Identifier;
export type WorkforceAuditRecordId = Identifier;
export type WorkforceOrgUnitId = Identifier;
