# @lateen-os/finance-engine

Finance Engine — financial organization, chart of accounts, general ledger, accounts receivable, accounts payable, treasury, budgeting, tax, and financial reporting for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Finance Engine is the canonical accounting layer for Lateen OS: it owns Financial Organization setup (fiscal years/periods, accounting settings, exchange rates, numbering sequences), the Chart of Accounts, the General Ledger, Accounts Receivable, Accounts Payable, Treasury, the Budget Engine, the Tax Engine, and Financial Reports — and is the package that integrates CRM Engine, Sales Engine, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory on behalf of the finance domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package** (every calculation — journal balancing, invoice/bill totals, tax, aging, budget variance, financial reports — is fixed arithmetic over decimal-string amounts, not model inference)
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createFinanceRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Financial Organization | `financial-organization` | Fiscal years, fiscal periods, accounting settings (base currency, fiscal year start month, decimal precision), an `ExchangeRateProvider` abstraction (default: deterministic static-rate table), and per-type numbering sequences |
| Chart of Accounts | `account` | create / update / activate / deactivate / archive / restore across the 5 account types (asset, liability, equity, revenue, expense); hierarchical via `parentAccountId` |
| General Ledger | `journal-entry` | Journal entries with debit/credit lines, balance validation (an unbalanced entry can never be persisted), posting, reversing entries, and recurring journal templates |
| Accounts Receivable | `accounts-receivable` | AR customers, invoices (`draft → issued → partially_paid → paid`, plus `cancelled`), credit notes, payments, deterministic aging, and customer balances |
| Accounts Payable | `accounts-payable` | Vendors, bills (mirrors AR's lifecycle), vendor credits, payments, due dates, deterministic aging, and vendor balances |
| Treasury | `treasury` | Cash and bank accounts (unified as `CashAccount`), deposits, withdrawals, transfers, and bank reconciliation |
| Budget Engine | `budget` | Annual / department / project budgets, guarded lifecycle, full revision history, and actual-vs-budget variance computed directly from posted General Ledger entries |
| Tax Engine | `tax` | Configurable, deterministic tax rules for VAT, GST, Sales Tax, Zero-rated, and Exempt (the latter two are enforced to a `0` rate at creation) |
| Financial Reports | `report` | Balance Sheet, Income Statement, Trial Balance, Cash Flow, General Ledger Report, AR Aging, and AP Aging — every report composes this package's own engines, none re-implement accounting logic |
| Relationship Layer | `relationship-management` | Integrates CRM Engine, Sales Engine, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory — see below |
| Query Layer | `queries` | Real, read-only `FinanceQueries` port — `findAccounts` / `findJournalEntries` / `findInvoices` / `findBills` / `findBudgets` / `findTaxes` / `findReports` / `findBalances` / `searchFinance` |
| Event Bus | `events` | Typed `FinanceEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with CRM Engine, Sales Engine, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages. Each of the 7 required packages has a real, genuine integration point in `relationship-management`:

- **CRM Engine** — `getCustomerContext()` fetches a real CRM customer via `customers.get()`. Optional — injected as `Pick<CrmRuntime, 'customers'>`.
- **Sales Engine** — `getOpportunityContext()` fetches a real Sales Engine opportunity via `opportunities.get()` — used to seed an AR invoice from a won deal. Optional — injected as `Pick<SalesRuntime, 'opportunities'>`.
- **Business DNA** — structural (`shared/identifiers.ts` reuses `OrganizationId` / `CustomerId` / `SupplierId` / `EmployeeId` / `DepartmentId` / `ProjectId`) and behavioral, via `getBusinessProfileContext()`. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Workflow Engine** — `raiseFinanceApprovalWorkflow()` composes real `defineWorkflow()` + `startWorkflow()` to start a genuine finance-approval workflow instance. Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.
- **Communication Hub** — `notifyFinanceEvent()` creates and sends a real Communication Hub `'escalation'` notification. Optional — injected as `Pick<CommunicationRuntime, 'notifications'>`.
- **Analytics Engine** — `recordRevenueKpi()` records a real KPI snapshot via `kpis.recordRevenue()`. Optional — injected as `Pick<AnalyticsRuntime, 'kpis'>`.
- **Institutional Memory** — `logFinanceDecisionToMemory()` logs a real, immutable `'decision'` knowledge entry via `lifecycle.create()`. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

Every optional collaborator degrades to a documented no-op (`null`) when not injected, so the Finance Engine is fully usable — and fully tested — completely offline.

## Event bus

`FinanceEventMap` declares the 10 required events, each genuinely published by the real service that causes it:

`account.created`, `journal.posted`, `invoice.issued`, `invoice.paid`, `bill.created`, `bill.paid`, `budget.updated`, `tax.calculated`, `report.generated`, `period.closed`.

## Usage

```typescript
import { createFinanceRuntime } from '@lateen-os/finance-engine';

const finance = createFinanceRuntime();

const cash = await finance.chartOfAccounts.create('org-1', { code: '1000', name: 'Cash', accountType: 'asset' });
const revenue = await finance.chartOfAccounts.create('org-1', { code: '4000', name: 'Sales Revenue', accountType: 'revenue' });
await finance.chartOfAccounts.activate('org-1', cash.id);
await finance.chartOfAccounts.activate('org-1', revenue.id);

const entry = await finance.generalLedger.createJournalEntry('org-1', {
  entryDate: '2026-01-15',
  currency: 'USD',
  lines: [
    { accountId: cash.id, debit: '1000.00', credit: '0.00' },
    { accountId: revenue.id, debit: '0.00', credit: '1000.00' },
  ],
});
await finance.generalLedger.postJournalEntry('org-1', entry.id);

const balanceSheet = await finance.reports.generateBalanceSheet('org-1', '2026-01-31');
```

Wiring in the real CRM Engine / Sales Engine / Business DNA / Workflow Engine / Communication Hub / Analytics Engine / Institutional Memory collaborators:

```typescript
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';

const finance = createFinanceRuntime({
  crm: createCrmRuntime(),
  sales: createSalesRuntime(),
  businessDna: createBusinessDnaRuntime(),
  workflow: createWorkflowRuntime(),
  communicationHub: createCommunicationRuntime(),
  analytics: createAnalyticsRuntime(),
  institutionalMemory: createInstitutionalMemoryRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
finance.events.subscribe('invoice.paid', (payload) => {
  console.log(`Invoice ${payload.invoiceId} paid in full`);
});
```

## Structure

```
src/
├── shared/                     # IDs (reusing Business DNA's/Sales Engine's), decimal/date arithmetic, primitives
├── financial-organization/     # Fiscal years/periods, accounting settings, exchange rates, numbering sequences
├── account/                    # Chart of Accounts — 5 types, full lifecycle, hierarchy
├── journal-entry/              # General Ledger — balanced journal entries, posting, reversing, recurring
├── accounts-receivable/        # AR customers, invoices, credit notes, payments, aging, balances
├── accounts-payable/           # Vendors, bills, vendor credits, payments, aging, balances
├── treasury/                   # Cash/bank accounts, deposits, withdrawals, transfers, reconciliation
├── budget/                     # Budgets, revisions, actual-vs-budget (composed with the General Ledger)
├── tax/                        # Configurable tax rules and deterministic calculation
├── report/                     # Financial Reports, composed internally from every other module
├── relationship-management/    # CRM / Sales / Business DNA / Workflow / Communication Hub / Analytics / Institutional Memory integration
├── queries/                    # Real FinanceQueries read layer
├── events/                     # Typed FinanceEventMap
├── runtime.ts                  # createFinanceRuntime() composition root
└── index.ts
```

See [FINANCE_MODEL.md](./FINANCE_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId` / `CustomerId` / `SupplierId` / `EmployeeId` / `DepartmentId` / `ProjectId`; optional Relationship Layer collaborator
- `@lateen-os/sales-engine` — `SalesOpportunityId`; optional Relationship Layer collaborator
- `@lateen-os/crm-engine` — optional Relationship Layer collaborator
- `@lateen-os/workflow-engine` — optional Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator
- `@lateen-os/analytics-engine` — optional Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/finance-engine build
pnpm --filter @lateen-os/finance-engine typecheck
pnpm --filter @lateen-os/finance-engine test
pnpm --filter @lateen-os/finance-engine lint
```
