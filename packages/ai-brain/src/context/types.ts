/** @module context/types */
import type { ProjectId } from '@lateen-os/business-dna';
import type { DecisionId } from '@lateen-os/decision-engine';
import type { GraphNodeId } from '@lateen-os/domain-graph';
import type { KnowledgeEntryId } from '@lateen-os/institutional-memory';
import type { MissionId } from '@lateen-os/multi-agent';
import type {
  ConversationContextId,
  EnterpriseContextId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { CorrelationId } from '../shared/primitives.js';

export type { EnterpriseContextId, ConversationContextId, OrganizationId };

/** Snapshot of relevant Business DNA entities for reasoning. */
export interface BusinessContext {
  readonly organizationId: OrganizationId;
  readonly projectId?: ProjectId;
  readonly entityReferences: readonly string[];
  readonly policyReferences: readonly string[];
  readonly kpiReferences: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Conversation history envelope for multi-turn reasoning. */
export interface ConversationContext {
  readonly id: ConversationContextId;
  readonly organizationId: OrganizationId;
  readonly sessionId: string;
  readonly correlationId: CorrelationId;
  readonly turnCount: number;
  readonly recentMessages: readonly string[];
  readonly activeIntentSummary?: string;
}

/** Mission-scoped context for orchestration decisions. */
export interface MissionContext {
  readonly missionId?: MissionId;
  readonly missionType?: string;
  readonly objectiveSummary?: string;
  readonly relatedDecisionIds: readonly DecisionId[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Unified enterprise context assembled for reasoning.
 *
 * References platform knowledge — no persistence in this package.
 */
export interface EnterpriseContext {
  readonly id: EnterpriseContextId;
  readonly organizationId: OrganizationId;
  readonly correlationId: CorrelationId;
  readonly business: BusinessContext;
  readonly conversation: ConversationContext;
  readonly mission?: MissionContext;
  readonly graphNodeIds: readonly GraphNodeId[];
  readonly knowledgeEntryIds: readonly KnowledgeEntryId[];
  readonly assembledAt: string;
}
