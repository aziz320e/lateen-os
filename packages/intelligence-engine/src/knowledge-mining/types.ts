/** @module knowledge-mining/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  KnowledgeEntryId,
  KnowledgeFindingId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { KnowledgeFindingId };

export type KnowledgeFindingStatus = 'draft' | 'validated' | 'archived';

export interface FindingEvidence {
  readonly sourceType: string;
  readonly sourceId?: KnowledgeEntryId;
  readonly excerpt?: string;
  readonly recordedAt: string;
}

export interface FindingScore {
  readonly relevance: ScoreValue;
  readonly confidence: ScoreValue;
  readonly overall: ScoreValue;
}

/** Intelligence finding mined from institutional memory or domain data. */
export interface KnowledgeFinding extends TenantAuditableEntity<KnowledgeFindingId> {
  readonly title: string;
  readonly summary: string;
  readonly evidence: readonly FindingEvidence[];
  readonly score: FindingScore;
  readonly status: KnowledgeFindingStatus;
}

export type { OrganizationId };
