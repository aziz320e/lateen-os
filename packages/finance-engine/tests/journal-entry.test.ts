import { describe, expect, it } from 'vitest';
import {
  canTransitionJournalEntry,
  computeAccountNetAmount,
  computeNextOccurrence,
  createGeneralLedgerEngine,
  isBalanced,
  sumCredits,
  sumDebits,
} from '../src/journal-entry/engine.impl.js';
import { createJournalEntryRepository, createRecurringJournalTemplateRepository } from '../src/journal-entry/repository.impl.js';
import type { JournalLine } from '../src/journal-entry/types.js';
import { createFinanceEventBus } from '../src/events/index.js';
import { InvalidJournalEntryTransitionError, JournalEntryNotFoundError, UnbalancedJournalEntryError } from '../src/shared/errors.js';

const ORG = 'org-1';
const CASH = 'account-cash';
const REVENUE = 'account-revenue';

function balancedLines(): readonly JournalLine[] {
  return [
    { accountId: CASH, debit: '100.00', credit: '0.00' },
    { accountId: REVENUE, debit: '0.00', credit: '100.00' },
  ];
}

function setup(eventBus = createFinanceEventBus()) {
  const repository = createJournalEntryRepository();
  const templateRepository = createRecurringJournalTemplateRepository();
  const engine = createGeneralLedgerEngine(repository, templateRepository, eventBus);
  return { repository, templateRepository, engine, eventBus };
}

describe('sumDebits / sumCredits / isBalanced (pure)', () => {
  it('sums debits and credits independently', () => {
    const lines = balancedLines();
    expect(sumDebits(lines)).toBe('100.00');
    expect(sumCredits(lines)).toBe('100.00');
  });

  it('isBalanced() is true when debits equal credits', () => {
    expect(isBalanced(balancedLines())).toBe(true);
  });

  it('isBalanced() is false when they differ', () => {
    const lines: JournalLine[] = [
      { accountId: CASH, debit: '100.00', credit: '0.00' },
      { accountId: REVENUE, debit: '0.00', credit: '90.00' },
    ];
    expect(isBalanced(lines)).toBe(false);
  });
});

describe('canTransitionJournalEntry (pure)', () => {
  it('allows draft -> posted', () => {
    expect(canTransitionJournalEntry('draft', 'posted')).toBe(true);
  });

  it('allows posted -> reversed', () => {
    expect(canTransitionJournalEntry('posted', 'reversed')).toBe(true);
  });

  it('rejects draft -> reversed directly', () => {
    expect(canTransitionJournalEntry('draft', 'reversed')).toBe(false);
  });

  it('rejects any transition out of reversed', () => {
    expect(canTransitionJournalEntry('reversed', 'draft')).toBe(false);
    expect(canTransitionJournalEntry('reversed', 'posted')).toBe(false);
  });
});

describe('computeNextOccurrence (pure)', () => {
  it('adds one month for monthly frequency', () => {
    expect(computeNextOccurrence('2026-01-15', 'monthly')).toBe('2026-02-15');
  });

  it('adds three months for quarterly frequency', () => {
    expect(computeNextOccurrence('2026-01-15', 'quarterly')).toBe('2026-04-15');
  });

  it('adds twelve months for annual frequency', () => {
    expect(computeNextOccurrence('2026-01-15', 'annually')).toBe('2027-01-15');
  });
});

describe('computeAccountNetAmount (pure)', () => {
  it('nets debit-normal accounts as debit - credit', () => {
    const entries = [{ id: 'j1', organizationId: ORG, createdAt: '', updatedAt: '', entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD', status: 'posted' as const }];
    expect(computeAccountNetAmount(entries, CASH, 'debit')).toBe('100.00');
  });

  it('nets credit-normal accounts as credit - debit', () => {
    const entries = [{ id: 'j1', organizationId: ORG, createdAt: '', updatedAt: '', entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD', status: 'posted' as const }];
    expect(computeAccountNetAmount(entries, REVENUE, 'credit')).toBe('100.00');
  });

  it('is 0 for an account with no matching lines', () => {
    const entries = [{ id: 'j1', organizationId: ORG, createdAt: '', updatedAt: '', entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD', status: 'posted' as const }];
    expect(computeAccountNetAmount(entries, 'unrelated-account', 'debit')).toBe('0.00');
  });
});

describe('GeneralLedgerEngine — createJournalEntry', () => {
  it('creates a draft, balanced entry', async () => {
    const { engine } = setup();
    const entry = await engine.createJournalEntry(ORG, { entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD' });
    expect(entry.status).toBe('draft');
    expect(entry.lines).toEqual(balancedLines());
  });

  it('rejects an unbalanced entry before it is ever persisted', async () => {
    const { engine, repository } = setup();
    const unbalanced: JournalLine[] = [
      { accountId: CASH, debit: '100.00', credit: '0.00' },
      { accountId: REVENUE, debit: '0.00', credit: '50.00' },
    ];
    await expect(engine.createJournalEntry(ORG, { entryDate: '2026-01-01', lines: unbalanced, currency: 'USD' })).rejects.toBeInstanceOf(UnbalancedJournalEntryError);
    expect(await repository.findAll(ORG)).toHaveLength(0);
  });
});

describe('GeneralLedgerEngine — postJournalEntry', () => {
  it('transitions draft -> posted and publishes journal.posted', async () => {
    const eventBus = createFinanceEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('journal.posted', (payload) => (seen = payload));
    const entry = await engine.createJournalEntry(ORG, { entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD' });
    const posted = await engine.postJournalEntry(ORG, entry.id);
    expect(posted.status).toBe('posted');
    expect(seen).toEqual({ organizationId: ORG, journalEntryId: entry.id });
  });

  it('rejects posting an already-posted entry', async () => {
    const { engine } = setup();
    const entry = await engine.createJournalEntry(ORG, { entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD' });
    await engine.postJournalEntry(ORG, entry.id);
    await expect(engine.postJournalEntry(ORG, entry.id)).rejects.toBeInstanceOf(InvalidJournalEntryTransitionError);
  });

  it('throws JournalEntryNotFoundError for an unknown entry', async () => {
    const { engine } = setup();
    await expect(engine.postJournalEntry(ORG, 'missing')).rejects.toBeInstanceOf(JournalEntryNotFoundError);
  });
});

describe('GeneralLedgerEngine — reverseJournalEntry', () => {
  it('creates a new, posted reversing entry with swapped debit/credit', async () => {
    const { engine } = setup();
    const entry = await engine.createJournalEntry(ORG, { entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD' });
    await engine.postJournalEntry(ORG, entry.id);
    const reversing = await engine.reverseJournalEntry(ORG, entry.id, '2026-01-02');
    expect(reversing.status).toBe('posted');
    expect(reversing.reversalOfEntryId).toBe(entry.id);
    expect(reversing.lines).toEqual([
      { accountId: CASH, debit: '0.00', credit: '100.00' },
      { accountId: REVENUE, debit: '100.00', credit: '0.00' },
    ]);
  });

  it('marks the original entry reversed and links reversedByEntryId', async () => {
    const { engine } = setup();
    const entry = await engine.createJournalEntry(ORG, { entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD' });
    await engine.postJournalEntry(ORG, entry.id);
    const reversing = await engine.reverseJournalEntry(ORG, entry.id, '2026-01-02');
    const original = await engine.getJournalEntry(ORG, entry.id);
    expect(original?.status).toBe('reversed');
    expect(original?.reversedByEntryId).toBe(reversing.id);
  });

  it('rejects reversing a draft entry', async () => {
    const { engine } = setup();
    const entry = await engine.createJournalEntry(ORG, { entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD' });
    await expect(engine.reverseJournalEntry(ORG, entry.id, '2026-01-02')).rejects.toBeInstanceOf(InvalidJournalEntryTransitionError);
  });

  it('rejects reversing an already-reversed entry', async () => {
    const { engine } = setup();
    const entry = await engine.createJournalEntry(ORG, { entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD' });
    await engine.postJournalEntry(ORG, entry.id);
    await engine.reverseJournalEntry(ORG, entry.id, '2026-01-02');
    await expect(engine.reverseJournalEntry(ORG, entry.id, '2026-01-03')).rejects.toBeInstanceOf(InvalidJournalEntryTransitionError);
  });
});

describe('GeneralLedgerEngine — recurring templates', () => {
  it('createRecurringTemplate() starts active with no lastGeneratedDate', async () => {
    const { engine } = setup();
    const template = await engine.createRecurringTemplate(ORG, {
      lines: balancedLines(),
      currency: 'USD',
      frequency: 'monthly',
      startDate: '2026-01-01',
    });
    expect(template.active).toBe(true);
    expect(template.lastGeneratedDate).toBeUndefined();
  });

  it('generateFromTemplate() creates a draft entry once due, and not before', async () => {
    const { engine } = setup();
    const template = await engine.createRecurringTemplate(ORG, {
      lines: balancedLines(),
      currency: 'USD',
      frequency: 'monthly',
      startDate: '2026-02-01',
    });
    expect(await engine.generateFromTemplate(ORG, template.id, '2026-01-15')).toBeNull();
    const generated = await engine.generateFromTemplate(ORG, template.id, '2026-02-01');
    expect(generated).not.toBeNull();
    expect(generated?.status).toBe('draft');
    expect(generated?.recurringTemplateId).toBe(template.id);
  });

  it('generateFromTemplate() advances lastGeneratedDate so the next call waits a full interval', async () => {
    const { engine } = setup();
    const template = await engine.createRecurringTemplate(ORG, {
      lines: balancedLines(),
      currency: 'USD',
      frequency: 'monthly',
      startDate: '2026-01-01',
    });
    await engine.generateFromTemplate(ORG, template.id, '2026-01-01');
    expect(await engine.generateFromTemplate(ORG, template.id, '2026-01-15')).toBeNull();
    expect(await engine.generateFromTemplate(ORG, template.id, '2026-02-01')).not.toBeNull();
  });

  it('generateFromTemplate() returns null once inactive', async () => {
    const { engine, templateRepository } = setup();
    const template = await engine.createRecurringTemplate(ORG, {
      lines: balancedLines(),
      currency: 'USD',
      frequency: 'monthly',
      startDate: '2026-01-01',
    });
    await templateRepository.save({ ...template, active: false });
    expect(await engine.generateFromTemplate(ORG, template.id, '2026-01-01')).toBeNull();
  });

  it('generateFromTemplate() returns null past endDate', async () => {
    const { engine } = setup();
    const template = await engine.createRecurringTemplate(ORG, {
      lines: balancedLines(),
      currency: 'USD',
      frequency: 'monthly',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(await engine.generateFromTemplate(ORG, template.id, '2026-02-01')).toBeNull();
  });
});

describe('GeneralLedgerEngine — get/list/org scoping', () => {
  it('getJournalEntry() returns null for an unknown entry', async () => {
    const { engine } = setup();
    expect(await engine.getJournalEntry(ORG, 'missing')).toBeNull();
  });

  it('listJournalEntries() is organization-scoped', async () => {
    const { engine } = setup();
    await engine.createJournalEntry(ORG, { entryDate: '2026-01-01', lines: balancedLines(), currency: 'USD' });
    expect(await engine.listJournalEntries(ORG)).toHaveLength(1);
    expect(await engine.listJournalEntries('org-2')).toHaveLength(0);
  });

  it('getRecurringTemplate() returns null for an unknown template', async () => {
    const { engine } = setup();
    expect(await engine.getRecurringTemplate(ORG, 'missing')).toBeNull();
  });

  it('listRecurringTemplates() is organization-scoped', async () => {
    const { engine } = setup();
    await engine.createRecurringTemplate(ORG, { lines: balancedLines(), currency: 'USD', frequency: 'monthly', startDate: '2026-01-01' });
    expect(await engine.listRecurringTemplates(ORG)).toHaveLength(1);
    expect(await engine.listRecurringTemplates('org-2')).toHaveLength(0);
  });
});

describe('sumDebits / sumCredits — empty lines', () => {
  it('are 0.00 for an empty line set', () => {
    expect(sumDebits([])).toBe('0.00');
    expect(sumCredits([])).toBe('0.00');
  });
});
