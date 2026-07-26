/** @module conflict */
export * from './types.js';
export * from './repository.js';
export { createConflictRepository } from './repository.impl.js';
export { createConflictDetector, type ConflictDetector } from './detector.impl.js';
export {
  createConflictResolver,
  tallyProposalVotes,
  type ConflictResolver,
  type ProposalVote,
  type VoteTallyOutcome,
} from './resolver.impl.js';
