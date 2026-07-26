/** Real in-memory {@link ApprovalStepRepository} / {@link ApprovalChainRepository} implementations. @module approval/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ApprovalChain, ApprovalStep } from './types.js';
import type { ApprovalChainRepository, ApprovalStepRepository } from './repository.js';

export function createApprovalStepRepository(seed?: readonly ApprovalStep[]): ApprovalStepRepository {
  return createInMemoryRepository<ApprovalStep>({ seed });
}

export function createApprovalChainRepository(seed?: readonly ApprovalChain[]): ApprovalChainRepository {
  return createInMemoryRepository<ApprovalChain>({ seed });
}
