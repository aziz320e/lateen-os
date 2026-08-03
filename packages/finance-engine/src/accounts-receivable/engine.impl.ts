/**
 * Real Accounts Receivable engine — AR customers, invoices with the
 * required 5-status lifecycle, credit notes, payments, and
 * deterministic aging/balance computation.
 *
 * @module accounts-receivable/engine.impl
 */
import { createKeyMutex } from '@lateen-os/shared-kernel/concurrency';
import { addDaysIso, daysBetweenIso } from '../shared/date.js';
import {
  addAmounts,
  compareAmounts,
  parseDecimal,
  subtractAmounts,
  sumAmounts,
  toMoney,
} from '../shared/decimal.js';
import type { FinanceEventBus } from '../events/finance-event-bus.js';
import {
  ARCustomerNotFoundError,
  ARInvoiceNotFoundError,
  CreditNoteNotFoundError,
  InvalidARInvoiceTransitionError,
  InvalidCreditNoteTransitionError,
  PaymentExceedsBalanceError,
} from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type {
  ARCustomerId,
  ARInvoiceId,
  ARPaymentId,
  CreditNoteId,
  CustomerId,
  OrganizationId,
  SalesOpportunityId,
} from '../shared/identifiers.js';
import type { CurrencyCode, ISODate, ISODateTime } from '../shared/primitives.js';
import type {
  ARCustomerRepository,
  ARInvoiceRepository,
  ARPaymentRepository,
  CreditNoteRepository,
} from './repository.js';
import type {
  AgingBucketAmounts,
  AgingReport,
  ARCustomer,
  ARInvoice,
  ARInvoiceLine,
  ARInvoiceLineInput,
  ARInvoiceStatus,
  ARInvoiceTotals,
  ARPayment,
  CreditNote,
  CreditNoteStatus,
} from './types.js';

const AR_INVOICE_TRANSITIONS: Readonly<Record<ARInvoiceStatus, readonly ARInvoiceStatus[]>> = {
  draft: ['issued', 'cancelled'],
  issued: ['partially_paid', 'paid', 'cancelled'],
  partially_paid: ['paid'],
  paid: [],
  cancelled: [],
};

/** Whether an AR invoice may transition from one status to another. */
export function canTransitionARInvoice(from: ARInvoiceStatus, to: ARInvoiceStatus): boolean {
  return AR_INVOICE_TRANSITIONS[from].includes(to);
}

const CREDIT_NOTE_TRANSITIONS: Readonly<Record<CreditNoteStatus, readonly CreditNoteStatus[]>> = {
  draft: ['issued', 'cancelled'],
  issued: ['applied', 'cancelled'],
  applied: [],
  cancelled: [],
};

/** Whether a credit note may transition from one status to another. */
export function canTransitionCreditNote(from: CreditNoteStatus, to: CreditNoteStatus): boolean {
  return CREDIT_NOTE_TRANSITIONS[from].includes(to);
}

/** Pure: computes each line's amount (`quantity * unitPrice`) and the invoice's subtotal/tax/total. */
export function computeInvoiceTotals(lines: readonly ARInvoiceLineInput[]): {
  lines: readonly ARInvoiceLine[];
  totals: ARInvoiceTotals;
} {
  const computedLines: ARInvoiceLine[] = lines.map((line) => ({
    ...line,
    amount: toMoney(parseDecimal(line.quantity) * parseDecimal(line.unitPrice)),
  }));
  const subtotal = sumAmounts(computedLines.map((line) => line.amount));
  const taxTotal = sumAmounts(
    computedLines.map((line) =>
      toMoney(parseDecimal(line.amount) * (parseDecimal(line.taxRatePct) / 100)),
    ),
  );
  const total = addAmounts(subtotal, taxTotal);
  return { lines: computedLines, totals: { subtotal, taxTotal, total } };
}

const EMPTY_BUCKETS: AgingBucketAmounts = {
  current: '0.00',
  days_1_30: '0.00',
  days_31_60: '0.00',
  days_61_90: '0.00',
  days_90_plus: '0.00',
};

/** Pure: which aging bucket a balance falls into, given how many days past due it is. */
export function agingBucketForDaysOverdue(daysOverdue: number): keyof AgingBucketAmounts {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return 'days_1_30';
  if (daysOverdue <= 60) return 'days_31_60';
  if (daysOverdue <= 90) return 'days_61_90';
  return 'days_90_plus';
}

export interface CreateARCustomerInput {
  readonly displayName: string;
  readonly externalCustomerId?: CustomerId;
  readonly creditLimit?: string;
  readonly paymentTermsDays?: number;
  readonly currency: CurrencyCode;
}

export interface CreateARInvoiceInput {
  readonly customerId: ARCustomerId;
  readonly lines: readonly ARInvoiceLineInput[];
  readonly currency: CurrencyCode;
  readonly invoiceNumber?: string;
  readonly sourceOpportunityId?: SalesOpportunityId;
}

export interface RecordARPaymentInput {
  readonly amount: string;
  readonly paidAt?: ISODateTime;
  readonly method?: string;
}

export interface CreateCreditNoteInput {
  readonly customerId: ARCustomerId;
  readonly invoiceId?: ARInvoiceId;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly reason?: string;
}

export interface AccountsReceivableEngine {
  createCustomer(organizationId: OrganizationId, input: CreateARCustomerInput): Promise<ARCustomer>;
  getCustomer(organizationId: OrganizationId, customerId: ARCustomerId): Promise<ARCustomer | null>;
  listCustomers(organizationId: OrganizationId): Promise<readonly ARCustomer[]>;

  createInvoice(organizationId: OrganizationId, input: CreateARInvoiceInput): Promise<ARInvoice>;
  issueInvoice(
    organizationId: OrganizationId,
    invoiceId: ARInvoiceId,
    issueDate: ISODate,
  ): Promise<ARInvoice>;
  recordPayment(
    organizationId: OrganizationId,
    invoiceId: ARInvoiceId,
    input: RecordARPaymentInput,
  ): Promise<ARPayment>;
  cancelInvoice(organizationId: OrganizationId, invoiceId: ARInvoiceId): Promise<ARInvoice>;
  getInvoice(organizationId: OrganizationId, invoiceId: ARInvoiceId): Promise<ARInvoice | null>;
  listInvoices(organizationId: OrganizationId): Promise<readonly ARInvoice[]>;
  findByCustomer(
    organizationId: OrganizationId,
    customerId: ARCustomerId,
  ): Promise<readonly ARInvoice[]>;

  createCreditNote(
    organizationId: OrganizationId,
    input: CreateCreditNoteInput,
  ): Promise<CreditNote>;
  issueCreditNote(organizationId: OrganizationId, creditNoteId: CreditNoteId): Promise<CreditNote>;
  applyCreditNoteToInvoice(
    organizationId: OrganizationId,
    creditNoteId: CreditNoteId,
    invoiceId: ARInvoiceId,
  ): Promise<CreditNote>;

  /** Outstanding balance across every non-cancelled, unpaid invoice for the customer. */
  getCustomerBalance(organizationId: OrganizationId, customerId: ARCustomerId): Promise<string>;
  /** Deterministic AR aging, bucketed by days past each invoice's `dueDate` as of `asOf`. */
  computeAging(organizationId: OrganizationId, asOf: ISODate): Promise<AgingReport>;
}

/** Creates a real {@link AccountsReceivableEngine}. */
export function createAccountsReceivableEngine(
  customerRepository: ARCustomerRepository,
  invoiceRepository: ARInvoiceRepository,
  creditNoteRepository: CreditNoteRepository,
  paymentRepository: ARPaymentRepository,
  eventBus?: FinanceEventBus,
  now: () => string = nowIso,
): AccountsReceivableEngine {
  async function requireCustomer(
    organizationId: OrganizationId,
    customerId: ARCustomerId,
  ): Promise<ARCustomer> {
    const customer = await customerRepository.findById(organizationId, customerId);
    if (!customer) throw new ARCustomerNotFoundError(customerId);
    return customer;
  }

  async function requireInvoice(
    organizationId: OrganizationId,
    invoiceId: ARInvoiceId,
  ): Promise<ARInvoice> {
    const invoice = await invoiceRepository.findById(organizationId, invoiceId);
    if (!invoice) throw new ARInvoiceNotFoundError(invoiceId);
    return invoice;
  }

  async function requireCreditNote(
    organizationId: OrganizationId,
    creditNoteId: CreditNoteId,
  ): Promise<CreditNote> {
    const note = await creditNoteRepository.findById(organizationId, creditNoteId);
    if (!note) throw new CreditNoteNotFoundError(creditNoteId);
    return note;
  }

  // Serializes read-compute-write against a single invoice: without this,
  // two concurrent payments/credit-note applications targeting the same
  // invoice can both read the same starting `amountPaid`/`balanceDue`,
  // compute independently, and the second `save()` silently discards the
  // first's effect (a lost update) even though both individual payment
  // records are persisted. Keyed by invoice id; unrelated invoices are
  // never blocked by one another. `applyToInvoice` re-reads the invoice
  // *inside* the lock rather than accepting an already-fetched one, so
  // the whole read-compute-write sequence is atomic, not just the write.
  const invoiceMutex = createKeyMutex();

  async function applyToInvoice(
    organizationId: OrganizationId,
    invoiceId: ARInvoiceId,
    amount: string,
  ): Promise<ARInvoice> {
    return invoiceMutex.runExclusive(invoiceId, async () => {
      const invoice = await requireInvoice(organizationId, invoiceId);
      if (compareAmounts(amount, invoice.balanceDue) === 1) {
        throw new PaymentExceedsBalanceError(amount, invoice.balanceDue);
      }
      const amountPaid = addAmounts(invoice.amountPaid, amount);
      const balanceDue = subtractAmounts(invoice.total, amountPaid);
      const status: ARInvoiceStatus =
        compareAmounts(balanceDue, '0') === 0 ? 'paid' : 'partially_paid';
      const updated: ARInvoice = { ...invoice, amountPaid, balanceDue, status, updatedAt: now() };
      await invoiceRepository.save(updated);
      if (status === 'paid')
        eventBus?.publish('invoice.paid', { organizationId, invoiceId: invoice.id });
      return updated;
    });
  }

  return {
    async createCustomer(organizationId, input) {
      const timestamp = now();
      const customer: ARCustomer = {
        id: generateId('ar-customer'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        displayName: input.displayName,
        externalCustomerId: input.externalCustomerId,
        creditLimit: input.creditLimit,
        paymentTermsDays: input.paymentTermsDays ?? 30,
        currency: input.currency,
      };
      await customerRepository.save(customer);
      return customer;
    },

    async getCustomer(organizationId, customerId) {
      return customerRepository.findById(organizationId, customerId);
    },

    async listCustomers(organizationId) {
      return customerRepository.findAll(organizationId);
    },

    async createInvoice(organizationId, input) {
      await requireCustomer(organizationId, input.customerId);
      const { lines, totals } = computeInvoiceTotals(input.lines);
      const timestamp = now();
      const invoice: ARInvoice = {
        id: generateId('ar-invoice'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        invoiceNumber: input.invoiceNumber,
        customerId: input.customerId,
        lines,
        currency: input.currency,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        amountPaid: '0.00',
        balanceDue: totals.total,
        status: 'draft',
        sourceOpportunityId: input.sourceOpportunityId,
      };
      await invoiceRepository.save(invoice);
      return invoice;
    },

    async issueInvoice(organizationId, invoiceId, issueDate) {
      const invoice = await requireInvoice(organizationId, invoiceId);
      if (!canTransitionARInvoice(invoice.status, 'issued')) {
        throw new InvalidARInvoiceTransitionError(invoiceId, invoice.status, 'issued');
      }
      const customer = await requireCustomer(organizationId, invoice.customerId);
      const updated: ARInvoice = {
        ...invoice,
        status: 'issued',
        issueDate,
        dueDate: addDaysIso(issueDate, customer.paymentTermsDays),
        updatedAt: now(),
      };
      await invoiceRepository.save(updated);
      eventBus?.publish('invoice.issued', {
        organizationId,
        invoiceId,
        customerId: invoice.customerId,
      });
      return updated;
    },

    async recordPayment(organizationId, invoiceId, input) {
      const invoice = await requireInvoice(organizationId, invoiceId);
      if (invoice.status !== 'issued' && invoice.status !== 'partially_paid') {
        throw new InvalidARInvoiceTransitionError(invoiceId, invoice.status, 'partially_paid');
      }
      await applyToInvoice(organizationId, invoiceId, input.amount);
      const timestamp = now();
      const payment: ARPayment = {
        id: generateId('ar-payment'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        customerId: invoice.customerId,
        invoiceId,
        amount: input.amount,
        currency: invoice.currency,
        paidAt: input.paidAt ?? timestamp,
        method: input.method,
      };
      await paymentRepository.save(payment);
      return payment;
    },

    async cancelInvoice(organizationId, invoiceId) {
      const invoice = await requireInvoice(organizationId, invoiceId);
      if (!canTransitionARInvoice(invoice.status, 'cancelled')) {
        throw new InvalidARInvoiceTransitionError(invoiceId, invoice.status, 'cancelled');
      }
      const updated: ARInvoice = { ...invoice, status: 'cancelled', updatedAt: now() };
      await invoiceRepository.save(updated);
      return updated;
    },

    async getInvoice(organizationId, invoiceId) {
      return invoiceRepository.findById(organizationId, invoiceId);
    },

    async listInvoices(organizationId) {
      return invoiceRepository.findAll(organizationId);
    },

    async findByCustomer(organizationId, customerId) {
      return invoiceRepository.findByCustomer(organizationId, customerId);
    },

    async createCreditNote(organizationId, input) {
      const timestamp = now();
      const note: CreditNote = {
        id: generateId('credit-note'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        customerId: input.customerId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        currency: input.currency,
        reason: input.reason,
        status: 'draft',
      };
      await creditNoteRepository.save(note);
      return note;
    },

    async issueCreditNote(organizationId, creditNoteId) {
      const note = await requireCreditNote(organizationId, creditNoteId);
      if (!canTransitionCreditNote(note.status, 'issued')) {
        throw new InvalidCreditNoteTransitionError(creditNoteId, note.status, 'issued');
      }
      const updated: CreditNote = { ...note, status: 'issued', updatedAt: now() };
      await creditNoteRepository.save(updated);
      return updated;
    },

    async applyCreditNoteToInvoice(organizationId, creditNoteId, invoiceId) {
      const note = await requireCreditNote(organizationId, creditNoteId);
      if (!canTransitionCreditNote(note.status, 'applied')) {
        throw new InvalidCreditNoteTransitionError(creditNoteId, note.status, 'applied');
      }
      // Existence is validated by applyToInvoice itself (inside the lock).
      await applyToInvoice(organizationId, invoiceId, note.amount);
      const updated: CreditNote = { ...note, invoiceId, status: 'applied', updatedAt: now() };
      await creditNoteRepository.save(updated);
      return updated;
    },

    async getCustomerBalance(organizationId, customerId) {
      const invoices = await invoiceRepository.findByCustomer(organizationId, customerId);
      return sumAmounts(
        invoices
          .filter((invoice) => invoice.status === 'issued' || invoice.status === 'partially_paid')
          .map((invoice) => invoice.balanceDue),
      );
    },

    async computeAging(organizationId, asOf) {
      const invoices = (await invoiceRepository.findAll(organizationId)).filter(
        (invoice) =>
          (invoice.status === 'issued' || invoice.status === 'partially_paid') && invoice.dueDate,
      );

      const buckets: Record<keyof AgingBucketAmounts, string> = { ...EMPTY_BUCKETS };
      const byCustomer = new Map<ARCustomerId, Record<keyof AgingBucketAmounts, string>>();

      for (const invoice of invoices) {
        const daysOverdue = daysBetweenIso(invoice.dueDate as string, asOf);
        const bucket = agingBucketForDaysOverdue(daysOverdue);
        buckets[bucket] = addAmounts(buckets[bucket], invoice.balanceDue);

        const customerBuckets = byCustomer.get(invoice.customerId) ?? { ...EMPTY_BUCKETS };
        customerBuckets[bucket] = addAmounts(customerBuckets[bucket], invoice.balanceDue);
        byCustomer.set(invoice.customerId, customerBuckets);
      }

      const byCustomerLines = Array.from(byCustomer.entries()).map(
        ([customerId, customerBuckets]) => ({
          customerId,
          buckets: customerBuckets,
          total: sumAmounts(Object.values(customerBuckets)),
        }),
      );

      return {
        asOf,
        buckets,
        byCustomer: byCustomerLines,
        total: sumAmounts(Object.values(buckets)),
      };
    },
  };
}
