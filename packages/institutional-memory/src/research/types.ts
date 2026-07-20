/** @module research/types */
import type { ConfidenceScore, Evidence } from '../confidence/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, ResearchRecordId } from '../shared/identifiers.js';
import type { MemorySourceLabel, MemoryTag } from '../shared/primitives.js';

export type { ResearchRecordId };

export type ResearchRecordStatus = 'in_progress' | 'completed' | 'archived';

/** Institutional research finding with recommendations. */
export interface ResearchRecord extends TenantAuditableEntity<ResearchRecordId> {
  readonly topic: string;
  readonly source: MemorySourceLabel;
  readonly summary: string;
  readonly confidence: ConfidenceScore;
  readonly recommendations: readonly string[];
  readonly tags: readonly MemoryTag[];
  readonly evidence?: readonly Evidence[];
  readonly status: ResearchRecordStatus;
}

export type { OrganizationId };
