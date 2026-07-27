/**
 * Product aggregate — Lateen catalog with manufacturing and AI metadata.
 * @module product
 */
export * from './types.js';
export * from './value-objects.js';
export * from './events.js';
export * from './repository.js';
export { createProductRepository, createProductBundleRepository } from './repository.impl.js';
export {
  createProductCatalogService,
  canTransitionProduct,
  type ProductCatalogService,
  type CreateProductInput,
  type UpdatePricingInput,
  type CreateBundleInput,
} from './catalog.impl.js';
