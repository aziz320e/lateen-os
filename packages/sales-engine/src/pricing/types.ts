/** @module pricing/types */
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';

/** A single volume-pricing break — the highest matching tier (by `minQuantity`) applies. */
export interface VolumePricingTier {
  readonly minQuantity: string;
  /** Overrides the list price outright for this tier, if set. */
  readonly unitPrice?: string;
  /** Discount off the list price for this tier, used when `unitPrice` is not set. */
  readonly discountPct?: string;
}

/** Real, optionally-injected Business DNA Product Catalog collaborator. */
export interface ProductPricingDeps {
  readonly businessDna?: Pick<BusinessDnaRuntime, 'products'>;
}
