/**
 * Identifier types for the Workflow Engine bounded context.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { EmployeeId, OrganizationId, RoleId } from '@lateen-os/business-dna';
export type { DecisionId } from '@lateen-os/decision-engine';
export type { RuntimeAgentId, TaskId } from '@lateen-os/ai-runtime';
export type { WorkerId } from '@lateen-os/ai-workforce';

/** Workflow definition identifier. */
export type WorkflowDefinitionId = Identifier;

export type WorkflowVersionId = Identifier;
export type WorkflowInstanceId = Identifier;
export type WorkflowExecutionId = Identifier;
export type WorkflowStepId = Identifier;
export type StepInstanceId = Identifier;
export type TransitionId = Identifier;
export type TriggerId = Identifier;
export type ConditionId = Identifier;
export type ExpressionId = Identifier;
export type RuleId = Identifier;
export type ActionId = Identifier;
export type ApprovalStepId = Identifier;
export type ApprovalChainId = Identifier;
export type WorkflowTemplateId = Identifier;
export type WorkflowScheduleId = Identifier;
export type WorkflowHistoryId = Identifier;
export type ExecutionHistoryId = Identifier;
export type AuditTrailId = Identifier;
export type WorkflowEventId = Identifier;
export type ServiceTaskId = Identifier;
export type HumanTaskId = Identifier;
export type AITaskRefId = Identifier;
export type DecisionTaskId = Identifier;
