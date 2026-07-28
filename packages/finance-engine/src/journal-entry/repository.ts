/** @module journal-entry/repository */
import type { AccountId } from '../account/types.js';
import type { Repository } from '../shared/repository.js';
import type { FiscalPeriodId, JournalEntryId, OrganizationId, RecurringJournalTemplateId } from '../shared/identifiers.js';
import type { JournalEntry, JournalEntryStatus, RecurringJournalTemplate } from './types.js';

export interface JournalEntryRepository extends Repository<JournalEntry, JournalEntryId> {
  findAll(organizationId: OrganizationId): Promise<readonly JournalEntry[]>;
  findByStatus(organizationId: OrganizationId, status: JournalEntryStatus): Promise<readonly JournalEntry[]>;
  findByAccount(organizationId: OrganizationId, accountId: AccountId): Promise<readonly JournalEntry[]>;
  findByFiscalPeriod(organizationId: OrganizationId, fiscalPeriodId: FiscalPeriodId): Promise<readonly JournalEntry[]>;
}

export interface RecurringJournalTemplateRepository extends Repository<RecurringJournalTemplate, RecurringJournalTemplateId> {
  findAll(organizationId: OrganizationId): Promise<readonly RecurringJournalTemplate[]>;
}
