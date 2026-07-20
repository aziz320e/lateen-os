/** @module delegation/repository */
import type { Repository } from '../shared/repository.js';
import type { DelegationId, DelegationRequest, DelegationRule, DelegationRuleId } from './types.js';

export type DelegationRequestRepository = Repository<DelegationRequest, DelegationId>;
export type DelegationRuleRepository = Repository<DelegationRule, DelegationRuleId>;
