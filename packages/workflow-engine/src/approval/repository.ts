/** @module approval/repository */
import type { Repository } from '../shared/repository.js';
import type { ApprovalChain, ApprovalChainId, ApprovalStep, ApprovalStepId } from './types.js';

export type ApprovalStepRepository = Repository<ApprovalStep, ApprovalStepId>;
export type ApprovalChainRepository = Repository<ApprovalChain, ApprovalChainId>;
