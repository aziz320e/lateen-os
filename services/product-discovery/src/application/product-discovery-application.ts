/** @module application/product-discovery-application */
import type { ProductDiscoveryService } from '../ports/inbound/product-discovery-service.js';
import type { ProductDiscoveryWorkflow } from '../workflows/product-discovery-workflow.js';

/** Application layer — coordinates workflow execution behind the inbound port. */
export interface ProductDiscoveryApplicationService extends ProductDiscoveryService {}

export interface ProductDiscoveryApplicationDependencies {
  readonly workflow: ProductDiscoveryWorkflow;
}

/** Factory for the application service (implementation external). */
export interface ProductDiscoveryApplicationFactory {
  create(deps: ProductDiscoveryApplicationDependencies): ProductDiscoveryApplicationService;
}
