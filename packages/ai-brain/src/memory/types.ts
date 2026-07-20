/** @module memory/types */
import type { GraphNodeId } from '@lateen-os/domain-graph';
import type { KnowledgeEntryId } from '@lateen-os/institutional-memory';
import type {
  CustomerId,
  EmployeeId,
  OrganizationId,
  ProductId,
  ProjectId,
  WorkingContextId,
} from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { WorkingContextId, OrganizationId };

/** Knowledge item retrieved for active reasoning. */
export interface RetrievedKnowledge {
  readonly entryId: KnowledgeEntryId;
  readonly title: string;
  readonly excerpt: string;
  readonly relevance: ScoreValue;
  readonly sourceType: string;
}

/** Business entities relevant to the current reasoning session. */
export interface RelevantEntities {
  readonly projectIds: readonly ProjectId[];
  readonly customerIds: readonly CustomerId[];
  readonly productIds: readonly ProductId[];
  readonly employeeIds: readonly EmployeeId[];
  readonly graphNodeIds: readonly GraphNodeId[];
}

/** Short-lived working memory for an active brain session. */
export interface WorkingContext {
  readonly id: WorkingContextId;
  readonly organizationId: OrganizationId;
  readonly sessionId: string;
  readonly retrievedKnowledge: readonly RetrievedKnowledge[];
  readonly relevantEntities: RelevantEntities;
  readonly activeHypotheses: readonly string[];
  readonly notes: readonly string[];
}
