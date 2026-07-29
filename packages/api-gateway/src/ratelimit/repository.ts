/** @module ratelimit/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, QuotaId, RateLimitCounterId, RateLimitPolicyId } from '../shared/identifiers.js';
import type { Quota, RateLimitCounter, RateLimitPolicy } from './types.js';

export interface RateLimitPolicyRepository extends Repository<RateLimitPolicy, RateLimitPolicyId> {
  findAll(organizationId: OrganizationId): Promise<readonly RateLimitPolicy[]>;
}

export interface RateLimitCounterRepository extends Repository<RateLimitCounter, RateLimitCounterId> {
  findAll(organizationId: OrganizationId): Promise<readonly RateLimitCounter[]>;
  findByPolicyAndPrincipal(organizationId: OrganizationId, policyId: RateLimitPolicyId, principalId: string): Promise<RateLimitCounter | null>;
}

export interface QuotaRepository extends Repository<Quota, QuotaId> {
  findAll(organizationId: OrganizationId): Promise<readonly Quota[]>;
  findByPrincipal(organizationId: OrganizationId, principalId: string): Promise<readonly Quota[]>;
}
