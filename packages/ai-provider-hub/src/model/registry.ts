/** @module model/registry */
import type { ModelId, ProviderId } from '../shared/identifiers.js';
import type { ModelMetadata, ModelRegistration, ModelSelectionCriteria } from './types.js';
import type { ProviderCapability } from '../provider/types.js';

/** Model registry port — lists and resolves models. */
export interface ModelRegistry {
  register(registration: ModelRegistration): void;
  unregister(modelId: ModelId): void;
  get(modelId: ModelId): ModelRegistration | undefined;
  list(): readonly ModelRegistration[];
  listByProvider(providerId: ProviderId): readonly ModelRegistration[];
  findByCapability(capability: ProviderCapability): readonly ModelRegistration[];
  select(criteria: ModelSelectionCriteria): readonly ModelMetadata[];
  getMetadata(modelId: ModelId): ModelMetadata | undefined;
}
