/** @module queries/provider-queries */
import type {
  EstimateCostQuery,
  EstimateCostResult,
  ListModelsQuery,
  ListModelsResult,
  ListProvidersQuery,
  ListProvidersResult,
  ProviderHealthQuery,
  ProviderHealthResult,
  SelectProviderQuery,
  SelectProviderResult,
} from './types.js';

/** Read-side query port for provider hub. */
export interface ProviderQueries {
  listProviders(query: ListProvidersQuery): Promise<ListProvidersResult>;
  listModels(query: ListModelsQuery): Promise<ListModelsResult>;
  estimateCost(query: EstimateCostQuery): Promise<EstimateCostResult>;
  selectProvider(query: SelectProviderQuery): Promise<SelectProviderResult>;
  getHealth(query: ProviderHealthQuery): Promise<ProviderHealthResult>;
}
