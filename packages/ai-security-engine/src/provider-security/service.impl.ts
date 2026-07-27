/**
 * Real Provider Security service — Provider Allow List, Model Allow
 * List, and Capability Restrictions, deterministically evaluated (deny
 * always wins over allow), and optionally cross-checked against the
 * real AI Provider Hub registries (never a repository — the hub's own
 * exported `ProviderRegistry`/`ModelRegistry` factories are its public
 * API).
 *
 * @module provider-security/service.impl
 */
import type { ModelRegistry, ProviderRegistry } from '@lateen-os/ai-provider-hub';
import type { SecurityEventBus } from '../events/security-event-bus.js';
import { ProviderPolicyNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ProviderPolicyId } from '../shared/identifiers.js';
import type { ProviderSecurityPolicyRepository } from './repository.js';
import type {
  EvaluateProviderRequest,
  ModelId,
  ProviderCapability,
  ProviderKind,
  ProviderRequestEvaluation,
  ProviderSecurityPolicy,
} from './types.js';

/** Real, optionally-injected AI Provider Hub collaborators — the exported registry factories, never a repository. */
export interface ProviderSecurityDeps {
  readonly providerRegistry?: Pick<ProviderRegistry, 'findByKind'>;
  readonly modelRegistry?: Pick<ModelRegistry, 'get'>;
}

export interface CreateProviderPolicyInput {
  readonly name: string;
  readonly allowedProviders?: readonly ProviderKind[];
  readonly deniedProviders?: readonly ProviderKind[];
  readonly allowedModels?: readonly ModelId[];
  readonly deniedModels?: readonly ModelId[];
  readonly allowedCapabilities?: readonly ProviderCapability[];
  readonly deniedCapabilities?: readonly ProviderCapability[];
}

/** Pure: deny list always wins; an empty allow list means "no restriction" (everything not denied is allowed). */
function isAllowed<T>(value: T, allowList: readonly T[], denyList: readonly T[]): boolean {
  if (denyList.includes(value)) return false;
  if (allowList.length === 0) return true;
  return allowList.includes(value);
}

export interface ProviderSecurityService {
  createPolicy(organizationId: OrganizationId, input: CreateProviderPolicyInput): Promise<ProviderSecurityPolicy>;
  archivePolicy(organizationId: OrganizationId, policyId: ProviderPolicyId): Promise<ProviderSecurityPolicy>;
  getPolicy(organizationId: OrganizationId, policyId: ProviderPolicyId): Promise<ProviderSecurityPolicy | null>;
  isProviderAllowed(policy: ProviderSecurityPolicy, providerKind: ProviderKind): boolean;
  isModelAllowed(policy: ProviderSecurityPolicy, modelId: ModelId): boolean;
  isCapabilityAllowed(policy: ProviderSecurityPolicy, capability: ProviderCapability): boolean;
  /** Evaluates a provider/model/capability request against a policy; publishes `provider.blocked` when denied. */
  evaluateProviderRequest(organizationId: OrganizationId, policyId: ProviderPolicyId, request: EvaluateProviderRequest): Promise<ProviderRequestEvaluation>;
  /** `true` when the AI Provider Hub is injected and has this provider kind registered. `false` when not injected. */
  isProviderRegisteredInHub(providerKind: ProviderKind): boolean;
  /** `true` when the AI Provider Hub is injected and has this model registered. `false` when not injected. */
  isModelRegisteredInHub(modelId: ModelId): boolean;
}

/** Creates a real {@link ProviderSecurityService} backed by a {@link ProviderSecurityPolicyRepository} and an optional real AI Provider Hub. */
export function createProviderSecurityService(
  repository: ProviderSecurityPolicyRepository,
  deps: ProviderSecurityDeps = {},
  eventBus?: SecurityEventBus,
  now: () => string = nowIso,
): ProviderSecurityService {
  async function requirePolicy(organizationId: OrganizationId, policyId: ProviderPolicyId): Promise<ProviderSecurityPolicy> {
    const policy = await repository.findById(organizationId, policyId);
    if (!policy) throw new ProviderPolicyNotFoundError(policyId);
    return policy;
  }

  function isProviderAllowed(policy: ProviderSecurityPolicy, providerKind: ProviderKind): boolean {
    return isAllowed(providerKind, policy.allowedProviders, policy.deniedProviders);
  }

  function isModelAllowed(policy: ProviderSecurityPolicy, modelId: ModelId): boolean {
    return isAllowed(modelId, policy.allowedModels, policy.deniedModels);
  }

  function isCapabilityAllowed(policy: ProviderSecurityPolicy, capability: ProviderCapability): boolean {
    return isAllowed(capability, policy.allowedCapabilities, policy.deniedCapabilities);
  }

  return {
    async createPolicy(organizationId, input) {
      const timestamp = now();
      const policy: ProviderSecurityPolicy = {
        id: generateId('provider-policy'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        status: 'active',
        allowedProviders: input.allowedProviders ?? [],
        deniedProviders: input.deniedProviders ?? [],
        allowedModels: input.allowedModels ?? [],
        deniedModels: input.deniedModels ?? [],
        allowedCapabilities: input.allowedCapabilities ?? [],
        deniedCapabilities: input.deniedCapabilities ?? [],
      };
      await repository.save(policy);
      return policy;
    },

    async archivePolicy(organizationId, policyId) {
      const policy = await requirePolicy(organizationId, policyId);
      const updated: ProviderSecurityPolicy = { ...policy, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getPolicy(organizationId, policyId) {
      return repository.findById(organizationId, policyId);
    },

    isProviderAllowed,
    isModelAllowed,
    isCapabilityAllowed,

    async evaluateProviderRequest(organizationId, policyId, request) {
      const policy = await requirePolicy(organizationId, policyId);

      if (!isProviderAllowed(policy, request.providerKind)) {
        eventBus?.publish('provider.blocked', { organizationId, providerKind: request.providerKind, reason: 'provider_not_allowed' });
        return { allowed: false, reason: 'provider_not_allowed' };
      }
      if (request.modelId && !isModelAllowed(policy, request.modelId)) {
        eventBus?.publish('provider.blocked', { organizationId, providerKind: request.providerKind, reason: 'model_not_allowed' });
        return { allowed: false, reason: 'model_not_allowed' };
      }
      for (const capability of request.capabilities ?? []) {
        if (!isCapabilityAllowed(policy, capability)) {
          eventBus?.publish('provider.blocked', { organizationId, providerKind: request.providerKind, reason: 'capability_not_allowed' });
          return { allowed: false, reason: 'capability_not_allowed' };
        }
      }
      return { allowed: true };
    },

    isProviderRegisteredInHub(providerKind) {
      if (!deps.providerRegistry) return false;
      return deps.providerRegistry.findByKind(providerKind).length > 0;
    },

    isModelRegisteredInHub(modelId) {
      if (!deps.modelRegistry) return false;
      return deps.modelRegistry.get(modelId) !== undefined;
    },
  };
}
