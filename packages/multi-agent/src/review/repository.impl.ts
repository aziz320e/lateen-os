/** Real in-memory review repository implementations. @module review/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ReviewComment, ReviewRequest } from './types.js';
import type { ReviewCommentRepository, ReviewRequestRepository } from './repository.js';

export function createReviewRequestRepository(seed?: readonly ReviewRequest[]): ReviewRequestRepository {
  const repo = createInMemoryRepository<ReviewRequest>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((request) => request.missionId === missionId);
    },
  };
}

export function createReviewCommentRepository(seed?: readonly ReviewComment[]): ReviewCommentRepository {
  const repo = createInMemoryRepository<ReviewComment>({ seed });
  return {
    ...repo,
    async findByRequest(organizationId, reviewRequestId) {
      return repo.list(organizationId).filter((comment) => comment.reviewRequestId === reviewRequestId);
    },
  };
}
