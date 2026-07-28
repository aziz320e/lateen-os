/**
 * Real General Ledger engine — double-entry journal entries with
 * balance validation, posting, reversing entries, and recurring
 * journal templates. Every entry must balance (`sum(debit) ===
 * sum(credit)`) before it can even be created — there is no way to
 * persist an unbalanced entry.
 *
 * @module journal-entry/engine.impl
 */
import type { AccountId, NormalBalance } from '../account/types.js';
import { addMonthsIso } from '../shared/date.js';
import { compareAmounts, subtractAmounts, sumAmounts } from '../shared/decimal.js';
import type { FinanceEventBus } from '../events/finance-event-bus.js';
import { InvalidJournalEntryTransitionError, JournalEntryNotFoundError, RecurringJournalTemplateNotFoundError, UnbalancedJournalEntryError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { FiscalPeriodId, JournalEntryId, OrganizationId, RecurringJournalTemplateId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate } from '../shared/primitives.js';
import type { JournalEntryRepository, RecurringJournalTemplateRepository } from './repository.js';
import type { JournalEntry, JournalEntryStatus, JournalLine, RecurringFrequency, RecurringJournalTemplate } from './types.js';

const JOURNAL_ENTRY_TRANSITIONS: Readonly<Record<JournalEntryStatus, readonly JournalEntryStatus[]>> = {
  draft: ['posted'],
  posted: ['reversed'],
  reversed: [],
};

/** Whether a journal entry may transition from one status to another. */
export function canTransitionJournalEntry(from: JournalEntryStatus, to: JournalEntryStatus): boolean {
  return JOURNAL_ENTRY_TRANSITIONS[from].includes(to);
}

/** Pure: total debits across a set of journal lines. */
export function sumDebits(lines: readonly JournalLine[]): string {
  return sumAmounts(lines.map((line) => line.debit));
}

/** Pure: total credits across a set of journal lines. */
export function sumCredits(lines: readonly JournalLine[]): string {
  return sumAmounts(lines.map((line) => line.credit));
}

/** Pure: whether a set of journal lines balances (`sum(debit) === sum(credit)`). */
export function isBalanced(lines: readonly JournalLine[]): boolean {
  return compareAmounts(sumDebits(lines), sumCredits(lines)) === 0;
}

/** Pure: net posted amount for one account across a set of journal entries, signed per its normal balance — the shared arithmetic behind Budget variance and every balance-bearing Financial Report. */
export function computeAccountNetAmount(entries: readonly JournalEntry[], accountId: AccountId, normalBalance: NormalBalance): string {
  const debitTotal = sumAmounts(
    entries.flatMap((entry) => entry.lines.filter((line) => line.accountId === accountId).map((line) => line.debit)),
  );
  const creditTotal = sumAmounts(
    entries.flatMap((entry) => entry.lines.filter((line) => line.accountId === accountId).map((line) => line.credit)),
  );
  return normalBalance === 'debit' ? subtractAmounts(debitTotal, creditTotal) : subtractAmounts(creditTotal, debitTotal);
}

/** Pure: the next occurrence date for a recurring frequency, one interval after `from`. */
export function computeNextOccurrence(from: ISODate, frequency: RecurringFrequency): ISODate {
  const monthsByFrequency: Record<RecurringFrequency, number> = { monthly: 1, quarterly: 3, annually: 12 };
  return addMonthsIso(from, monthsByFrequency[frequency]);
}

export interface CreateJournalEntryInput {
  readonly entryDate: ISODate;
  readonly memo?: string;
  readonly lines: readonly JournalLine[];
  readonly currency: CurrencyCode;
  readonly fiscalPeriodId?: FiscalPeriodId;
  readonly entryNumber?: string;
}

export interface CreateRecurringJournalTemplateInput {
  readonly memo?: string;
  readonly lines: readonly JournalLine[];
  readonly currency: CurrencyCode;
  readonly frequency: RecurringFrequency;
  readonly startDate: ISODate;
  readonly endDate?: ISODate;
}

export interface GeneralLedgerEngine {
  createJournalEntry(organizationId: OrganizationId, input: CreateJournalEntryInput): Promise<JournalEntry>;
  postJournalEntry(organizationId: OrganizationId, journalEntryId: JournalEntryId): Promise<JournalEntry>;
  /** Creates and posts a new journal entry with every line's debit/credit swapped, linked to the original. Only a `posted` entry may be reversed. */
  reverseJournalEntry(organizationId: OrganizationId, journalEntryId: JournalEntryId, entryDate: ISODate): Promise<JournalEntry>;
  getJournalEntry(organizationId: OrganizationId, journalEntryId: JournalEntryId): Promise<JournalEntry | null>;
  listJournalEntries(organizationId: OrganizationId): Promise<readonly JournalEntry[]>;

  createRecurringTemplate(organizationId: OrganizationId, input: CreateRecurringJournalTemplateInput): Promise<RecurringJournalTemplate>;
  /** Generates a new draft journal entry from the template if it is due (i.e. `asOf` is at or past the next occurrence and, if set, at or before `endDate`). `null` if not due. */
  generateFromTemplate(organizationId: OrganizationId, templateId: RecurringJournalTemplateId, asOf: ISODate): Promise<JournalEntry | null>;
  getRecurringTemplate(organizationId: OrganizationId, templateId: RecurringJournalTemplateId): Promise<RecurringJournalTemplate | null>;
  listRecurringTemplates(organizationId: OrganizationId): Promise<readonly RecurringJournalTemplate[]>;
}

/** Creates a real {@link GeneralLedgerEngine}. */
export function createGeneralLedgerEngine(
  repository: JournalEntryRepository,
  templateRepository: RecurringJournalTemplateRepository,
  eventBus?: FinanceEventBus,
  now: () => string = nowIso,
): GeneralLedgerEngine {
  async function requireEntry(organizationId: OrganizationId, journalEntryId: JournalEntryId): Promise<JournalEntry> {
    const entry = await repository.findById(organizationId, journalEntryId);
    if (!entry) throw new JournalEntryNotFoundError(journalEntryId);
    return entry;
  }

  async function requireTemplate(organizationId: OrganizationId, templateId: RecurringJournalTemplateId): Promise<RecurringJournalTemplate> {
    const template = await templateRepository.findById(organizationId, templateId);
    if (!template) throw new RecurringJournalTemplateNotFoundError(templateId);
    return template;
  }

  return {
    async createJournalEntry(organizationId, input) {
      if (!isBalanced(input.lines)) {
        throw new UnbalancedJournalEntryError(sumDebits(input.lines), sumCredits(input.lines));
      }
      const timestamp = now();
      const entry: JournalEntry = {
        id: generateId('journal-entry'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        entryNumber: input.entryNumber,
        entryDate: input.entryDate,
        memo: input.memo,
        lines: input.lines,
        currency: input.currency,
        status: 'draft',
        fiscalPeriodId: input.fiscalPeriodId,
      };
      await repository.save(entry);
      return entry;
    },

    async postJournalEntry(organizationId, journalEntryId) {
      const entry = await requireEntry(organizationId, journalEntryId);
      if (!canTransitionJournalEntry(entry.status, 'posted')) {
        throw new InvalidJournalEntryTransitionError(journalEntryId, entry.status, 'posted');
      }
      const updated: JournalEntry = { ...entry, status: 'posted', updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('journal.posted', { organizationId, journalEntryId });
      return updated;
    },

    async reverseJournalEntry(organizationId, journalEntryId, entryDate) {
      const entry = await requireEntry(organizationId, journalEntryId);
      if (!canTransitionJournalEntry(entry.status, 'reversed')) {
        throw new InvalidJournalEntryTransitionError(journalEntryId, entry.status, 'reversed');
      }
      const timestamp = now();
      const reversingLines: JournalLine[] = entry.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.credit,
        credit: line.debit,
        description: line.description,
      }));
      const reversingEntry: JournalEntry = {
        id: generateId('journal-entry'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        entryDate,
        memo: `Reversal of ${entry.entryNumber ?? entry.id}`,
        lines: reversingLines,
        currency: entry.currency,
        status: 'posted',
        fiscalPeriodId: entry.fiscalPeriodId,
        reversalOfEntryId: entry.id,
      };
      await repository.save(reversingEntry);
      const updatedOriginal: JournalEntry = { ...entry, status: 'reversed', reversedByEntryId: reversingEntry.id, updatedAt: timestamp };
      await repository.save(updatedOriginal);
      return reversingEntry;
    },

    async getJournalEntry(organizationId, journalEntryId) {
      return repository.findById(organizationId, journalEntryId);
    },

    async listJournalEntries(organizationId) {
      return repository.findAll(organizationId);
    },

    async createRecurringTemplate(organizationId, input) {
      const timestamp = now();
      const template: RecurringJournalTemplate = {
        id: generateId('recurring-journal-template'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        memo: input.memo,
        lines: input.lines,
        currency: input.currency,
        frequency: input.frequency,
        startDate: input.startDate,
        endDate: input.endDate,
        active: true,
      };
      await templateRepository.save(template);
      return template;
    },

    async generateFromTemplate(organizationId, templateId, asOf) {
      const template = await requireTemplate(organizationId, templateId);
      if (!template.active) return null;
      if (template.endDate && asOf > template.endDate) return null;

      const nextDue = template.lastGeneratedDate ? computeNextOccurrence(template.lastGeneratedDate, template.frequency) : template.startDate;
      if (asOf < nextDue) return null;

      const timestamp = now();
      const entry: JournalEntry = {
        id: generateId('journal-entry'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        entryDate: asOf,
        memo: template.memo,
        lines: template.lines,
        currency: template.currency,
        status: 'draft',
        recurringTemplateId: template.id,
      };
      await repository.save(entry);
      await templateRepository.save({ ...template, lastGeneratedDate: asOf, updatedAt: timestamp });
      return entry;
    },

    async getRecurringTemplate(organizationId, templateId) {
      return templateRepository.findById(organizationId, templateId);
    },

    async listRecurringTemplates(organizationId) {
      return templateRepository.findAll(organizationId);
    },
  };
}
