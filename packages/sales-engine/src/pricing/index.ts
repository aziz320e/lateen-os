/**
 * Product Pricing — composes with the Business DNA Product Catalog for
 * list price and bundle price; computes negotiated and volume pricing
 * deterministically.
 * @module pricing
 */
export * from './types.js';
export {
  createProductPricingService,
  computeNegotiatedPrice,
  computeVolumePrice,
  type ProductPricingService,
} from './engine.impl.js';
