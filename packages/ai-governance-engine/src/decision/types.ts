/** @module decision/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { DecisionId } from '../shared/identifiers.js';

export type { DecisionId };

export type DecisionOutcome = 'approved' | 'rejected';

/** An immutable, append-only decision record — approvals, rejections, reviewers, timestamps, and rationale. */
export interface Decision extends TenantAuditableEntity<DecisionId> {
  readonly decisionType: string;
  readonly subjectId: string;
  readonly outcome: DecisionOutcome;
  readonly reviewerId: string;
  readonly rationale?: string;
  readonly occurredAt: string;
}
