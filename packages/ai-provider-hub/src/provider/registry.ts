/** @module provider/registry */
import type { ProviderId } from '../shared/identifiers.js';
import type { ProviderCapability, ProviderKind, ProviderMetadata, ProviderRegistration } from './types.js';

/** Registry port — lists and resolves registered providers. */
export interface ProviderRegistry {
  register(registration: ProviderRegistration): void;
  unregister(providerId: ProviderId): void;
  get(providerId: ProviderId): ProviderRegistration | undefined;
  list(): readonly ProviderRegistration[];
  findByKind(kind: ProviderKind): readonly ProviderRegistration[];
  findByCapability(capability: ProviderCapability): readonly ProviderRegistration[];
  getMetadata(providerId: ProviderId): ProviderMetadata | undefined;
}
