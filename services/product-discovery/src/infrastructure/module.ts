/** @module infrastructure/module */
import type { ProductDiscoveryCompositionRoot } from './composition-root.js';
import type { ProductDiscoveryDependencies } from './dependencies.js';

/** Service module descriptor for bootstrap and lifecycle. */
export interface ProductDiscoveryModule {
  readonly name: 'product-discovery';
  readonly version: string;
  readonly compositionRoot: ProductDiscoveryCompositionRoot;
  readonly dependencies: ProductDiscoveryDependencies;
}

export interface ProductDiscoveryModuleFactory {
  create(deps: ProductDiscoveryDependencies): ProductDiscoveryModule;
}
