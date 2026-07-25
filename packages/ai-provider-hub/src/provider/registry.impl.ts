/**
 * Real in-memory {@link ProviderRegistry} implementation, seeded from the
 * static {@link PROVIDER_CATALOG} by default.
 *
 * @module provider/registry.impl
 */
import { PROVIDER_CATALOG } from './catalog.js';
import type { ProviderId } from '../shared/identifiers.js';
import type { ProviderRegistration } from './types.js';
import type { ProviderRegistry } from './registry.js';

export interface CreateProviderRegistryOptions {
  /** Overrides the default catalog-derived seed data. */
  readonly seed?: readonly ProviderRegistration[];
}

function defaultRegistrations(): ProviderRegistration[] {
  return PROVIDER_CATALOG.map((metadata) => ({
    metadata,
    configuration: { baseUrl: metadata.defaultBaseUrl },
    status: 'active',
    priority: 0,
  }));
}

/** Creates an in-memory {@link ProviderRegistry}, pre-populated with every cataloged provider. */
export function createProviderRegistry(options: CreateProviderRegistryOptions = {}): ProviderRegistry {
  const store = new Map<ProviderId, ProviderRegistration>();

  for (const registration of options.seed ?? defaultRegistrations()) {
    store.set(registration.metadata.id, registration);
  }

  return {
    register(registration) {
      store.set(registration.metadata.id, registration);
    },
    unregister(providerId) {
      store.delete(providerId);
    },
    get(providerId) {
      return store.get(providerId);
    },
    list() {
      return Array.from(store.values());
    },
    findByKind(kind) {
      return Array.from(store.values()).filter((registration) => registration.metadata.kind === kind);
    },
    findByCapability(capability) {
      return Array.from(store.values()).filter((registration) =>
        registration.metadata.capabilities.includes(capability),
      );
    },
    getMetadata(providerId) {
      return store.get(providerId)?.metadata;
    },
  };
}
