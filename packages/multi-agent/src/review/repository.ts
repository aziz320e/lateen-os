/** @module review/repository */
import type { Repository } from '../shared/repository.js';
import type {
  ReviewComment,
  ReviewCommentId,
  ReviewRequest,
  ReviewRequestId,
} from './types.js';

export type ReviewRequestRepository = Repository<ReviewRequest, ReviewRequestId>;
export type ReviewCommentRepository = Repository<ReviewComment, ReviewCommentId>;
