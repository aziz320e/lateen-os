/** @module account/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AccountId } from '../shared/identifiers.js';

export type { AccountId };

/** The five account types of the Chart of Accounts. */
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export type AccountStatus = 'draft' | 'active' | 'inactive' | 'archived';

/** Which side of a journal entry increases this account's balance. */
export type NormalBalance = 'debit' | 'credit';

/** A single Chart of Accounts entry. Hierarchical via `parentAccountId`. */
export interface Account extends TenantAuditableEntity<AccountId> {
  readonly code: string;
  readonly name: string;
  readonly accountType: AccountType;
  readonly normalBalance: NormalBalance;
  readonly parentAccountId?: AccountId;
  readonly description?: string;
  readonly status: AccountStatus;
  /** Stamped on `archive()`; consumed by `restore()` to return to the correct prior status. */
  readonly statusBeforeArchive?: AccountStatus;
  readonly currentVersion: number;
}
