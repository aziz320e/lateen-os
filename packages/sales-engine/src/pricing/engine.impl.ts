/**
 * Real Product Pricing — composes with the Business DNA Product Catalog
 * (through its public runtime API only) for list price and bundle price,
 * and computes negotiated and volume pricing deterministically and
 * entirely offline.
 *
 * @module pricing/engine.impl
 */
import type { OrganizationId, ProductBundleId, ProductId } from '../shared/identifiers.js';
import type { ProductPricingDeps, VolumePricingTier } from './types.js';

function parseDecimal(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoney(value: number): string {
  return value.toFixed(2);
}

/** Pure: list price reduced by a negotiated discount percentage. */
export function computeNegotiatedPrice(listPrice: string, discountPct: string): string {
  const list = parseDecimal(listPrice);
  const discount = parseDecimal(discountPct);
  return toMoney(list * (1 - discount / 100));
}

/** Pure: applies the highest volume tier whose `minQuantity` is at or below the given quantity. */
export function computeVolumePrice(listPrice: string, quantity: string, tiers: readonly VolumePricingTier[]): string {
  const qty = parseDecimal(quantity);
  const list = parseDecimal(listPrice);

  const applicableTier = [...tiers]
    .filter((tier) => parseDecimal(tier.minQuantity) <= qty)
    .sort((a, b) => parseDecimal(b.minQuantity) - parseDecimal(a.minQuantity))[0];

  if (!applicableTier) return toMoney(list);
  if (applicableTier.unitPrice) return toMoney(parseDecimal(applicableTier.unitPrice));
  return toMoney(list * (1 - parseDecimal(applicableTier.discountPct ?? '0') / 100));
}

export interface ProductPricingService {
  /** Real Business DNA Product Catalog list price. `null` if Business DNA is not injected or the product is unknown. */
  getListPrice(organizationId: OrganizationId, productId: ProductId): Promise<string | null>;
  /** Real Business DNA Product Catalog bundle price. `null` if Business DNA is not injected or the bundle is unknown. */
  getBundlePrice(organizationId: OrganizationId, bundleId: ProductBundleId): Promise<string | null>;
  computeNegotiatedPrice(listPrice: string, discountPct: string): string;
  computeVolumePrice(listPrice: string, quantity: string, tiers: readonly VolumePricingTier[]): string;
}

/** Creates a real {@link ProductPricingService} over an optionally-injected Business DNA Product Catalog. */
export function createProductPricingService(deps: ProductPricingDeps): ProductPricingService {
  return {
    async getListPrice(organizationId, productId) {
      if (!deps.businessDna) return null;
      const product = await deps.businessDna.products.getProduct(organizationId, productId);
      return product?.basePrice ?? null;
    },

    async getBundlePrice(organizationId, bundleId) {
      if (!deps.businessDna) return null;
      const bundle = await deps.businessDna.products.getBundle(organizationId, bundleId);
      return bundle?.bundlePrice ?? null;
    },

    computeNegotiatedPrice,
    computeVolumePrice,
  };
}
