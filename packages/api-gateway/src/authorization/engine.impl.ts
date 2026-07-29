/**
 * Real Authorization engine — the Authorization Pipeline and
 * deterministic Policy Evaluation. No ML, no heuristics: matching is
 * fixed exact/prefix string comparison, and the decision is the
 * highest-priority matching policy, defaulting to deny.
 *
 * @module authorization/engine.impl
 */
import { PolicyNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, PolicyId } from '../shared/identifiers.js';
import type { PolicyRepository } from './repository.js';
import type { Policy, PolicyEffect } from './types.js';

/** Exact match, or a trailing `*` prefix match (e.g. `/api/crm/*` matches `/api/crm/customers`). */
export function matchesPattern(pattern: string, value: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) return value.startsWith(pattern.slice(0, -1));
  return pattern === value;
}

export interface PolicyEvaluationInput {
  readonly resource: string;
  readonly action: string;
  readonly principalScopes?: readonly string[];
}

export interface PolicyDecision {
  readonly effect: PolicyEffect;
  readonly matchedPolicyId?: PolicyId;
}

/**
 * Deterministic policy evaluation over an in-memory policy list: only
 * `active` policies whose resource/action match are candidates; among
 * candidates whose `principalScope` (if any) is present in
 * `principalScopes`, the highest-`priority` one wins. No match at all
 * is `deny`.
 */
export function evaluatePolicies(policies: readonly Policy[], input: PolicyEvaluationInput): PolicyDecision {
  const scopes = input.principalScopes ?? [];
  const candidates = policies.filter(
    (policy) =>
      policy.status === 'active' &&
      matchesPattern(policy.resource, input.resource) &&
      matchesPattern(policy.action, input.action) &&
      (!policy.principalScope || scopes.includes(policy.principalScope)),
  );
  if (candidates.length === 0) return { effect: 'deny' };

  const winner = candidates.reduce((best, candidate) => (candidate.priority > best.priority ? candidate : best));
  return { effect: winner.effect, matchedPolicyId: winner.id };
}

export interface CreatePolicyInput {
  readonly name: string;
  readonly effect: PolicyEffect;
  readonly resource: string;
  readonly action: string;
  readonly principalScope?: string;
  readonly priority?: number;
}

export interface AuthorizationEngine {
  createPolicy(organizationId: OrganizationId, input: CreatePolicyInput): Promise<Policy>;
  activatePolicy(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy>;
  deactivatePolicy(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy>;
  evaluate(organizationId: OrganizationId, input: PolicyEvaluationInput): Promise<PolicyDecision>;
  get(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy | null>;
  list(organizationId: OrganizationId): Promise<readonly Policy[]>;
}

/** Creates a real {@link AuthorizationEngine}. */
export function createAuthorizationEngine(repository: PolicyRepository, now: () => string = nowIso): AuthorizationEngine {
  async function requirePolicy(organizationId: OrganizationId, policyId: PolicyId): Promise<Policy> {
    const policy = await repository.findById(organizationId, policyId);
    if (!policy) throw new PolicyNotFoundError(policyId);
    return policy;
  }

  return {
    async createPolicy(organizationId, input) {
      const timestamp = now();
      const policy: Policy = {
        id: generateId('gateway-policy'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        effect: input.effect,
        resource: input.resource,
        action: input.action,
        principalScope: input.principalScope,
        priority: input.priority ?? 0,
        status: 'active',
      };
      await repository.save(policy);
      return policy;
    },

    async activatePolicy(organizationId, policyId) {
      const policy = await requirePolicy(organizationId, policyId);
      const updated: Policy = { ...policy, status: 'active', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async deactivatePolicy(organizationId, policyId) {
      const policy = await requirePolicy(organizationId, policyId);
      const updated: Policy = { ...policy, status: 'inactive', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async evaluate(organizationId, input) {
      const policies = await repository.findAll(organizationId);
      return evaluatePolicies(policies, input);
    },

    async get(organizationId, policyId) {
      return repository.findById(organizationId, policyId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
