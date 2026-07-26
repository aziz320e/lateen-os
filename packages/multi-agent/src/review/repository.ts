/** @module review/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { ReviewComment, ReviewCommentId, ReviewRequest, ReviewRequestId } from './types.js';

export interface ReviewRequestRepository extends Repository<ReviewRequest, ReviewRequestId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly ReviewRequest[]>;
}
export interface ReviewCommentRepository extends Repository<ReviewComment, ReviewCommentId> {
  findByRequest(organizationId: OrganizationId, reviewRequestId: ReviewRequestId): Promise<readonly ReviewComment[]>;
}
