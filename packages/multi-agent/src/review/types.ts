/** @module review/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  MissionId,
  OrganizationId,
  ReviewCommentId,
  ReviewRequestId,
  ReviewResultId,
} from '../shared/identifiers.js';
import type { ScoreValue, Timestamp } from '../shared/primitives.js';

export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'changes_requested' | 'rejected';

/** Comment attached to a review. */
export interface ReviewComment extends TenantAuditableEntity<ReviewCommentId> {
  readonly reviewRequestId: ReviewRequestId;
  readonly authorWorkerId: WorkerId;
  readonly content: string;
  readonly createdAt: Timestamp;
}

/** Outcome of a completed review cycle. */
export interface ReviewResult {
  readonly reviewRequestId: ReviewRequestId;
  readonly status: ReviewStatus;
  readonly reviewerWorkerId: WorkerId;
  readonly qualityScore?: ScoreValue;
  readonly summary: string;
  readonly completedAt: Timestamp;
}

/** Request for peer or leader review of mission output. */
export interface ReviewRequest extends TenantAuditableEntity<ReviewRequestId> {
  readonly missionId: MissionId;
  readonly subject: string;
  readonly requesterWorkerId: WorkerId;
  readonly reviewerWorkerIds: readonly WorkerId[];
  readonly status: ReviewStatus;
  readonly commentIds: readonly ReviewCommentId[];
  readonly result?: ReviewResult;
}

export type { ReviewRequestId, ReviewResultId, ReviewCommentId, OrganizationId, WorkerId };
