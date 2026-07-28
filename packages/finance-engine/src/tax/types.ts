/** @module tax/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { TaxCalculationId, TaxRuleId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { TaxCalculationId, TaxRuleId };

/** The five deterministic tax types the Tax Engine supports. */
export type TaxType = 'VAT' | 'GST' | 'SALES_TAX' | 'ZERO_RATED' | 'EXEMPT';

/** A configurable tax rule — a named rate for a tax type, optionally scoped to a jurisdiction. */
export interface TaxRule extends TenantAuditableEntity<TaxRuleId> {
  readonly name: string;
  readonly taxType: TaxType;
  readonly ratePct: string;
  readonly jurisdiction?: string;
  readonly active: boolean;
}

/** A single deterministic application of a {@link TaxRule} to a taxable amount. */
export interface TaxCalculation extends TenantAuditableEntity<TaxCalculationId> {
  readonly taxRuleId: TaxRuleId;
  readonly taxableAmount: string;
  readonly taxAmount: string;
  readonly totalAmount: string;
  readonly calculatedAt: ISODateTime;
}
