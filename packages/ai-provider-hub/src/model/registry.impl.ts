/**
 * Real in-memory {@link ModelRegistry} implementation, seeded from the
 * static {@link MODEL_CATALOG} by default.
 *
 * @module model/registry.impl
 */
import { MODEL_CATALOG } from './catalog.js';
import type { ModelId } from '../shared/identifiers.js';
import type { ModelMetadata, ModelRegistration, ModelSelectionCriteria } from './types.js';
import type { ModelRegistry } from './registry.js';

export interface CreateModelRegistryOptions {
  /** Overrides the default catalog-derived seed data. */
  readonly seed?: readonly ModelRegistration[];
}

function defaultRegistrations(): ModelRegistration[] {
  return MODEL_CATALOG.map((metadata) => ({ metadata, enabled: true }));
}

function matchesCriteria(model: ModelMetadata, criteria: ModelSelectionCriteria): boolean {
  if (!model.capabilities.includes(criteria.capability)) return false;
  if (criteria.minContextWindow !== undefined && model.contextWindow < criteria.minContextWindow) return false;
  if (criteria.requiresReasoning && !model.supportsReasoning) return false;
  if (
    criteria.preferredProviderKinds?.length &&
    !criteria.preferredProviderKinds.includes(model.providerKind)
  ) {
    return false;
  }
  if (criteria.maxCostPer1kTokens !== undefined) {
    const per1kTokens =
      (parseFloat(model.pricing.promptTokenUsd) + parseFloat(model.pricing.completionTokenUsd)) * 1000;
    if (per1kTokens > parseFloat(criteria.maxCostPer1kTokens)) return false;
  }
  return true;
}

/** Creates an in-memory {@link ModelRegistry}, pre-populated with every cataloged model. */
export function createModelRegistry(options: CreateModelRegistryOptions = {}): ModelRegistry {
  const store = new Map<ModelId, ModelRegistration>();

  for (const registration of options.seed ?? defaultRegistrations()) {
    store.set(registration.metadata.id, registration);
  }

  return {
    register(registration) {
      store.set(registration.metadata.id, registration);
    },
    unregister(modelId) {
      store.delete(modelId);
    },
    get(modelId) {
      return store.get(modelId);
    },
    list() {
      return Array.from(store.values());
    },
    listByProvider(providerId) {
      return Array.from(store.values()).filter((registration) => registration.metadata.providerId === providerId);
    },
    findByCapability(capability) {
      return Array.from(store.values()).filter((registration) =>
        registration.metadata.capabilities.includes(capability),
      );
    },
    select(criteria) {
      return Array.from(store.values())
        .map((registration) => registration.metadata)
        .filter((metadata) => matchesCriteria(metadata, criteria));
    },
    getMetadata(modelId) {
      return store.get(modelId)?.metadata;
    },
  };
}
