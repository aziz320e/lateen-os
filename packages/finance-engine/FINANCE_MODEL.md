# Finance Model

> Real, implemented model for the Finance Engine — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Financial Organization

`financial-organization/engine.impl.ts`'s `createFinancialOrganizationEngine()` implements:

- **Fiscal years** — `createFiscalYear()` starts a year at `status: 'open'`; `closeFiscalYear()` closes it.
- **Fiscal periods** — `generateFiscalPeriods()` splits a fiscal year into `periodCount` (default 12) consecutive, non-overlapping monthly periods starting from the year's `startDate`, each clamped to correct month lengths. `closeFiscalPeriod()` closes a period and publishes `period.closed`. `assertFiscalPeriodOpen()` is the guard other modules can call before posting into a period.
- **Accounting settings** — `upsertAccountingSettings()` is a singleton-per-organization upsert (base currency, fiscal year start month, decimal precision), mirroring the "one record per org" pattern used elsewhere in the monorepo (e.g. AI Governance Engine's ledger).
- **Numbering sequences** — `nextSequenceNumber()` atomically hands out the next formatted document number (prefix + zero-padded number) for one of the 6 sequence types (`journal_entry`, `invoice`, `credit_note`, `bill`, `vendor_credit`, `payment`), auto-registering the sequence on first use.
- **Exchange rates** — `convertCurrency()` delegates to an injected `ExchangeRateProvider`. The default, `createStaticExchangeRateProvider()`, is deterministic and fully offline: same-currency conversion is always rate `"1"`; a differing-currency pair with no seeded rate returns `null` rather than guessing.

---

## Chart of Accounts

`account/engine.impl.ts`'s `createChartOfAccountsEngine()` implements the full lifecycle across the 5 account types (`asset`, `liability`, `equity`, `revenue`, `expense`):

- **`normalBalanceForAccountType()`** (pure) — assets and expenses are debit-normal; liabilities, equity, and revenue are credit-normal. Stamped onto every account at `create()` time and used by every module that nets a balance.
- **`create()`** — starts an account at `status: 'draft'`, `currentVersion: 1`, optionally nested under a `parentAccountId`. Publishes `account.created`.
- **`update()`** — rejected on an archived account (`InvalidAccountTransitionError`) — `restore()` first.
- **`activate()`** / **`deactivate()`** — `draft`/`inactive` → `active` and `active` → `inactive`.
- **`archive()`** / **`restore()`** — the same deliberate asymmetry used across the monorepo (AI Governance Engine's Governance Policy engine, AI Compliance Engine's Framework Registry): `archived` has no outgoing edges in `ACCOUNT_TRANSITIONS`, so `activate()`/`deactivate()` can never resurrect an archived account. `restore()` is a distinct operation returning the account to its `statusBeforeArchive` (defaulting to `draft`).
- **`getChildren()` / `getDescendants()` / `getAncestors()`** — real hierarchy traversal over `parentAccountId`, breadth-first down, walk-up for ancestors.

---

## General Ledger

`journal-entry/engine.impl.ts`'s `createGeneralLedgerEngine()` implements double-entry journal entries:

- **`isBalanced()`** (pure) — `sum(debit) === sum(credit)` across a journal entry's lines. **`createJournalEntry()` validates this before the entry is ever persisted** — `UnbalancedJournalEntryError` if it fails; there is no code path to a stored, unbalanced entry.
- **`postJournalEntry()`** — `draft` → `posted`. Publishes `journal.posted`. Only posted entries are ever summed into a balance, report, or budget actual.
- **`reverseJournalEntry()`** — only a `posted` entry may be reversed. Creates a **new**, already-`posted` entry with every line's debit/credit swapped, linking `reversalOfEntryId` on the new entry and `reversedByEntryId` on the original, which itself transitions to `reversed`. The ledger is append-only — nothing is ever deleted or mutated in place.
- **Recurring templates** — `createRecurringTemplate()` stores a reusable set of lines plus a `monthly`/`quarterly`/`annually` frequency; `generateFromTemplate()` is a pure due-check (`asOf >= nextDue`, computed from `lastGeneratedDate` or `startDate`) that creates one new **draft** journal entry per call and advances `lastGeneratedDate` — it never auto-posts, and never generates more than one occurrence per call.
- **`computeAccountNetAmount()`** (pure, exported) — the one, shared arithmetic behind every balance-bearing computation in this package: `sum(debit) - sum(credit)` for a debit-normal account, `sum(credit) - sum(debit)` for a credit-normal account. Budget variance and every Financial Report call this same function rather than re-deriving it.

---

## Accounts Receivable

`accounts-receivable/engine.impl.ts`'s `createAccountsReceivableEngine()` implements the required 5-status invoice lifecycle (`draft`, `issued`, `partially_paid`, `paid`, `cancelled`):

- **`computeInvoiceTotals()`** (pure) — per-line `amount = quantity * unitPrice`, `subtotal = Σamount`, `taxTotal = Σ(amount * taxRatePct / 100)`, `total = subtotal + taxTotal`.
- **`createInvoice()`** — starts `draft` with `amountPaid: '0.00'`, `balanceDue: total`.
- **`issueInvoice()`** — `draft` → `issued`, stamping `dueDate = issueDate + customer.paymentTermsDays`. Publishes `invoice.issued`.
- **`recordPayment()`** — only permitted while `issued`/`partially_paid`. Rejects a payment that would exceed `balanceDue` (`PaymentExceedsBalanceError` — no code path ever produces a negative balance). Moves to `partially_paid` or, once `balanceDue` reaches `0`, `paid` (publishing `invoice.paid`).
- **Credit notes** — `draft → issued → applied`, with `applied` a dead end (`InvalidCreditNoteTransitionError` otherwise). `applyCreditNoteToInvoice()` reduces the invoice's balance through the exact same guarded path as `recordPayment()`.
- **`computeAging()`** — buckets every non-cancelled, unpaid invoice's `balanceDue` by days past `dueDate` as of the given date, into `current` / `days_1_30` / `days_31_60` / `days_61_90` / `days_90_plus`, both in aggregate and per customer.

---

## Accounts Payable

`accounts-payable/engine.impl.ts`'s `createAccountsPayableEngine()` mirrors Accounts Receivable's arithmetic and lifecycle shape, applied to the payable side of the ledger (`draft`, `received`, `partially_paid`, `paid`, `cancelled`):

- **`computeBillTotals()`** (pure) — identical shape to `computeInvoiceTotals()`.
- **`createBill()`** — publishes `bill.created`. **`receiveBill()`** stamps `dueDate` from the vendor's `paymentTermsDays`. **`recordPayment()`** publishes `bill.paid` once fully paid, guarded by the same `PaymentExceedsBalanceError` check as AR.
- **Vendor credits** — `applyVendorCreditToBill()` mirrors `applyCreditNoteToInvoice()`.
- **`computeAging()`** — identical bucket boundaries to AR, applied to bills' `dueDate`/`balanceDue`.

---

## Treasury

`treasury/engine.impl.ts`'s `createTreasuryEngine()` implements cash/bank accounts (unified as `CashAccount` with an `accountSubtype`), movements, and reconciliation:

- **`recordDeposit()`** / **`recordWithdrawal()`** — adjust the account's running `balance` and record an immutable `TreasuryTransaction`. `recordWithdrawal()` throws `InsufficientFundsError` rather than allowing a negative balance.
- **`recordTransfer()`** — atomically debits the source and credits the destination cash account, guarded by the same `InsufficientFundsError` check.
- **`startReconciliation()`** — snapshots the account's current book `balance` against a caller-supplied `statementBalance`, matching every not-yet-reconciled transaction at or before `asOf`, and computes `discrepancy = statementBalance - bookBalance`.
- **`completeReconciliation()`** — marks every matched transaction `reconciled: true`. **Requires a zero discrepancy** (`ReconciliationDiscrepancyError` otherwise) — a reconciliation cannot be forced to complete over an unexplained difference.

---

## Budget Engine

`budget/engine.impl.ts`'s `createBudgetEngine()` implements the 3 required scopes (`annual`, `department`, `project`) with a guarded lifecycle and full revision history:

- **`createBudget()`** — starts `draft` at version 1, immediately snapshotting revision 1.
- **`reviseBudget()`** — bumps `currentVersion`, snapshots a new `BudgetRevision` (with an optional `reason`), and sets `status: 'revised'`. Rejected on a `closed` budget. Publishes `budget.updated`.
- **`approveBudget()`** / **`closeBudget()`** — guarded by `BUDGET_TRANSITIONS`: `draft → approved`, `approved ⇄ revised`, `{approved, revised} → closed`; `closed` is terminal.
- **`computeActualVsBudget()`** — for every budgeted line, calls the General Ledger's own `computeAccountNetAmount()` over posted entries dated within `[periodStart, periodEnd]`, and returns `variance = actual - planned` plus `variancePct` (0% when planned is 0). This is intra-package composition — Budget introduces no new accounting arithmetic of its own.

---

## Tax Engine

`tax/engine.impl.ts`'s `createTaxEngine()` implements the 5 required tax types (`VAT`, `GST`, `SALES_TAX`, `ZERO_RATED`, `EXEMPT`):

- **`calculateTax()`** (pure) — `taxableAmount * ratePct / 100`.
- **`createTaxRule()`** / **`updateTaxRule()`** — **enforce a `0` rate for `ZERO_RATED` and `EXEMPT`** (`InvalidTaxRuleError` otherwise) — there is no way to configure either type with a non-zero rate, so no calculation path can ever produce tax for them.
- **`calculateAndRecord()`** — computes and persists one immutable `TaxCalculation` (`taxAmount`, `totalAmount = taxableAmount + taxAmount`), publishing `tax.calculated`.

---

## Financial Reports

`report/engine.impl.ts`'s `createFinanceReportEngine()` generates all 7 required reports by composing this package's own engines — intra-package composition, not a second implementation of accounting logic:

- **`generateBalanceSheet()`** — nets every account's posted balance (via `computeAccountNetAmount()`) as of a date, grouped into assets/liabilities/equity.
- **`generateIncomeStatement()`** — the same net computation restricted to revenue/expense accounts within a date range, yielding `netIncome = totalRevenue - totalExpenses`.
- **`generateTrialBalance()`** — every account's net balance re-signed into a debit or credit column per its `normalBalance`; `totalDebit` always equals `totalCredit` by construction, since it is the same underlying, already-balanced journal data redistributed per account.
- **`generateCashFlow()`** — sums real Treasury deposit/withdrawal transactions within a period (`transfer`s are deliberately excluded — they move cash between the organization's own accounts and net to zero at the aggregate level).
- **`generateGeneralLedgerReport()`** — every posted journal line (optionally filtered by account and/or date range), each carrying a running balance computed per its own account.
- **`generateARAgingReport()` / `generateAPAgingReport()`** — call this package's own Accounts Receivable/Payable `computeAging()` directly; the Report engine never recomputes aging.

Every `generate*` call persists one `FinanceReport` and publishes `report.generated` — a report is always a fresh, current-state snapshot, never cached silently.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 7 required packages, each exclusively through its public API:

- **`getCustomerContext()`** — real CRM Engine `customers.get()`.
- **`getOpportunityContext()`** — real Sales Engine `opportunities.get()`.
- **`getBusinessProfileContext()`** — real Business DNA `businessProfile.get()`.
- **`raiseFinanceApprovalWorkflow()`** — composes real Workflow Engine `defineWorkflow()` + `startWorkflow()`, idempotently caching the workflow definition per `(organizationId, requestType)` so it is defined at most once.
- **`notifyFinanceEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`recordRevenueKpi()`** — real Analytics Engine `kpis.recordRevenue()`.
- **`logFinanceDecisionToMemory()`** — real Institutional Memory `lifecycle.create()`, logging a `'decision'`-typed, `'commercial'`-category knowledge entry.

Every method degrades to a documented `null` when its collaborator was not injected, so the Finance Engine remains fully usable — and fully tested — completely offline.
