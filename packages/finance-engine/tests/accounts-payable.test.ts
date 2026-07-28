import { describe, expect, it } from 'vitest';
import { agingBucketForDaysOverdue, canTransitionBill, canTransitionVendorCredit, computeBillTotals, createAccountsPayableEngine } from '../src/accounts-payable/engine.impl.js';
import {
  createAPPaymentRepository,
  createBillRepository,
  createVendorCreditRepository,
  createVendorRepository,
} from '../src/accounts-payable/repository.impl.js';
import { createFinanceEventBus } from '../src/events/index.js';
import { BillNotFoundError, InvalidBillTransitionError, PaymentExceedsBalanceError, VendorNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createFinanceEventBus()) {
  const vendorRepository = createVendorRepository();
  const billRepository = createBillRepository();
  const vendorCreditRepository = createVendorCreditRepository();
  const paymentRepository = createAPPaymentRepository();
  const engine = createAccountsPayableEngine(vendorRepository, billRepository, vendorCreditRepository, paymentRepository, eventBus);
  return { vendorRepository, billRepository, vendorCreditRepository, paymentRepository, engine, eventBus };
}

async function seedVendorAndBill(engine: ReturnType<typeof setup>['engine']) {
  const vendor = await engine.createVendor(ORG, { displayName: 'Supplier Co', currency: 'USD', paymentTermsDays: 20 });
  const bill = await engine.createBill(ORG, {
    vendorId: vendor.id,
    currency: 'USD',
    lines: [{ description: 'Raw materials', quantity: '5', unitPrice: '40.00', taxRatePct: '5' }],
  });
  return { vendor, bill };
}

describe('computeBillTotals (pure)', () => {
  it('computes line amounts, subtotal, tax, and total', () => {
    const { lines, totals } = computeBillTotals([{ description: 'Materials', quantity: '4', unitPrice: '25.00', taxRatePct: '5' }]);
    expect(lines[0]?.amount).toBe('100.00');
    expect(totals.subtotal).toBe('100.00');
    expect(totals.taxTotal).toBe('5.00');
    expect(totals.total).toBe('105.00');
  });
});

describe('agingBucketForDaysOverdue (pure)', () => {
  it('buckets correctly', () => {
    expect(agingBucketForDaysOverdue(0)).toBe('current');
    expect(agingBucketForDaysOverdue(15)).toBe('days_1_30');
    expect(agingBucketForDaysOverdue(45)).toBe('days_31_60');
    expect(agingBucketForDaysOverdue(75)).toBe('days_61_90');
    expect(agingBucketForDaysOverdue(120)).toBe('days_90_plus');
  });
});

describe('canTransitionBill / canTransitionVendorCredit (pure)', () => {
  it('bill lifecycle transitions', () => {
    expect(canTransitionBill('draft', 'received')).toBe(true);
    expect(canTransitionBill('received', 'partially_paid')).toBe(true);
    expect(canTransitionBill('received', 'paid')).toBe(true);
    expect(canTransitionBill('partially_paid', 'paid')).toBe(true);
    expect(canTransitionBill('paid', 'cancelled')).toBe(false);
    expect(canTransitionBill('cancelled', 'received')).toBe(false);
  });

  it('vendor credit lifecycle transitions', () => {
    expect(canTransitionVendorCredit('draft', 'issued')).toBe(true);
    expect(canTransitionVendorCredit('issued', 'applied')).toBe(true);
    expect(canTransitionVendorCredit('applied', 'cancelled')).toBe(false);
  });
});

describe('AccountsPayableEngine — vendors', () => {
  it('createVendor() defaults paymentTermsDays to 30', async () => {
    const { engine } = setup();
    const vendor = await engine.createVendor(ORG, { displayName: 'Supplier', currency: 'USD' });
    expect(vendor.paymentTermsDays).toBe(30);
  });

  it('getVendor()/listVendors() round-trip', async () => {
    const { engine } = setup();
    const vendor = await engine.createVendor(ORG, { displayName: 'Supplier', currency: 'USD' });
    expect(await engine.getVendor(ORG, vendor.id)).toEqual(vendor);
    expect(await engine.listVendors(ORG)).toHaveLength(1);
  });
});

describe('AccountsPayableEngine — bill lifecycle', () => {
  it('createBill() starts draft with balanceDue == total and publishes bill.created', async () => {
    const eventBus = createFinanceEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('bill.created', (payload) => (seen = payload));
    const { vendor, bill } = await seedVendorAndBill(engine);
    expect(bill.status).toBe('draft');
    expect(bill.balanceDue).toBe(bill.total);
    expect(seen).toEqual({ organizationId: ORG, billId: bill.id, vendorId: vendor.id });
  });

  it('createBill() throws for an unknown vendor', async () => {
    const { engine } = setup();
    await expect(
      engine.createBill(ORG, { vendorId: 'missing', currency: 'USD', lines: [{ description: 'x', quantity: '1', unitPrice: '1.00' }] }),
    ).rejects.toBeInstanceOf(VendorNotFoundError);
  });

  it('receiveBill() stamps dueDate from vendor paymentTermsDays', async () => {
    const { engine } = setup();
    const { bill } = await seedVendorAndBill(engine);
    const received = await engine.receiveBill(ORG, bill.id, '2026-01-01');
    expect(received.status).toBe('received');
    expect(received.dueDate).toBe('2026-01-21');
  });

  it('rejects receiving an already-received bill', async () => {
    const { engine } = setup();
    const { bill } = await seedVendorAndBill(engine);
    await engine.receiveBill(ORG, bill.id, '2026-01-01');
    await expect(engine.receiveBill(ORG, bill.id, '2026-01-02')).rejects.toBeInstanceOf(InvalidBillTransitionError);
  });

  it('cancelBill() cancels a draft bill', async () => {
    const { engine } = setup();
    const { bill } = await seedVendorAndBill(engine);
    const cancelled = await engine.cancelBill(ORG, bill.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('throws BillNotFoundError for an unknown bill', async () => {
    const { engine } = setup();
    await expect(engine.receiveBill(ORG, 'missing', '2026-01-01')).rejects.toBeInstanceOf(BillNotFoundError);
  });
});

describe('AccountsPayableEngine — payments', () => {
  it('recordPayment() partially pays and sets partially_paid', async () => {
    const { engine } = setup();
    const { bill } = await seedVendorAndBill(engine);
    await engine.receiveBill(ORG, bill.id, '2026-01-01');
    await engine.recordPayment(ORG, bill.id, { amount: '50.00' });
    const updated = await engine.getBill(ORG, bill.id);
    expect(updated?.status).toBe('partially_paid');
    expect(updated?.amountPaid).toBe('50.00');
  });

  it('recordPayment() fully pays and publishes bill.paid', async () => {
    const eventBus = createFinanceEventBus();
    const { engine } = setup(eventBus);
    const { bill } = await seedVendorAndBill(engine);
    await engine.receiveBill(ORG, bill.id, '2026-01-01');
    let seen: unknown;
    eventBus.subscribe('bill.paid', (payload) => (seen = payload));
    await engine.recordPayment(ORG, bill.id, { amount: bill.total });
    const updated = await engine.getBill(ORG, bill.id);
    expect(updated?.status).toBe('paid');
    expect(seen).toEqual({ organizationId: ORG, billId: bill.id });
  });

  it('rejects a payment exceeding the balance due', async () => {
    const { engine } = setup();
    const { bill } = await seedVendorAndBill(engine);
    await engine.receiveBill(ORG, bill.id, '2026-01-01');
    await expect(engine.recordPayment(ORG, bill.id, { amount: '9999.00' })).rejects.toBeInstanceOf(PaymentExceedsBalanceError);
  });

  it('rejects recording a payment on a draft bill', async () => {
    const { engine } = setup();
    const { bill } = await seedVendorAndBill(engine);
    await expect(engine.recordPayment(ORG, bill.id, { amount: '10.00' })).rejects.toBeInstanceOf(InvalidBillTransitionError);
  });
});

describe('AccountsPayableEngine — vendor credits', () => {
  it('createVendorCredit() starts draft', async () => {
    const { engine } = setup();
    const { vendor } = await seedVendorAndBill(engine);
    const credit = await engine.createVendorCredit(ORG, { vendorId: vendor.id, amount: '15.00', currency: 'USD' });
    expect(credit.status).toBe('draft');
  });

  it('applyVendorCreditToBill() reduces the bill balance', async () => {
    const { engine } = setup();
    const { vendor, bill } = await seedVendorAndBill(engine);
    await engine.receiveBill(ORG, bill.id, '2026-01-01');
    const credit = await engine.createVendorCredit(ORG, { vendorId: vendor.id, amount: '10.00', currency: 'USD' });
    await engine.issueVendorCredit(ORG, credit.id);
    const applied = await engine.applyVendorCreditToBill(ORG, credit.id, bill.id);
    expect(applied.status).toBe('applied');
    const updated = await engine.getBill(ORG, bill.id);
    expect(updated?.amountPaid).toBe('10.00');
  });
});

describe('AccountsPayableEngine — listing and org scoping', () => {
  it('listBills() and findByVendor() round-trip', async () => {
    const { engine } = setup();
    const { vendor } = await seedVendorAndBill(engine);
    await seedVendorAndBill(engine);
    expect(await engine.listBills(ORG)).toHaveLength(2);
    expect(await engine.findByVendor(ORG, vendor.id)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, billRepository } = setup();
    const { bill } = await seedVendorAndBill(engine);
    expect(await billRepository.findById('org-2', bill.id)).toBeNull();
    expect(await engine.listBills('org-2')).toHaveLength(0);
  });

  it('getBill() returns null for an unknown bill', async () => {
    const { engine } = setup();
    expect(await engine.getBill(ORG, 'missing')).toBeNull();
  });

  it('getVendor() returns null for an unknown vendor', async () => {
    const { engine } = setup();
    expect(await engine.getVendor(ORG, 'missing')).toBeNull();
  });
});

describe('AccountsPayableEngine — balances and aging', () => {
  it('getVendorBalance() sums outstanding bills only', async () => {
    const { engine } = setup();
    const { vendor, bill } = await seedVendorAndBill(engine);
    await engine.receiveBill(ORG, bill.id, '2026-01-01');
    expect(await engine.getVendorBalance(ORG, vendor.id)).toBe(bill.total);
  });

  it('computeAging() buckets an overdue bill correctly', async () => {
    const { engine } = setup();
    const { bill } = await seedVendorAndBill(engine);
    await engine.receiveBill(ORG, bill.id, '2026-01-01');
    const aging = await engine.computeAging(ORG, '2026-02-15');
    expect(aging.buckets.days_1_30).toBe(bill.total);
  });

  it('computeAging() excludes paid bills', async () => {
    const { engine } = setup();
    const { bill } = await seedVendorAndBill(engine);
    await engine.receiveBill(ORG, bill.id, '2026-01-01');
    await engine.recordPayment(ORG, bill.id, { amount: bill.total });
    const aging = await engine.computeAging(ORG, '2026-06-01');
    expect(aging.total).toBe('0.00');
  });
});
