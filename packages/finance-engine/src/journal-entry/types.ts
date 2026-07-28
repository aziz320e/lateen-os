/** @module journal-entry/types */
import type { AccountId } from '../account/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { FiscalPeriodId } from '../shared/identifiers.js';
import type { JournalEntryId, RecurringJournalTemplateId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate } from '../shared/primitives.js';

export type { JournalEntryId, RecurringJournalTemplateId };

export type JournalEntryStatus = 'draft' | 'posted' | 'reversed';

/** One debit/credit line of a journal entry. Exactly one of `debit`/`credit` is normally non-zero. */
export interface JournalLine {
  readonly accountId: AccountId;
  readonly debit: string;
  readonly credit: string;
  readonly description?: string;
}

/** A double-entry accounting record. Must balance (`sum(debit) === sum(credit)`) before it can be created. */
export interface JournalEntry extends TenantAuditableEntity<JournalEntryId> {
  readonly entryNumber?: string;
  readonly entryDate: ISODate;
  readonly memo?: string;
  readonly lines: readonly JournalLine[];
  readonly currency: CurrencyCode;
  readonly status: JournalEntryStatus;
  readonly fiscalPeriodId?: FiscalPeriodId;
  readonly recurringTemplateId?: RecurringJournalTemplateId;
  /** Set on a reversing entry — the entry it reverses. */
  readonly reversalOfEntryId?: JournalEntryId;
  /** Set on the original entry once it has been reversed. */
  readonly reversedByEntryId?: JournalEntryId;
}

export type RecurringFrequency = 'monthly' | 'quarterly' | 'annually';

/** A template that periodically generates new draft journal entries. */
export interface RecurringJournalTemplate extends TenantAuditableEntity<RecurringJournalTemplateId> {
  readonly memo?: string;
  readonly lines: readonly JournalLine[];
  readonly currency: CurrencyCode;
  readonly frequency: RecurringFrequency;
  readonly startDate: ISODate;
  readonly endDate?: ISODate;
  readonly lastGeneratedDate?: ISODate;
  readonly active: boolean;
}
