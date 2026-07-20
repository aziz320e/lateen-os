/** @module delegation/repository */
import type { Repository } from '../shared/repository.js';
import type {
  CollaborationDelegationId,
  DelegationPolicy,
  DelegationPolicyId,
  DelegationRequest,
} from './types.js';

export type DelegationRequestRepository = Repository<DelegationRequest, CollaborationDelegationId>;
export type DelegationPolicyRepository = Repository<DelegationPolicy, DelegationPolicyId>;
