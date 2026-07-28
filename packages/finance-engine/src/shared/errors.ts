/** Typed errors used consistently across the Finance Engine runtime implementations. @module shared/errors */

export class FiscalYearNotFoundError extends Error {
  constructor(readonly fiscalYearId: string) {
    super(`Fiscal year "${fiscalYearId}" not found`);
    this.name = 'FiscalYearNotFoundError';
  }
}

export class FiscalPeriodNotFoundError extends Error {
  constructor(readonly fiscalPeriodId: string) {
    super(`Fiscal period "${fiscalPeriodId}" not found`);
    this.name = 'FiscalPeriodNotFoundError';
  }
}

export class FiscalPeriodClosedError extends Error {
  constructor(readonly fiscalPeriodId: string) {
    super(`Fiscal period "${fiscalPeriodId}" is closed`);
    this.name = 'FiscalPeriodClosedError';
  }
}

export class NumberingSequenceNotFoundError extends Error {
  constructor(readonly sequenceType: string) {
    super(`Numbering sequence "${sequenceType}" not found`);
    this.name = 'NumberingSequenceNotFoundError';
  }
}

export class AccountNotFoundError extends Error {
  constructor(readonly accountId: string) {
    super(`Account "${accountId}" not found`);
    this.name = 'AccountNotFoundError';
  }
}

export class InvalidAccountTransitionError extends Error {
  constructor(
    readonly accountId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Account "${accountId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidAccountTransitionError';
  }
}

export class JournalEntryNotFoundError extends Error {
  constructor(readonly journalEntryId: string) {
    super(`Journal entry "${journalEntryId}" not found`);
    this.name = 'JournalEntryNotFoundError';
  }
}

export class UnbalancedJournalEntryError extends Error {
  constructor(
    readonly totalDebit: string,
    readonly totalCredit: string,
  ) {
    super(`Journal entry does not balance: debit ${totalDebit} != credit ${totalCredit}`);
    this.name = 'UnbalancedJournalEntryError';
  }
}

export class InvalidJournalEntryTransitionError extends Error {
  constructor(
    readonly journalEntryId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Journal entry "${journalEntryId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidJournalEntryTransitionError';
  }
}

export class RecurringJournalTemplateNotFoundError extends Error {
  constructor(readonly templateId: string) {
    super(`Recurring journal template "${templateId}" not found`);
    this.name = 'RecurringJournalTemplateNotFoundError';
  }
}

export class ARCustomerNotFoundError extends Error {
  constructor(readonly customerId: string) {
    super(`AR customer "${customerId}" not found`);
    this.name = 'ARCustomerNotFoundError';
  }
}

export class ARInvoiceNotFoundError extends Error {
  constructor(readonly invoiceId: string) {
    super(`AR invoice "${invoiceId}" not found`);
    this.name = 'ARInvoiceNotFoundError';
  }
}

export class InvalidARInvoiceTransitionError extends Error {
  constructor(
    readonly invoiceId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`AR invoice "${invoiceId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidARInvoiceTransitionError';
  }
}

export class PaymentExceedsBalanceError extends Error {
  constructor(
    readonly amount: string,
    readonly balanceDue: string,
  ) {
    super(`Payment amount ${amount} exceeds balance due ${balanceDue}`);
    this.name = 'PaymentExceedsBalanceError';
  }
}

export class CreditNoteNotFoundError extends Error {
  constructor(readonly creditNoteId: string) {
    super(`Credit note "${creditNoteId}" not found`);
    this.name = 'CreditNoteNotFoundError';
  }
}

export class InvalidCreditNoteTransitionError extends Error {
  constructor(
    readonly creditNoteId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Credit note "${creditNoteId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidCreditNoteTransitionError';
  }
}

export class VendorNotFoundError extends Error {
  constructor(readonly vendorId: string) {
    super(`Vendor "${vendorId}" not found`);
    this.name = 'VendorNotFoundError';
  }
}

export class BillNotFoundError extends Error {
  constructor(readonly billId: string) {
    super(`Bill "${billId}" not found`);
    this.name = 'BillNotFoundError';
  }
}

export class InvalidBillTransitionError extends Error {
  constructor(
    readonly billId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Bill "${billId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidBillTransitionError';
  }
}

export class VendorCreditNotFoundError extends Error {
  constructor(readonly vendorCreditId: string) {
    super(`Vendor credit "${vendorCreditId}" not found`);
    this.name = 'VendorCreditNotFoundError';
  }
}

export class InvalidVendorCreditTransitionError extends Error {
  constructor(
    readonly vendorCreditId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Vendor credit "${vendorCreditId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidVendorCreditTransitionError';
  }
}

export class CashAccountNotFoundError extends Error {
  constructor(readonly cashAccountId: string) {
    super(`Cash account "${cashAccountId}" not found`);
    this.name = 'CashAccountNotFoundError';
  }
}

export class InsufficientFundsError extends Error {
  constructor(
    readonly cashAccountId: string,
    readonly amount: string,
    readonly balance: string,
  ) {
    super(`Cash account "${cashAccountId}" has insufficient funds: requested ${amount}, available ${balance}`);
    this.name = 'InsufficientFundsError';
  }
}

export class TreasuryTransactionNotFoundError extends Error {
  constructor(readonly transactionId: string) {
    super(`Treasury transaction "${transactionId}" not found`);
    this.name = 'TreasuryTransactionNotFoundError';
  }
}

export class ReconciliationNotFoundError extends Error {
  constructor(readonly reconciliationId: string) {
    super(`Reconciliation "${reconciliationId}" not found`);
    this.name = 'ReconciliationNotFoundError';
  }
}

export class ReconciliationDiscrepancyError extends Error {
  constructor(
    readonly reconciliationId: string,
    readonly discrepancy: string,
  ) {
    super(`Reconciliation "${reconciliationId}" cannot complete with a non-zero discrepancy of ${discrepancy}`);
    this.name = 'ReconciliationDiscrepancyError';
  }
}

export class BudgetNotFoundError extends Error {
  constructor(readonly budgetId: string) {
    super(`Budget "${budgetId}" not found`);
    this.name = 'BudgetNotFoundError';
  }
}

export class InvalidBudgetTransitionError extends Error {
  constructor(
    readonly budgetId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Budget "${budgetId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidBudgetTransitionError';
  }
}

export class TaxRuleNotFoundError extends Error {
  constructor(readonly taxRuleId: string) {
    super(`Tax rule "${taxRuleId}" not found`);
    this.name = 'TaxRuleNotFoundError';
  }
}

export class InvalidTaxRuleError extends Error {
  constructor(reason: string) {
    super(`Invalid tax rule: ${reason}`);
    this.name = 'InvalidTaxRuleError';
  }
}

export class TaxCalculationNotFoundError extends Error {
  constructor(readonly taxCalculationId: string) {
    super(`Tax calculation "${taxCalculationId}" not found`);
    this.name = 'TaxCalculationNotFoundError';
  }
}

export class FinanceReportNotFoundError extends Error {
  constructor(readonly reportId: string) {
    super(`Finance report "${reportId}" not found`);
    this.name = 'FinanceReportNotFoundError';
  }
}
