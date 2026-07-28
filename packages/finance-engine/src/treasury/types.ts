/** @module treasury/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CashAccountId, ReconciliationId, TreasuryTransactionId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate, ISODateTime } from '../shared/primitives.js';

export type { CashAccountId, ReconciliationId, TreasuryTransactionId };

export type CashAccountSubtype = 'cash' | 'bank';
export type CashAccountStatus = 'active' | 'inactive';

/** A cash or bank account holding a running balance. */
export interface CashAccount extends TenantAuditableEntity<CashAccountId> {
  readonly name: string;
  readonly accountSubtype: CashAccountSubtype;
  readonly currency: CurrencyCode;
  readonly bankName?: string;
  readonly accountNumber?: string;
  readonly balance: string;
  readonly status: CashAccountStatus;
}

export type TreasuryTransactionType = 'deposit' | 'withdrawal' | 'transfer';

/** A single, immutable movement of cash — a deposit, withdrawal, or transfer between two cash accounts. */
export interface TreasuryTransaction extends TenantAuditableEntity<TreasuryTransactionId> {
  readonly transactionType: TreasuryTransactionType;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly fromCashAccountId?: CashAccountId;
  readonly toCashAccountId?: CashAccountId;
  readonly occurredAt: ISODateTime;
  readonly memo?: string;
  readonly reconciled: boolean;
}

export type ReconciliationStatus = 'draft' | 'completed';

/** A bank reconciliation — statement balance vs. book balance, with the transactions matched to reach it. */
export interface Reconciliation extends TenantAuditableEntity<ReconciliationId> {
  readonly cashAccountId: CashAccountId;
  readonly statementBalance: string;
  readonly bookBalance: string;
  readonly discrepancy: string;
  readonly asOf: ISODate;
  readonly matchedTransactionIds: readonly TreasuryTransactionId[];
  readonly status: ReconciliationStatus;
}
