/** Real, in-memory General Ledger repositories. @module journal-entry/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { JournalEntryRepository, RecurringJournalTemplateRepository } from './repository.js';
import type { JournalEntry, RecurringJournalTemplate } from './types.js';

/** Creates a real, in-memory {@link JournalEntryRepository}. */
export function createJournalEntryRepository(seed?: readonly JournalEntry[]): JournalEntryRepository {
  const repo = createInMemoryRepository<JournalEntry>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((entry) => entry.status === status);
    },
    async findByAccount(organizationId, accountId) {
      return repo.list(organizationId).filter((entry) => entry.lines.some((line) => line.accountId === accountId));
    },
    async findByFiscalPeriod(organizationId, fiscalPeriodId) {
      return repo.list(organizationId).filter((entry) => entry.fiscalPeriodId === fiscalPeriodId);
    },
  };
}

/** Creates a real, in-memory {@link RecurringJournalTemplateRepository}. */
export function createRecurringJournalTemplateRepository(seed?: readonly RecurringJournalTemplate[]): RecurringJournalTemplateRepository {
  const repo = createInMemoryRepository<RecurringJournalTemplate>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
