/** @module commission/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CommissionPlanId } from '../shared/identifiers.js';

export type { CommissionPlanId };

export type CommissionPlanType = 'fixed' | 'percentage' | 'tiered';

export type CommissionPlanStatus = 'active' | 'archived';

/** A tier applies its `rate` to the whole deal amount once that amount meets `minAmount` — the highest matching tier wins. */
export interface CommissionTier {
  readonly minAmount: string;
  readonly rate: string;
}

/** A named commission rule: fixed amount, a flat percentage, or amount-tiered rates. */
export interface CommissionPlan extends TenantAuditableEntity<CommissionPlanId> {
  readonly name: string;
  readonly planType: CommissionPlanType;
  readonly status: CommissionPlanStatus;
  /** Used when `planType === 'fixed'`. */
  readonly fixedAmount?: string;
  /** Used when `planType === 'percentage'`, as a percentage (e.g. `"10"` for 10%). */
  readonly percentageRate?: string;
  /** Used when `planType === 'tiered'`. */
  readonly tiers?: readonly CommissionTier[];
}

export type { OrganizationId } from '../shared/identifiers.js';
