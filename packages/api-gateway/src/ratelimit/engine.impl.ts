/**
 * Real Rate Limiting and Quota Management engine — fixed-window
 * counters, deterministic reset-and-count arithmetic. No token
 * buckets with randomized jitter, no ML-based throttling — a fixed
 * window and a fixed threshold, exactly as configured.
 *
 * @module ratelimit/engine.impl
 */
import type { GatewayEventBus } from '../events/gateway-event-bus.js';
import { secondsBetweenIso } from '../shared/date.js';
import { QuotaNotFoundError, RateLimitPolicyNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, QuotaId, RateLimitPolicyId } from '../shared/identifiers.js';
import type { QuotaRepository, RateLimitCounterRepository, RateLimitPolicyRepository } from './repository.js';
import type { Quota, RateLimitCounter, RateLimitPolicy } from './types.js';

export interface RateLimitCheckResult {
  readonly exceeded: boolean;
  readonly remaining: number;
  readonly counter: RateLimitCounter;
}

/** Whether a fixed window that started at `windowStart` has elapsed as of `now`, given `windowSeconds`. */
export function isWindowExpired(windowStart: string, now: string, windowSeconds: number): boolean {
  return secondsBetweenIso(windowStart, now) >= windowSeconds;
}

export interface CreateRateLimitPolicyInput {
  readonly name: string;
  readonly windowSeconds: number;
  readonly maxRequests: number;
}

export interface CreateQuotaInput {
  readonly principalId: string;
  readonly periodDays: number;
  readonly maxRequests: number;
}

export interface QuotaCheckResult {
  readonly exceeded: boolean;
  readonly remaining: number;
  readonly quota: Quota;
}

export interface RateLimitEngine {
  createPolicy(organizationId: OrganizationId, input: CreateRateLimitPolicyInput): Promise<RateLimitPolicy>;
  checkAndConsume(organizationId: OrganizationId, policyId: RateLimitPolicyId, principalId: string): Promise<RateLimitCheckResult>;
  getPolicy(organizationId: OrganizationId, policyId: RateLimitPolicyId): Promise<RateLimitPolicy | null>;
  listPolicies(organizationId: OrganizationId): Promise<readonly RateLimitPolicy[]>;

  createQuota(organizationId: OrganizationId, input: CreateQuotaInput): Promise<Quota>;
  consumeQuota(organizationId: OrganizationId, quotaId: QuotaId): Promise<QuotaCheckResult>;
  getQuota(organizationId: OrganizationId, quotaId: QuotaId): Promise<Quota | null>;
  listQuotasForPrincipal(organizationId: OrganizationId, principalId: string): Promise<readonly Quota[]>;
}

/** Creates a real {@link RateLimitEngine}. */
export function createRateLimitEngine(
  policyRepository: RateLimitPolicyRepository,
  counterRepository: RateLimitCounterRepository,
  quotaRepository: QuotaRepository,
  eventBus?: GatewayEventBus,
  now: () => string = nowIso,
): RateLimitEngine {
  async function requirePolicy(organizationId: OrganizationId, policyId: RateLimitPolicyId): Promise<RateLimitPolicy> {
    const policy = await policyRepository.findById(organizationId, policyId);
    if (!policy) throw new RateLimitPolicyNotFoundError(policyId);
    return policy;
  }

  async function requireQuota(organizationId: OrganizationId, quotaId: QuotaId): Promise<Quota> {
    const quota = await quotaRepository.findById(organizationId, quotaId);
    if (!quota) throw new QuotaNotFoundError(quotaId);
    return quota;
  }

  return {
    async createPolicy(organizationId, input) {
      const timestamp = now();
      const policy: RateLimitPolicy = {
        id: generateId('gateway-ratelimit-policy'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        windowSeconds: input.windowSeconds,
        maxRequests: input.maxRequests,
      };
      await policyRepository.save(policy);
      return policy;
    },

    async checkAndConsume(organizationId, policyId, principalId) {
      const policy = await requirePolicy(organizationId, policyId);
      const timestamp = now();
      const existing = await counterRepository.findByPolicyAndPrincipal(organizationId, policyId, principalId);

      let counter: RateLimitCounter;
      if (!existing || isWindowExpired(existing.windowStart, timestamp, policy.windowSeconds)) {
        counter = {
          id: existing?.id ?? generateId('gateway-ratelimit-counter'),
          organizationId,
          createdAt: existing?.createdAt ?? timestamp,
          updatedAt: timestamp,
          policyId,
          principalId,
          windowStart: timestamp,
          count: 1,
        };
      } else {
        counter = { ...existing, count: existing.count + 1, updatedAt: timestamp };
      }
      await counterRepository.save(counter);

      const exceeded = counter.count > policy.maxRequests;
      if (exceeded) {
        eventBus?.publish('ratelimit.exceeded', { organizationId, policyId, principalId });
      }
      return { exceeded, remaining: Math.max(0, policy.maxRequests - counter.count), counter };
    },

    async getPolicy(organizationId, policyId) {
      return policyRepository.findById(organizationId, policyId);
    },

    async listPolicies(organizationId) {
      return policyRepository.findAll(organizationId);
    },

    async createQuota(organizationId, input) {
      const timestamp = now();
      const quota: Quota = {
        id: generateId('gateway-quota'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        principalId: input.principalId,
        periodDays: input.periodDays,
        maxRequests: input.maxRequests,
        periodStart: timestamp,
        usedRequests: 0,
      };
      await quotaRepository.save(quota);
      return quota;
    },

    async consumeQuota(organizationId, quotaId) {
      const quota = await requireQuota(organizationId, quotaId);
      const timestamp = now();
      const periodExpired = secondsBetweenIso(quota.periodStart, timestamp) >= quota.periodDays * 24 * 60 * 60;

      const updated: Quota = periodExpired
        ? { ...quota, periodStart: timestamp, usedRequests: 1, updatedAt: timestamp }
        : { ...quota, usedRequests: quota.usedRequests + 1, updatedAt: timestamp };
      await quotaRepository.save(updated);

      const exceeded = updated.usedRequests > updated.maxRequests;
      if (exceeded) {
        eventBus?.publish('quota.exceeded', { organizationId, quotaId, principalId: updated.principalId });
      }
      return { exceeded, remaining: Math.max(0, updated.maxRequests - updated.usedRequests), quota: updated };
    },

    async getQuota(organizationId, quotaId) {
      return quotaRepository.findById(organizationId, quotaId);
    },

    async listQuotasForPrincipal(organizationId, principalId) {
      return quotaRepository.findByPrincipal(organizationId, principalId);
    },
  };
}
