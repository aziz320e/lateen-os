/** @module financial-organization/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AccountingSettingsId, FiscalPeriodId, FiscalYearId, NumberingSequenceId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate } from '../shared/primitives.js';

export type { AccountingSettingsId, FiscalPeriodId, FiscalYearId, NumberingSequenceId };

export type FiscalYearStatus = 'open' | 'closed';

/** One financial year, spanning a fixed calendar range. */
export interface FiscalYear extends TenantAuditableEntity<FiscalYearId> {
  readonly name: string;
  readonly startDate: ISODate;
  readonly endDate: ISODate;
  readonly status: FiscalYearStatus;
}

export type FiscalPeriodStatus = 'open' | 'closed';

/** A sub-division of a fiscal year (typically monthly) — the unit that is opened/closed for posting. */
export interface FiscalPeriod extends TenantAuditableEntity<FiscalPeriodId> {
  readonly fiscalYearId: FiscalYearId;
  readonly periodNumber: number;
  readonly name: string;
  readonly startDate: ISODate;
  readonly endDate: ISODate;
  readonly status: FiscalPeriodStatus;
}

/** Organization-wide accounting configuration — one record per organization (an upsert target, not a list). */
export interface AccountingSettings extends TenantAuditableEntity<AccountingSettingsId> {
  readonly baseCurrency: CurrencyCode;
  /** 1 (January) - 12 (December). */
  readonly fiscalYearStartMonth: number;
  readonly decimalPrecision: number;
}

/** The six numbering sequences the Finance Engine hands out document numbers from. */
export type NumberingSequenceType = 'journal_entry' | 'invoice' | 'credit_note' | 'bill' | 'vendor_credit' | 'payment';

/** A monotonically increasing, organization-scoped document numbering sequence. */
export interface NumberingSequence extends TenantAuditableEntity<NumberingSequenceId> {
  readonly sequenceType: NumberingSequenceType;
  readonly prefix?: string;
  readonly nextNumber: number;
  readonly padding: number;
}
