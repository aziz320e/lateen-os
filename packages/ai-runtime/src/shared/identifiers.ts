/**
 * Identifier types for the AI Runtime bounded context.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { AgentId, OrganizationId, RoleId, PermissionId } from '@lateen-os/business-dna';
export type { CapabilityId } from '@lateen-os/capability-engine';
export type { DecisionId } from '@lateen-os/decision-engine';
export type { GraphNodeId, GraphSnapshotId, GraphNodeType } from '@lateen-os/domain-graph';
export type { InstitutionalMemoryId, KnowledgeEntryId } from '@lateen-os/institutional-memory';
export type { RecommendationCandidateId } from '@lateen-os/intelligence-engine';

/** Runtime agent instance identifier (distinct from Business DNA AgentId). */
export type RuntimeAgentId = Identifier;

export type AgentRegistrationId = Identifier;
export type RuntimeSessionId = Identifier;
export type TaskId = Identifier;
export type ExecutionPlanId = Identifier;
export type ExecutionResultId = Identifier;
export type ConversationId = Identifier;
export type ConversationMessageId = Identifier;
export type ConversationThreadId = Identifier;
export type WorkingMemoryId = Identifier;
export type AgentContextId = Identifier;
export type PlanId = Identifier;
export type ScheduleId = Identifier;
export type OrchestrationId = Identifier;
export type AgentMessageId = Identifier;
export type ToolId = Identifier;
export type ToolCallId = Identifier;
export type TelemetryEventId = Identifier;
export type TraceId = Identifier;
export type SpanId = Identifier;
