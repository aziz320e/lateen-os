/** Real Review service — request, comment, and resolve a peer/leader review. @module review/service.impl */
import type { WorkerId } from '@lateen-os/ai-workforce';
import { NotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { ReviewCommentRepository, ReviewRequestRepository } from './repository.js';
import type { ReviewRequest, ReviewRequestId, ReviewResult, ReviewStatus } from './types.js';

export interface ReviewService {
  request(organizationId: OrganizationId, missionId: MissionId, subject: string, requesterWorkerId: WorkerId, reviewerWorkerIds: readonly WorkerId[]): Promise<ReviewRequest>;
  comment(organizationId: OrganizationId, reviewRequestId: ReviewRequestId, authorWorkerId: WorkerId, content: string): Promise<ReviewRequest>;
  resolve(organizationId: OrganizationId, reviewRequestId: ReviewRequestId, status: Exclude<ReviewStatus, 'pending' | 'in_review'>, reviewerWorkerId: WorkerId, summary: string, qualityScore?: string): Promise<ReviewRequest>;
}

/** Creates a real {@link ReviewService}. */
export function createReviewService(requestRepository: ReviewRequestRepository, commentRepository: ReviewCommentRepository): ReviewService {
  async function requireRequest(organizationId: OrganizationId, reviewRequestId: ReviewRequestId): Promise<ReviewRequest> {
    const request = await requestRepository.findById(organizationId, reviewRequestId);
    if (!request) throw new NotFoundError('ReviewRequest', reviewRequestId);
    return request;
  }

  return {
    async request(organizationId, missionId, subject, requesterWorkerId, reviewerWorkerIds) {
      const now = nowIso();
      const request: ReviewRequest = {
        id: generateId('review-request'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        subject,
        requesterWorkerId,
        reviewerWorkerIds,
        status: 'pending',
        commentIds: [],
      };
      await requestRepository.save(request);
      return request;
    },

    async comment(organizationId, reviewRequestId, authorWorkerId, content) {
      const request = await requireRequest(organizationId, reviewRequestId);
      const now = nowIso();
      const comment = {
        id: generateId('review-comment'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        reviewRequestId,
        authorWorkerId,
        content,
      };
      await commentRepository.save(comment);
      const updated: ReviewRequest = {
        ...request,
        status: request.status === 'pending' ? 'in_review' : request.status,
        commentIds: [...request.commentIds, comment.id],
        updatedAt: now,
      };
      await requestRepository.save(updated);
      return updated;
    },

    async resolve(organizationId, reviewRequestId, status, reviewerWorkerId, summary, qualityScore) {
      const request = await requireRequest(organizationId, reviewRequestId);
      const now = nowIso();
      const result: ReviewResult = { reviewRequestId, status, reviewerWorkerId, qualityScore, summary, completedAt: now };
      const updated: ReviewRequest = { ...request, status, result, updatedAt: now };
      await requestRepository.save(updated);
      return updated;
    },
  };
}
