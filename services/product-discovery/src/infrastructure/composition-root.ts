/** @module infrastructure/composition-root */
import type { ProductDiscoveryApplicationService } from '../application/product-discovery-application.js';
import type { ProductDiscoveryDependencies } from './dependencies.js';
import type { ProductDiscoveryWorkflow } from '../workflows/product-discovery-workflow.js';

/** Composition root — wires dependencies into executable service contracts. */
export interface ProductDiscoveryCompositionRoot {
  createWorkflow(deps: ProductDiscoveryDependencies): ProductDiscoveryWorkflow;

  createApplicationService(deps: ProductDiscoveryDependencies): ProductDiscoveryApplicationService;
}
