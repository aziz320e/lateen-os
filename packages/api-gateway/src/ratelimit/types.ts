/** @module ratelimit/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { QuotaId, RateLimitCounterId, RateLimitPolicyId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { QuotaId, RateLimitCounterId, RateLimitPolicyId };

/** A fixed-window rate limit rule — at most `maxRequests` within any `windowSeconds` window. */
export interface RateLimitPolicy extends TenantAuditableEntity<RateLimitPolicyId> {
  readonly name: string;
  readonly windowSeconds: number;
  readonly maxRequests: number;
}

/** The current fixed window's request count for one (policy, principal) pair. */
export interface RateLimitCounter extends TenantAuditableEntity<RateLimitCounterId> {
  readonly policyId: RateLimitPolicyId;
  readonly principalId: string;
  readonly windowStart: ISODateTime;
  readonly count: number;
}

/** A fixed-period usage quota — at most `maxRequests` within any `periodDays`-day period, per principal. */
export interface Quota extends TenantAuditableEntity<QuotaId> {
  readonly principalId: string;
  readonly periodDays: number;
  readonly maxRequests: number;
  readonly periodStart: ISODateTime;
  readonly usedRequests: number;
}
