/**
 * Real Accounts Payable engine — vendors, bills with due dates and a
 * guarded lifecycle, vendor credits, payments, and deterministic
 * aging/balance computation. Mirrors Accounts Receivable's shape (the
 * same debit-side arithmetic, applied to the payable side of the ledger).
 *
 * @module accounts-payable/engine.impl
 */
import { addDaysIso, daysBetweenIso } from '../shared/date.js';
import { addAmounts, compareAmounts, parseDecimal, subtractAmounts, sumAmounts, toMoney } from '../shared/decimal.js';
import type { FinanceEventBus } from '../events/finance-event-bus.js';
import {
  BillNotFoundError,
  InvalidBillTransitionError,
  InvalidVendorCreditTransitionError,
  PaymentExceedsBalanceError,
  VendorCreditNotFoundError,
  VendorNotFoundError,
} from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { BillId, OrganizationId, SupplierId, VendorCreditId, VendorId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate, ISODateTime } from '../shared/primitives.js';
import type { APPaymentRepository, BillRepository, VendorCreditRepository, VendorRepository } from './repository.js';
import type {
  AgingBucketAmounts,
  AgingReport,
  APPayment,
  Bill,
  BillLine,
  BillLineInput,
  BillStatus,
  BillTotals,
  Vendor,
  VendorCredit,
  VendorCreditStatus,
} from './types.js';

const BILL_TRANSITIONS: Readonly<Record<BillStatus, readonly BillStatus[]>> = {
  draft: ['received', 'cancelled'],
  received: ['partially_paid', 'paid', 'cancelled'],
  partially_paid: ['paid'],
  paid: [],
  cancelled: [],
};

/** Whether a bill may transition from one status to another. */
export function canTransitionBill(from: BillStatus, to: BillStatus): boolean {
  return BILL_TRANSITIONS[from].includes(to);
}

const VENDOR_CREDIT_TRANSITIONS: Readonly<Record<VendorCreditStatus, readonly VendorCreditStatus[]>> = {
  draft: ['issued', 'cancelled'],
  issued: ['applied', 'cancelled'],
  applied: [],
  cancelled: [],
};

/** Whether a vendor credit may transition from one status to another. */
export function canTransitionVendorCredit(from: VendorCreditStatus, to: VendorCreditStatus): boolean {
  return VENDOR_CREDIT_TRANSITIONS[from].includes(to);
}

/** Pure: computes each line's amount (`quantity * unitPrice`) and the bill's subtotal/tax/total. */
export function computeBillTotals(lines: readonly BillLineInput[]): { lines: readonly BillLine[]; totals: BillTotals } {
  const computedLines: BillLine[] = lines.map((line) => ({
    ...line,
    amount: toMoney(parseDecimal(line.quantity) * parseDecimal(line.unitPrice)),
  }));
  const subtotal = sumAmounts(computedLines.map((line) => line.amount));
  const taxTotal = sumAmounts(computedLines.map((line) => toMoney(parseDecimal(line.amount) * (parseDecimal(line.taxRatePct) / 100))));
  const total = addAmounts(subtotal, taxTotal);
  return { lines: computedLines, totals: { subtotal, taxTotal, total } };
}

const EMPTY_BUCKETS: AgingBucketAmounts = { current: '0.00', days_1_30: '0.00', days_31_60: '0.00', days_61_90: '0.00', days_90_plus: '0.00' };

/** Pure: which aging bucket a balance falls into, given how many days past due it is. */
export function agingBucketForDaysOverdue(daysOverdue: number): keyof AgingBucketAmounts {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return 'days_1_30';
  if (daysOverdue <= 60) return 'days_31_60';
  if (daysOverdue <= 90) return 'days_61_90';
  return 'days_90_plus';
}

export interface CreateVendorInput {
  readonly displayName: string;
  readonly externalSupplierId?: SupplierId;
  readonly paymentTermsDays?: number;
  readonly currency: CurrencyCode;
}

export interface CreateBillInput {
  readonly vendorId: VendorId;
  readonly lines: readonly BillLineInput[];
  readonly currency: CurrencyCode;
  readonly billNumber?: string;
}

export interface RecordAPPaymentInput {
  readonly amount: string;
  readonly paidAt?: ISODateTime;
  readonly method?: string;
}

export interface CreateVendorCreditInput {
  readonly vendorId: VendorId;
  readonly billId?: BillId;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly reason?: string;
}

export interface AccountsPayableEngine {
  createVendor(organizationId: OrganizationId, input: CreateVendorInput): Promise<Vendor>;
  getVendor(organizationId: OrganizationId, vendorId: VendorId): Promise<Vendor | null>;
  listVendors(organizationId: OrganizationId): Promise<readonly Vendor[]>;

  createBill(organizationId: OrganizationId, input: CreateBillInput): Promise<Bill>;
  receiveBill(organizationId: OrganizationId, billId: BillId, billDate: ISODate): Promise<Bill>;
  recordPayment(organizationId: OrganizationId, billId: BillId, input: RecordAPPaymentInput): Promise<APPayment>;
  cancelBill(organizationId: OrganizationId, billId: BillId): Promise<Bill>;
  getBill(organizationId: OrganizationId, billId: BillId): Promise<Bill | null>;
  listBills(organizationId: OrganizationId): Promise<readonly Bill[]>;
  findByVendor(organizationId: OrganizationId, vendorId: VendorId): Promise<readonly Bill[]>;

  createVendorCredit(organizationId: OrganizationId, input: CreateVendorCreditInput): Promise<VendorCredit>;
  issueVendorCredit(organizationId: OrganizationId, vendorCreditId: VendorCreditId): Promise<VendorCredit>;
  applyVendorCreditToBill(organizationId: OrganizationId, vendorCreditId: VendorCreditId, billId: BillId): Promise<VendorCredit>;

  /** Outstanding balance across every non-cancelled, unpaid bill for the vendor. */
  getVendorBalance(organizationId: OrganizationId, vendorId: VendorId): Promise<string>;
  /** Deterministic AP aging, bucketed by days past each bill's `dueDate` as of `asOf`. */
  computeAging(organizationId: OrganizationId, asOf: ISODate): Promise<AgingReport>;
}

/** Creates a real {@link AccountsPayableEngine}. */
export function createAccountsPayableEngine(
  vendorRepository: VendorRepository,
  billRepository: BillRepository,
  vendorCreditRepository: VendorCreditRepository,
  paymentRepository: APPaymentRepository,
  eventBus?: FinanceEventBus,
  now: () => string = nowIso,
): AccountsPayableEngine {
  async function requireVendor(organizationId: OrganizationId, vendorId: VendorId): Promise<Vendor> {
    const vendor = await vendorRepository.findById(organizationId, vendorId);
    if (!vendor) throw new VendorNotFoundError(vendorId);
    return vendor;
  }

  async function requireBill(organizationId: OrganizationId, billId: BillId): Promise<Bill> {
    const bill = await billRepository.findById(organizationId, billId);
    if (!bill) throw new BillNotFoundError(billId);
    return bill;
  }

  async function requireVendorCredit(organizationId: OrganizationId, vendorCreditId: VendorCreditId): Promise<VendorCredit> {
    const credit = await vendorCreditRepository.findById(organizationId, vendorCreditId);
    if (!credit) throw new VendorCreditNotFoundError(vendorCreditId);
    return credit;
  }

  async function applyToBill(organizationId: OrganizationId, bill: Bill, amount: string): Promise<Bill> {
    if (compareAmounts(amount, bill.balanceDue) === 1) {
      throw new PaymentExceedsBalanceError(amount, bill.balanceDue);
    }
    const amountPaid = addAmounts(bill.amountPaid, amount);
    const balanceDue = subtractAmounts(bill.total, amountPaid);
    const status: BillStatus = compareAmounts(balanceDue, '0') === 0 ? 'paid' : 'partially_paid';
    const updated: Bill = { ...bill, amountPaid, balanceDue, status, updatedAt: now() };
    await billRepository.save(updated);
    if (status === 'paid') eventBus?.publish('bill.paid', { organizationId, billId: bill.id });
    return updated;
  }

  return {
    async createVendor(organizationId, input) {
      const timestamp = now();
      const vendor: Vendor = {
        id: generateId('vendor'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        displayName: input.displayName,
        externalSupplierId: input.externalSupplierId,
        paymentTermsDays: input.paymentTermsDays ?? 30,
        currency: input.currency,
      };
      await vendorRepository.save(vendor);
      return vendor;
    },

    async getVendor(organizationId, vendorId) {
      return vendorRepository.findById(organizationId, vendorId);
    },

    async listVendors(organizationId) {
      return vendorRepository.findAll(organizationId);
    },

    async createBill(organizationId, input) {
      const vendor = await requireVendor(organizationId, input.vendorId);
      const { lines, totals } = computeBillTotals(input.lines);
      const timestamp = now();
      const bill: Bill = {
        id: generateId('bill'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        billNumber: input.billNumber,
        vendorId: input.vendorId,
        lines,
        currency: input.currency,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        amountPaid: '0.00',
        balanceDue: totals.total,
        status: 'draft',
      };
      await billRepository.save(bill);
      eventBus?.publish('bill.created', { organizationId, billId: bill.id, vendorId: vendor.id });
      return bill;
    },

    async receiveBill(organizationId, billId, billDate) {
      const bill = await requireBill(organizationId, billId);
      if (!canTransitionBill(bill.status, 'received')) {
        throw new InvalidBillTransitionError(billId, bill.status, 'received');
      }
      const vendor = await requireVendor(organizationId, bill.vendorId);
      const updated: Bill = {
        ...bill,
        status: 'received',
        billDate,
        dueDate: addDaysIso(billDate, vendor.paymentTermsDays),
        updatedAt: now(),
      };
      await billRepository.save(updated);
      return updated;
    },

    async recordPayment(organizationId, billId, input) {
      const bill = await requireBill(organizationId, billId);
      if (bill.status !== 'received' && bill.status !== 'partially_paid') {
        throw new InvalidBillTransitionError(billId, bill.status, 'partially_paid');
      }
      await applyToBill(organizationId, bill, input.amount);
      const timestamp = now();
      const payment: APPayment = {
        id: generateId('ap-payment'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        vendorId: bill.vendorId,
        billId,
        amount: input.amount,
        currency: bill.currency,
        paidAt: input.paidAt ?? timestamp,
        method: input.method,
      };
      await paymentRepository.save(payment);
      return payment;
    },

    async cancelBill(organizationId, billId) {
      const bill = await requireBill(organizationId, billId);
      if (!canTransitionBill(bill.status, 'cancelled')) {
        throw new InvalidBillTransitionError(billId, bill.status, 'cancelled');
      }
      const updated: Bill = { ...bill, status: 'cancelled', updatedAt: now() };
      await billRepository.save(updated);
      return updated;
    },

    async getBill(organizationId, billId) {
      return billRepository.findById(organizationId, billId);
    },

    async listBills(organizationId) {
      return billRepository.findAll(organizationId);
    },

    async findByVendor(organizationId, vendorId) {
      return billRepository.findByVendor(organizationId, vendorId);
    },

    async createVendorCredit(organizationId, input) {
      const timestamp = now();
      const credit: VendorCredit = {
        id: generateId('vendor-credit'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        vendorId: input.vendorId,
        billId: input.billId,
        amount: input.amount,
        currency: input.currency,
        reason: input.reason,
        status: 'draft',
      };
      await vendorCreditRepository.save(credit);
      return credit;
    },

    async issueVendorCredit(organizationId, vendorCreditId) {
      const credit = await requireVendorCredit(organizationId, vendorCreditId);
      if (!canTransitionVendorCredit(credit.status, 'issued')) {
        throw new InvalidVendorCreditTransitionError(vendorCreditId, credit.status, 'issued');
      }
      const updated: VendorCredit = { ...credit, status: 'issued', updatedAt: now() };
      await vendorCreditRepository.save(updated);
      return updated;
    },

    async applyVendorCreditToBill(organizationId, vendorCreditId, billId) {
      const credit = await requireVendorCredit(organizationId, vendorCreditId);
      if (!canTransitionVendorCredit(credit.status, 'applied')) {
        throw new InvalidVendorCreditTransitionError(vendorCreditId, credit.status, 'applied');
      }
      const bill = await requireBill(organizationId, billId);
      await applyToBill(organizationId, bill, credit.amount);
      const updated: VendorCredit = { ...credit, billId, status: 'applied', updatedAt: now() };
      await vendorCreditRepository.save(updated);
      return updated;
    },

    async getVendorBalance(organizationId, vendorId) {
      const bills = await billRepository.findByVendor(organizationId, vendorId);
      return sumAmounts(bills.filter((bill) => bill.status === 'received' || bill.status === 'partially_paid').map((bill) => bill.balanceDue));
    },

    async computeAging(organizationId, asOf) {
      const bills = (await billRepository.findAll(organizationId)).filter(
        (bill) => (bill.status === 'received' || bill.status === 'partially_paid') && bill.dueDate,
      );

      const buckets: Record<keyof AgingBucketAmounts, string> = { ...EMPTY_BUCKETS };
      const byVendor = new Map<VendorId, Record<keyof AgingBucketAmounts, string>>();

      for (const bill of bills) {
        const daysOverdue = daysBetweenIso(bill.dueDate as string, asOf);
        const bucket = agingBucketForDaysOverdue(daysOverdue);
        buckets[bucket] = addAmounts(buckets[bucket], bill.balanceDue);

        const vendorBuckets = byVendor.get(bill.vendorId) ?? { ...EMPTY_BUCKETS };
        vendorBuckets[bucket] = addAmounts(vendorBuckets[bucket], bill.balanceDue);
        byVendor.set(bill.vendorId, vendorBuckets);
      }

      const byVendorLines = Array.from(byVendor.entries()).map(([vendorId, vendorBuckets]) => ({
        vendorId,
        buckets: vendorBuckets,
        total: sumAmounts(Object.values(vendorBuckets)),
      }));

      return {
        asOf,
        buckets,
        byVendor: byVendorLines,
        total: sumAmounts(Object.values(buckets)),
      };
    },
  };
}
