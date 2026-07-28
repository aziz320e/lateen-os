import { describe, expect, it } from 'vitest';
import { createFinanceEventBus, FINANCE_EVENT_NAMES } from '../src/events/index.js';

describe('FinanceEventBus', () => {
  it('publishes and delivers events by name', () => {
    const bus = createFinanceEventBus();
    let seen: unknown;
    bus.subscribe('account.created', (payload) => (seen = payload));
    bus.publish('account.created', { organizationId: 'org-1', accountId: 'a1', accountType: 'asset' });
    expect(seen).toEqual({ organizationId: 'org-1', accountId: 'a1', accountType: 'asset' });
  });

  it('subscribeAll() receives every event regardless of name', () => {
    const bus = createFinanceEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('journal.posted', { organizationId: 'org-1', journalEntryId: 'j1' });
    bus.publish('invoice.paid', { organizationId: 'org-1', invoiceId: 'i1' });
    expect(names).toEqual(['journal.posted', 'invoice.paid']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createFinanceEventBus();
    let count = 0;
    const unsubscribe = bus.subscribe('period.closed', () => (count += 1));
    bus.publish('period.closed', { organizationId: 'org-1', fiscalPeriodId: 'p1' });
    unsubscribe();
    bus.publish('period.closed', { organizationId: 'org-1', fiscalPeriodId: 'p1' });
    expect(count).toBe(1);
  });

  it('FINANCE_EVENT_NAMES exposes all 10 canonical event names', () => {
    expect(Object.values(FINANCE_EVENT_NAMES)).toEqual([
      'account.created',
      'journal.posted',
      'invoice.issued',
      'invoice.paid',
      'bill.created',
      'bill.paid',
      'budget.updated',
      'tax.calculated',
      'report.generated',
      'period.closed',
    ]);
  });
});
