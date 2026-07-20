/** @module lesson/types */
import type { ConfidenceScore } from '../confidence/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { LessonLearnedId, OrganizationId } from '../shared/identifiers.js';
import type { MemoryTag } from '../shared/primitives.js';

export type { LessonLearnedId };

export type LessonLearnedStatus = 'draft' | 'published' | 'archived';

/** Captured lesson from an operational or strategic experience. */
export interface LessonLearned extends TenantAuditableEntity<LessonLearnedId> {
  readonly title: string;
  readonly situation: string;
  readonly problem: string;
  readonly rootCause: string;
  readonly resolution: string;
  readonly recommendation: string;
  readonly confidence?: ConfidenceScore;
  readonly tags: readonly MemoryTag[];
  readonly status: LessonLearnedStatus;
}

export type { OrganizationId };
