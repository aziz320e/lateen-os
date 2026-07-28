/**
 * Finance Runtime — the package's composition root. Wires every real
 * in-memory repository and service together: the Financial
 * Organization engine (fiscal years/periods, accounting settings,
 * numbering sequences, exchange rates), the Chart of Accounts, the
 * General Ledger, Accounts Receivable, Accounts Payable, Treasury,
 * the Budget engine (composed with the General Ledger for actual-vs-
 * budget), the Tax engine, Financial Reports (composed with Chart of
 * Accounts, the General Ledger, Treasury, AR, and AP), the
 * Relationship Layer (the only integration point with CRM Engine,
 * Sales Engine, Business DNA, Workflow Engine, Communication Hub,
 * Analytics Engine, and Institutional Memory), the query layer, and
 * the typed event bus.
 *
 * Repositories are created here and injected into services — they are
 * never part of the returned {@link FinanceRuntime} surface.
 *
 * @module runtime
 */
import { createAccountRepository, createChartOfAccountsEngine, type ChartOfAccountsEngine } from './account/index.js';
import {
  createAccountsPayableEngine,
  createAPPaymentRepository,
  createBillRepository,
  createVendorCreditRepository,
  createVendorRepository,
  type AccountsPayableEngine,
} from './accounts-payable/index.js';
import {
  createAccountsReceivableEngine,
  createARCustomerRepository,
  createARInvoiceRepository,
  createARPaymentRepository,
  createCreditNoteRepository,
  type AccountsReceivableEngine,
} from './accounts-receivable/index.js';
import { createBudgetEngine, createBudgetRepository, createBudgetRevisionRepository, type BudgetEngine } from './budget/index.js';
import { createFinanceEventBus, type FinanceEventBus } from './events/index.js';
import {
  createAccountingSettingsRepository,
  createFinancialOrganizationEngine,
  createFiscalPeriodRepository,
  createFiscalYearRepository,
  createNumberingSequenceRepository,
  createStaticExchangeRateProvider,
  type ExchangeRateProvider,
  type FinancialOrganizationEngine,
} from './financial-organization/index.js';
import {
  createGeneralLedgerEngine,
  createJournalEntryRepository,
  createRecurringJournalTemplateRepository,
  type GeneralLedgerEngine,
} from './journal-entry/index.js';
import { createFinanceQueries, type FinanceQueries } from './queries/index.js';
import { createRelationshipManagement, type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';
import { createFinanceReportEngine, createFinanceReportRepository, type FinanceReportEngine } from './report/index.js';
import { nowIso } from './shared/id.js';
import { createTaxCalculationRepository, createTaxEngine, createTaxRuleRepository, type TaxEngine } from './tax/index.js';
import {
  createCashAccountRepository,
  createReconciliationRepository,
  createTreasuryEngine,
  createTreasuryTransactionRepository,
  type TreasuryEngine,
} from './treasury/index.js';

export interface FinanceRuntimeDeps {
  readonly eventBus?: FinanceEventBus;
  readonly now?: () => string;
  readonly exchangeRateProvider?: ExchangeRateProvider;
  readonly crm?: RelationshipManagementDeps['crm'];
  readonly sales?: RelationshipManagementDeps['sales'];
  readonly businessDna?: RelationshipManagementDeps['businessDna'];
  readonly workflow?: RelationshipManagementDeps['workflow'];
  readonly communicationHub?: RelationshipManagementDeps['communicationHub'];
  readonly analytics?: RelationshipManagementDeps['analytics'];
  readonly institutionalMemory?: RelationshipManagementDeps['institutionalMemory'];
}

export interface FinanceRuntime {
  readonly financialOrganization: FinancialOrganizationEngine;
  readonly chartOfAccounts: ChartOfAccountsEngine;
  readonly generalLedger: GeneralLedgerEngine;
  readonly accountsReceivable: AccountsReceivableEngine;
  readonly accountsPayable: AccountsPayableEngine;
  readonly treasury: TreasuryEngine;
  readonly budgets: BudgetEngine;
  readonly tax: TaxEngine;
  readonly reports: FinanceReportEngine;
  readonly relationships: RelationshipManagement;
  readonly queries: FinanceQueries;
  /** Typed event bus — subscribe to account/journal/invoice/bill/budget/tax/report/period events. */
  readonly events: FinanceEventBus;
}

/** Creates a real, in-memory {@link FinanceRuntime}. */
export function createFinanceRuntime(deps: FinanceRuntimeDeps = {}): FinanceRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createFinanceEventBus();
  const exchangeRateProvider = deps.exchangeRateProvider ?? createStaticExchangeRateProvider();

  const fiscalYearRepository = createFiscalYearRepository();
  const fiscalPeriodRepository = createFiscalPeriodRepository();
  const accountingSettingsRepository = createAccountingSettingsRepository();
  const numberingSequenceRepository = createNumberingSequenceRepository();

  const accountRepository = createAccountRepository();

  const journalEntryRepository = createJournalEntryRepository();
  const recurringJournalTemplateRepository = createRecurringJournalTemplateRepository();

  const arCustomerRepository = createARCustomerRepository();
  const arInvoiceRepository = createARInvoiceRepository();
  const creditNoteRepository = createCreditNoteRepository();
  const arPaymentRepository = createARPaymentRepository();

  const vendorRepository = createVendorRepository();
  const billRepository = createBillRepository();
  const vendorCreditRepository = createVendorCreditRepository();
  const apPaymentRepository = createAPPaymentRepository();

  const cashAccountRepository = createCashAccountRepository();
  const treasuryTransactionRepository = createTreasuryTransactionRepository();
  const reconciliationRepository = createReconciliationRepository();

  const budgetRepository = createBudgetRepository();
  const budgetRevisionRepository = createBudgetRevisionRepository();

  const taxRuleRepository = createTaxRuleRepository();
  const taxCalculationRepository = createTaxCalculationRepository();

  const financeReportRepository = createFinanceReportRepository();

  const financialOrganization = createFinancialOrganizationEngine(
    fiscalYearRepository,
    fiscalPeriodRepository,
    accountingSettingsRepository,
    numberingSequenceRepository,
    exchangeRateProvider,
    eventBus,
    now,
  );

  const chartOfAccounts = createChartOfAccountsEngine(accountRepository, eventBus, now);

  const generalLedger = createGeneralLedgerEngine(journalEntryRepository, recurringJournalTemplateRepository, eventBus, now);

  const accountsReceivable = createAccountsReceivableEngine(
    arCustomerRepository,
    arInvoiceRepository,
    creditNoteRepository,
    arPaymentRepository,
    eventBus,
    now,
  );

  const accountsPayable = createAccountsPayableEngine(vendorRepository, billRepository, vendorCreditRepository, apPaymentRepository, eventBus, now);

  const treasury = createTreasuryEngine(cashAccountRepository, treasuryTransactionRepository, reconciliationRepository, eventBus, now);

  const budgets = createBudgetEngine(budgetRepository, budgetRevisionRepository, journalEntryRepository, accountRepository, eventBus, now);

  const tax = createTaxEngine(taxRuleRepository, taxCalculationRepository, eventBus, now);

  const reports = createFinanceReportEngine(
    accountRepository,
    journalEntryRepository,
    treasuryTransactionRepository,
    accountsReceivable,
    accountsPayable,
    financeReportRepository,
    eventBus,
    now,
  );

  const relationships = createRelationshipManagement({
    crm: deps.crm,
    sales: deps.sales,
    businessDna: deps.businessDna,
    workflow: deps.workflow,
    communicationHub: deps.communicationHub,
    analytics: deps.analytics,
    institutionalMemory: deps.institutionalMemory,
  });

  const queries = createFinanceQueries({
    accountRepository,
    journalEntryRepository,
    arInvoiceRepository,
    billRepository,
    budgetRepository,
    taxRuleRepository,
    reportRepository: financeReportRepository,
  });

  return {
    financialOrganization,
    chartOfAccounts,
    generalLedger,
    accountsReceivable,
    accountsPayable,
    treasury,
    budgets,
    tax,
    reports,
    relationships,
    queries,
    events: eventBus,
  };
}
