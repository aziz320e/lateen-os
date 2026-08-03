import { describe, expect, it } from 'vitest';
import { createKeyMutex } from '@lateen-os/shared-kernel/concurrency';
import {
  agingBucketForDaysOverdue,
  canTransitionARInvoice,
  canTransitionCreditNote,
  computeInvoiceTotals,
  createAccountsReceivableEngine,
} from '../src/accounts-receivable/engine.impl.js';
import {
  createARCustomerRepository,
  createARInvoiceRepository,
  createARPaymentRepository,
  createCreditNoteRepository,
} from '../src/accounts-receivable/repository.impl.js';
import { createFinanceEventBus } from '../src/events/index.js';
import {
  ARCustomerNotFoundError,
  ARInvoiceNotFoundError,
  InvalidARInvoiceTransitionError,
  PaymentExceedsBalanceError,
} from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createFinanceEventBus()) {
  const customerRepository = createARCustomerRepository();
  const invoiceRepository = createARInvoiceRepository();
  const creditNoteRepository = createCreditNoteRepository();
  const paymentRepository = createARPaymentRepository();
  const engine = createAccountsReceivableEngine(
    customerRepository,
    invoiceRepository,
    creditNoteRepository,
    paymentRepository,
    eventBus,
  );
  return {
    customerRepository,
    invoiceRepository,
    creditNoteRepository,
    paymentRepository,
    engine,
    eventBus,
  };
}

async function seedCustomerAndInvoice(engine: ReturnType<typeof setup>['engine']) {
  const customer = await engine.createCustomer(ORG, {
    displayName: 'Acme',
    currency: 'USD',
    paymentTermsDays: 15,
  });
  const invoice = await engine.createInvoice(ORG, {
    customerId: customer.id,
    currency: 'USD',
    lines: [{ description: 'Widgets', quantity: '10', unitPrice: '20.00', taxRatePct: '10' }],
  });
  return { customer, invoice };
}

describe('computeInvoiceTotals (pure)', () => {
  it('computes line amounts, subtotal, tax, and total', () => {
    const { lines, totals } = computeInvoiceTotals([
      { description: 'Widgets', quantity: '2', unitPrice: '50.00', taxRatePct: '10' },
    ]);
    expect(lines[0]?.amount).toBe('100.00');
    expect(totals.subtotal).toBe('100.00');
    expect(totals.taxTotal).toBe('10.00');
    expect(totals.total).toBe('110.00');
  });

  it('defaults tax to 0 when omitted', () => {
    const { totals } = computeInvoiceTotals([
      { description: 'Widgets', quantity: '1', unitPrice: '50.00' },
    ]);
    expect(totals.taxTotal).toBe('0.00');
    expect(totals.total).toBe('50.00');
  });

  it('sums multiple lines', () => {
    const { totals } = computeInvoiceTotals([
      { description: 'A', quantity: '1', unitPrice: '50.00' },
      { description: 'B', quantity: '2', unitPrice: '25.00' },
    ]);
    expect(totals.subtotal).toBe('100.00');
  });
});

describe('agingBucketForDaysOverdue (pure)', () => {
  it('buckets correctly at boundaries', () => {
    expect(agingBucketForDaysOverdue(0)).toBe('current');
    expect(agingBucketForDaysOverdue(-5)).toBe('current');
    expect(agingBucketForDaysOverdue(1)).toBe('days_1_30');
    expect(agingBucketForDaysOverdue(30)).toBe('days_1_30');
    expect(agingBucketForDaysOverdue(31)).toBe('days_31_60');
    expect(agingBucketForDaysOverdue(60)).toBe('days_31_60');
    expect(agingBucketForDaysOverdue(61)).toBe('days_61_90');
    expect(agingBucketForDaysOverdue(90)).toBe('days_61_90');
    expect(agingBucketForDaysOverdue(91)).toBe('days_90_plus');
  });
});

describe('canTransitionARInvoice / canTransitionCreditNote (pure)', () => {
  it('AR invoice lifecycle transitions', () => {
    expect(canTransitionARInvoice('draft', 'issued')).toBe(true);
    expect(canTransitionARInvoice('draft', 'cancelled')).toBe(true);
    expect(canTransitionARInvoice('issued', 'partially_paid')).toBe(true);
    expect(canTransitionARInvoice('issued', 'paid')).toBe(true);
    expect(canTransitionARInvoice('partially_paid', 'paid')).toBe(true);
    expect(canTransitionARInvoice('partially_paid', 'cancelled')).toBe(false);
    expect(canTransitionARInvoice('paid', 'cancelled')).toBe(false);
    expect(canTransitionARInvoice('cancelled', 'issued')).toBe(false);
  });

  it('credit note lifecycle transitions', () => {
    expect(canTransitionCreditNote('draft', 'issued')).toBe(true);
    expect(canTransitionCreditNote('issued', 'applied')).toBe(true);
    expect(canTransitionCreditNote('applied', 'cancelled')).toBe(false);
  });
});

describe('AccountsReceivableEngine — customers', () => {
  it('createCustomer() defaults paymentTermsDays to 30', async () => {
    const { engine } = setup();
    const customer = await engine.createCustomer(ORG, { displayName: 'Acme', currency: 'USD' });
    expect(customer.paymentTermsDays).toBe(30);
  });

  it('getCustomer()/listCustomers() round-trip', async () => {
    const { engine } = setup();
    const customer = await engine.createCustomer(ORG, { displayName: 'Acme', currency: 'USD' });
    expect(await engine.getCustomer(ORG, customer.id)).toEqual(customer);
    expect(await engine.listCustomers(ORG)).toHaveLength(1);
  });
});

describe('AccountsReceivableEngine — invoice lifecycle', () => {
  it('createInvoice() starts draft with balanceDue == total', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    expect(invoice.status).toBe('draft');
    expect(invoice.balanceDue).toBe(invoice.total);
    expect(invoice.amountPaid).toBe('0.00');
  });

  it('createInvoice() throws for an unknown customer', async () => {
    const { engine } = setup();
    await expect(
      engine.createInvoice(ORG, {
        customerId: 'missing',
        currency: 'USD',
        lines: [{ description: 'x', quantity: '1', unitPrice: '1.00' }],
      }),
    ).rejects.toBeInstanceOf(ARCustomerNotFoundError);
  });

  it('issueInvoice() stamps dueDate from customer paymentTermsDays and publishes invoice.issued', async () => {
    const eventBus = createFinanceEventBus();
    const { engine } = setup(eventBus);
    const { invoice, customer } = await seedCustomerAndInvoice(engine);
    let seen: unknown;
    eventBus.subscribe('invoice.issued', (payload) => (seen = payload));
    const issued = await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    expect(issued.status).toBe('issued');
    expect(issued.dueDate).toBe('2026-01-16');
    expect(seen).toEqual({ organizationId: ORG, invoiceId: invoice.id, customerId: customer.id });
  });

  it('rejects issuing an already-issued invoice', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    await expect(engine.issueInvoice(ORG, invoice.id, '2026-01-02')).rejects.toBeInstanceOf(
      InvalidARInvoiceTransitionError,
    );
  });

  it('cancelInvoice() cancels a draft invoice', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    const cancelled = await engine.cancelInvoice(ORG, invoice.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('rejects cancelling a partially-paid invoice', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    await engine.recordPayment(ORG, invoice.id, { amount: '10.00' });
    await expect(engine.cancelInvoice(ORG, invoice.id)).rejects.toBeInstanceOf(
      InvalidARInvoiceTransitionError,
    );
  });
});

describe('AccountsReceivableEngine — payments', () => {
  it('recordPayment() partially pays and sets partially_paid', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    const payment = await engine.recordPayment(ORG, invoice.id, { amount: '50.00' });
    expect(payment.amount).toBe('50.00');
    const updated = await engine.getInvoice(ORG, invoice.id);
    expect(updated?.status).toBe('partially_paid');
    expect(updated?.amountPaid).toBe('50.00');
    expect(updated?.balanceDue).toBe('170.00');
  });

  it('recordPayment() fully pays and publishes invoice.paid', async () => {
    const eventBus = createFinanceEventBus();
    const { engine } = setup(eventBus);
    const { invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    let seen: unknown;
    eventBus.subscribe('invoice.paid', (payload) => (seen = payload));
    await engine.recordPayment(ORG, invoice.id, { amount: invoice.total });
    const updated = await engine.getInvoice(ORG, invoice.id);
    expect(updated?.status).toBe('paid');
    expect(updated?.balanceDue).toBe('0.00');
    expect(seen).toEqual({ organizationId: ORG, invoiceId: invoice.id });
  });

  it('rejects a payment exceeding the balance due', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    await expect(
      engine.recordPayment(ORG, invoice.id, { amount: '999.00' }),
    ).rejects.toBeInstanceOf(PaymentExceedsBalanceError);
  });

  it('rejects recording a payment on a draft invoice', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    await expect(engine.recordPayment(ORG, invoice.id, { amount: '10.00' })).rejects.toBeInstanceOf(
      InvalidARInvoiceTransitionError,
    );
  });

  it('supports multiple partial payments accumulating to paid', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    await engine.recordPayment(ORG, invoice.id, { amount: '100.00' });
    await engine.recordPayment(ORG, invoice.id, { amount: '120.00' });
    const updated = await engine.getInvoice(ORG, invoice.id);
    expect(updated?.status).toBe('paid');
    expect(updated?.amountPaid).toBe(invoice.total);
  });
});

describe('AccountsReceivableEngine — credit notes', () => {
  it('createCreditNote() starts draft', async () => {
    const { engine } = setup();
    const { customer } = await seedCustomerAndInvoice(engine);
    const note = await engine.createCreditNote(ORG, {
      customerId: customer.id,
      amount: '25.00',
      currency: 'USD',
    });
    expect(note.status).toBe('draft');
  });

  it('issueCreditNote() moves draft -> issued', async () => {
    const { engine } = setup();
    const { customer } = await seedCustomerAndInvoice(engine);
    const note = await engine.createCreditNote(ORG, {
      customerId: customer.id,
      amount: '25.00',
      currency: 'USD',
    });
    const issued = await engine.issueCreditNote(ORG, note.id);
    expect(issued.status).toBe('issued');
  });

  it('applyCreditNoteToInvoice() reduces the invoice balance and marks the note applied', async () => {
    const { engine } = setup();
    const { customer, invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    const note = await engine.createCreditNote(ORG, {
      customerId: customer.id,
      amount: '20.00',
      currency: 'USD',
    });
    await engine.issueCreditNote(ORG, note.id);
    const applied = await engine.applyCreditNoteToInvoice(ORG, note.id, invoice.id);
    expect(applied.status).toBe('applied');
    const updated = await engine.getInvoice(ORG, invoice.id);
    expect(updated?.amountPaid).toBe('20.00');
  });

  it('rejects applying a draft (not-yet-issued) credit note', async () => {
    const { engine } = setup();
    const { customer, invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    const note = await engine.createCreditNote(ORG, {
      customerId: customer.id,
      amount: '20.00',
      currency: 'USD',
    });
    await expect(engine.applyCreditNoteToInvoice(ORG, note.id, invoice.id)).rejects.toThrow();
  });
});

describe('AccountsReceivableEngine — listing and org scoping', () => {
  it('listInvoices() and findByCustomer() round-trip', async () => {
    const { engine } = setup();
    const { customer } = await seedCustomerAndInvoice(engine);
    await seedCustomerAndInvoice(engine);
    expect(await engine.listInvoices(ORG)).toHaveLength(2);
    expect(await engine.findByCustomer(ORG, customer.id)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, invoiceRepository } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    expect(await invoiceRepository.findById('org-2', invoice.id)).toBeNull();
    expect(await engine.listInvoices('org-2')).toHaveLength(0);
  });

  it('getInvoice() returns null for an unknown invoice', async () => {
    const { engine } = setup();
    expect(await engine.getInvoice(ORG, 'missing')).toBeNull();
  });

  it('throws ARInvoiceNotFoundError for an unknown invoice on issueInvoice()', async () => {
    const { engine } = setup();
    await expect(engine.issueInvoice(ORG, 'missing', '2026-01-01')).rejects.toBeInstanceOf(
      ARInvoiceNotFoundError,
    );
  });
});

describe('AccountsReceivableEngine — balances and aging', () => {
  it('getCustomerBalance() sums outstanding invoices only', async () => {
    const { engine } = setup();
    const { customer, invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    const balance = await engine.getCustomerBalance(ORG, customer.id);
    expect(balance).toBe(invoice.total);
  });

  it('computeAging() buckets an overdue invoice correctly', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    const issued = await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    const aging = await engine.computeAging(ORG, '2026-03-01');
    expect(issued.dueDate).toBe('2026-01-16');
    expect(aging.buckets.days_31_60).toBe(invoice.total);
    expect(aging.total).toBe(invoice.total);
  });

  it('computeAging() excludes paid and cancelled invoices', async () => {
    const { engine } = setup();
    const { invoice } = await seedCustomerAndInvoice(engine);
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');
    await engine.recordPayment(ORG, invoice.id, { amount: invoice.total });
    const aging = await engine.computeAging(ORG, '2026-06-01');
    expect(aging.total).toBe('0.00');
  });
});

describe('AccountsReceivableEngine — concurrency (concurrency finding regression)', () => {
  it('proves the hazard is real: an unprotected read-await-compute-write sequence loses one of two concurrent updates', async () => {
    // Standalone reproduction of the exact *pattern* recordPayment used
    // before this fix (not the real engine, which is now protected) —
    // proves the interleaving this fix closes is a genuine, deterministic
    // hazard for this code shape, not a hypothetical one. A real `await`
    // sits between the read and the write, exactly like
    // `requireInvoice()` did before `applyToInvoice`.
    let stored = { balance: 100 };
    async function unprotectedApplyPayment(amount: number) {
      const current = await Promise.resolve(stored); // the "read" — a real await gap
      const updated = { balance: current.balance - amount };
      stored = updated; // the "write" — no lock, no version check
      return updated;
    }
    await Promise.all([unprotectedApplyPayment(50), unprotectedApplyPayment(50)]);
    // Both reads observe the same starting balance=100 before either
    // write lands: both compute 50, and the second write silently
    // discards the first's effect. This is the lost update.
    expect(stored.balance).toBe(50); // wrong — a correct sequential result would be 0.
  });

  it('recordPayment resists that same interleaving: two concurrent $50 payments on a $100 invoice correctly leave it fully paid', async () => {
    const { engine } = setup();
    const customer = await engine.createCustomer(ORG, { displayName: 'Acme', currency: 'USD' });
    const invoice = await engine.createInvoice(ORG, {
      customerId: customer.id,
      currency: 'USD',
      lines: [{ description: 'Service', quantity: '1', unitPrice: '100.00', taxRatePct: '0' }],
    });
    await engine.issueInvoice(ORG, invoice.id, '2026-01-01');

    // Launched together via Promise.all so both calls' internal
    // read-compute-write sequences genuinely interleave in the event
    // loop, exactly like the standalone reproduction above — this is
    // deterministic (no real timers or I/O anywhere in this engine),
    // not a flaky timing-based test.
    const [first, second] = await Promise.all([
      engine.recordPayment(ORG, invoice.id, { amount: '50.00' }),
      engine.recordPayment(ORG, invoice.id, { amount: '50.00' }),
    ]);
    expect(first.amount).toBe('50.00');
    expect(second.amount).toBe('50.00');

    // Both $50 payment records exist (the audit trail was always
    // correct — payments are independent inserts, never overwritten).
    // What the fix protects is the invoice's own running balance:
    const updated = await engine.getInvoice(ORG, invoice.id);
    expect(updated?.amountPaid).toBe('100.00');
    expect(updated?.balanceDue).toBe('0.00');
    expect(updated?.status).toBe('paid');
  });

  it('the underlying KeyMutex primitive itself serializes same-key calls and never blocks different keys', async () => {
    const mutex = createKeyMutex();
    const order: string[] = [];
    const record = async (label: string) => {
      order.push(`${label}-start`);
      await Promise.resolve();
      order.push(`${label}-end`);
    };
    await Promise.all([
      mutex.runExclusive('invoice-1', () => record('A')),
      mutex.runExclusive('invoice-1', () => record('B')),
      mutex.runExclusive('invoice-2', () => record('C')),
    ]);
    // A and B share a key: B must not start until A has fully finished.
    const aEnd = order.indexOf('A-end');
    const bStart = order.indexOf('B-start');
    expect(bStart).toBeGreaterThan(aEnd);
    // C uses a different key and is never made to wait for A/B.
    expect(order.indexOf('C-start')).toBeLessThan(aEnd);
  });
});
