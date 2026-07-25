/**
 * Real {@link ProviderQueries} implementation — a CQRS read layer composed
 * over the registries, cost calculator, selector, and health checker.
 *
 * @module queries/provider-queries.impl
 */
import type { ModelRegistry } from '../model/registry.js';
import type { ProviderRegistry } from '../provider/registry.js';
import type { ProviderHealth } from '../provider/health.js';
import type { ProviderSelector } from '../routing/selector.js';
import type { CostCalculator } from '../cost/calculator.js';
import type { RoutingStrategy } from '../routing/types.js';
import type { ProviderQueries } from './provider-queries.js';

export interface ProviderQueriesDeps {
  readonly providerRegistry: ProviderRegistry;
  readonly modelRegistry: ModelRegistry;
  readonly costCalculator: CostCalculator;
  readonly selector: ProviderSelector;
  readonly health: ProviderHealth;
}

/** Creates a {@link ProviderQueries} read port over the given hub components. */
export function createProviderQueries(deps: ProviderQueriesDeps): ProviderQueries {
  return {
    async listProviders(query) {
      let providers = query.capability
        ? deps.providerRegistry.findByCapability(query.capability)
        : deps.providerRegistry.list();
      if (!query.includeDisabled) {
        providers = providers.filter((registration) => registration.status !== 'disabled');
      }
      return {
        providers: providers.map((registration) => ({
          id: registration.metadata.id,
          kind: registration.metadata.kind,
          displayName: registration.metadata.displayName,
        })),
      };
    },

    async listModels(query) {
      let models = deps.modelRegistry.list().map((registration) => registration.metadata);
      if (query.providerId) {
        models = models.filter((model) => model.providerId === query.providerId);
      }
      if (query.capability) {
        models = models.filter((model) => model.capabilities.includes(query.capability!));
      }
      return { models };
    },

    async estimateCost(query) {
      const model = deps.modelRegistry.getMetadata(query.modelId);
      if (!model) {
        return { breakdown: { promptCost: '0', completionCost: '0', cachedCost: '0', totalCost: '0', currency: 'USD' } };
      }
      return {
        breakdown: deps.costCalculator.calculate({
          providerId: model.providerId,
          modelId: query.modelId,
          promptTokens: query.promptTokens,
          completionTokens: query.completionTokens,
        }),
      };
    },

    async selectProvider(query) {
      const decision = await deps.selector.select(
        { capability: query.capability, policy: { strategy: query.strategy as RoutingStrategy } },
        { providerLatencies: {}, providerCosts: {}, providerHealth: {} },
      );
      return { decision };
    },

    async getHealth(query) {
      if (query.providerId) {
        return { health: [await deps.health.check(query.providerId)] };
      }
      return { health: await deps.health.checkAll() };
    },
  };
}
