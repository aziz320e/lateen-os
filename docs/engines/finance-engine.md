---
title: Finance Engine
title_ar: محرك المالية
version: 1.0.0
status: active
package: "@lateen-os/finance-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - crm-engine
  - sales-engine
  - business-dna
  - workflow-engine
  - communication-hub
  - analytics-engine
  - institutional-memory
  - hr-engine
  - inventory-engine
---

# العربية

## محرك المالية — Finance Engine

### 1. الغرض

`@lateen-os/finance-engine` هو الطبقة المحاسبية الرسمية لـ Lateen OS: يملك المنظمة المالية (السنوات/الفترات المالية، إعدادات المحاسبة، أسعار الصرف، تسلسلات الترقيم)، دليل الحسابات، دفتر الأستاذ العام، الذمم المدينة، الذمم الدائنة، الخزينة، محرك الموازنة، محرك الضرائب، والتقارير المالية — وهو الحزمة التي تربط CRM Engine وSales Engine وBusiness DNA وWorkflow Engine وCommunication Hub وAnalytics Engine وInstitutional Memory نيابة عن نطاق المالية، حصرًا عبر واجهة كل حزمة العامة. حزمة من الجيل الثاني (Era 2) تتبع النمط الصارم بالكامل.

### 2. المسؤوليات

- المنظمة المالية: سنوات/فترات مالية، إعدادات محاسبة (عملة أساس، شهر بداية السنة المالية، دقة عشرية)، مزوّد أسعار صرف (افتراضي: جدول أسعار ثابت حتمي)، وتسلسلات ترقيم لكل نوع.
- دليل الحسابات: إنشاء/تحديث/تفعيل/تعطيل/أرشفة/استعادة عبر 5 أنواع حسابات (أصول، خصوم، حقوق ملكية، إيرادات، مصروفات)، هرمي عبر `parentAccountId`.
- دفتر الأستاذ العام: قيود يومية بخطوط مدين/دائن، تحقق من التوازن (لا يمكن حفظ قيد غير متوازن أبدًا)، ترحيل، قيود عكسية، وقوالب يومية متكررة.
- الذمم المدينة: عملاء، فواتير (`draft → issued → partially_paid → paid`، بالإضافة إلى `cancelled`)، إشعارات دائنة، مدفوعات، تقادم حتمي، وأرصدة عملاء.
- الذمم الدائنة: موردون، فواتير شراء (تعكس دورة حياة الذمم المدينة)، إشعارات دائنة للموردين، مدفوعات، تواريخ استحقاق، تقادم حتمي، وأرصدة موردين.
- الخزينة: حسابات نقدية/بنكية موحّدة، إيداعات، سحوبات، تحويلات، ومطابقة بنكية.
- محرك الموازنة: موازنات سنوية/قسمية/مشروعية، دورة حياة محمية، تاريخ مراجعات كامل، وتباين فعلي مقابل الموازنة محسوب مباشرة من قيود دفتر الأستاذ المرحّلة.
- محرك الضرائب: قواعد ضريبية قابلة للتهيئة وحتمية (VAT، GST، ضريبة مبيعات، معدل صفري، معفى).
- التقارير المالية: الميزانية العمومية، بيان الدخل، ميزان المراجعة، التدفق النقدي، تقرير دفتر الأستاذ العام، تقادم الذمم المدينة والدائنة.

### 3. خارج نطاق المسؤولية

- لا استدلال بنماذج لغة كبيرة في أي حساب (كل حساب — توازن القيود، إجماليات الفواتير، الضرائب، التقادم، تباين الموازنة، التقارير المالية — حساب حسابي ثابت على مبالغ عشرية نصية).
- لا واجهة مستخدم، لا REST، لا قاعدة بيانات فعلية (مستودعات في-الذاكرة فقط).
- لا تعديل مباشر لأي حزمة شقيقة — التكامل حصرًا عبر واجهاتها العامة.

### 4. وقت التشغيل العام

جذر التركيب **`createFinanceRuntime(deps = {})`** في `src/runtime.ts` يُرجع `FinanceRuntime`: `financialOrganization`، `chartOfAccounts`، `generalLedger`، `accountsReceivable`، `accountsPayable`، `treasury`، `budgets`، `tax`، `reports`، `relationships`، `queries`، و`events`. المستودعات تُنشأ داخل `runtime.ts` فقط ولا تظهر أبدًا في السطح المُرجَع.

### 5. الاستعلامات العامة

طبقة `FinanceQueries` حقيقية للقراءة فقط: `findAccounts`، `findJournalEntries`، `findInvoices`، `findBills`، `findBudgets`، `findTaxes`، `findReports`، `findBalances`، `searchFinance`.

### 6. الأحداث المكتوبة النوع

عشرة أحداث حقيقية في `FinanceDomainEvent`: `account.created`، `journal.posted`، `invoice.issued`، `invoice.paid`، `bill.created`، `bill.paid`، `budget.updated`، `tax.calculated`، `report.generated`، `period.closed`.

### 7. الاعتماديات

`@lateen-os/analytics-engine`، `@lateen-os/business-dna`، `@lateen-os/communication-hub`، `@lateen-os/crm-engine`، `@lateen-os/institutional-memory`، `@lateen-os/sales-engine`، `@lateen-os/shared-kernel`، `@lateen-os/workflow-engine`.

### 8. الحزم المعتمِدة

`@lateen-os/api-gateway`، `@lateen-os/hr-engine`، `@lateen-os/inventory-engine`، `@lateen-os/project-management-engine`.

### 9. نقاط التكامل

عبر `relationship-management/` (السطح الوحيد لهذا التكامل):

- **CRM Engine** — `getCustomerContext()` عبر `customers.get()` (`Pick<CrmRuntime, 'customers'>`).
- **Sales Engine** — `getOpportunityContext()` عبر `opportunities.get()` لبذر فاتورة ذمم مدينة من صفقة مربوحة (`Pick<SalesRuntime, 'opportunities'>`).
- **Business DNA** — `getBusinessProfileContext()` (`Pick<BusinessDnaRuntime, 'businessProfile'>`)، بالإضافة إلى إعادة استخدام بنيوية لـ `OrganizationId`/`CustomerId`/`SupplierId`/`EmployeeId`/`DepartmentId`/`ProjectId`.
- **Workflow Engine** — `raiseFinanceApprovalWorkflow()` يركّب `defineWorkflow()` + `startWorkflow()` حقيقيين (`Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`).
- **Communication Hub** — `notifyFinanceEvent()` عبر إشعار `'escalation'` حقيقي (`Pick<CommunicationRuntime, 'notifications'>`).
- **Analytics Engine** — `recordRevenueKpi()` عبر `kpis.recordRevenue()` (`Pick<AnalyticsRuntime, 'kpis'>`).
- **Institutional Memory** — `logFinanceDecisionToMemory()` يسجّل إدخال معرفة `'decision'` حقيقي عبر `lifecycle.create()` (`Pick<InstitutionalMemoryRuntime, 'lifecycle'>`).

كل تعاون اختياري ويتدهور إلى `null` عند عدم الحقن، مما يبقي المحرك قابلًا للاستخدام والاختبار دون اتصال بالكامل.

### 10. ملاحظات معمارية

الحزمة تلتزم حرفيًا بالنمط الصارم للجيل الثاني: `shared/` → `events/` → نطاقات فرعية (`financial-organization`، `account`، `journal-entry`، `accounts-receivable`، `accounts-payable`، `treasury`، `budget`، `tax`، `report`) → `relationship-management/` → `queries/` → `runtime.ts` → `index.ts`. لا تسرب مستودعات عبر السطح العام؛ `now()` قابل للحقن في كل مكان.

### 11. قرارات التصميم

- لا يمكن أبدًا حفظ قيد يومية غير متوازن — تحقق حتمي قبل أي حفظ.
- تباين الموازنة يُحسب مباشرة من قيود دفتر الأستاذ المرحّلة الحقيقية، لا من نسخة منفصلة من الأرقام.
- التقارير المالية تُركَّب داخليًا من محركات الحزمة الأخرى (لا إعادة تنفيذ لمنطق محاسبي).
- أنواع الضريبة "معدل صفري" و"معفى" مفروضة إلى معدل `0` عند الإنشاء.

### 12. نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات مالية يجب أن تستهلك `createFinanceRuntime()` العام (أو حقن نفسها كتعاون اختياري ضمن `RelationshipManagementDeps` لحزمة أخرى) — لا يجوز لها استيراد أي `repository.ts` داخلي، ولا تعديل هذه الحزمة لإضافة تكامل جديد؛ أي تعاون جديد يُضاف بالتزام مخصص لهذه الحزمة نفسها.

### 13. المحركات ذات الصلة

- [hr-engine](./hr-engine.md)
- [inventory-engine](./inventory-engine.md)
- [institutional-memory](./institutional-memory.md)
- [marketing-engine](./marketing-engine.md)

---

# English

## Finance Engine

### 1. Purpose

`@lateen-os/finance-engine` is the canonical accounting layer for Lateen OS: it owns Financial Organization (fiscal years/periods, accounting settings, exchange rates, numbering sequences), the Chart of Accounts, the General Ledger, Accounts Receivable, Accounts Payable, Treasury, the Budget Engine, the Tax Engine, and Financial Reports — and it is the package that integrates CRM Engine, Sales Engine, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory on behalf of the finance domain, exclusively through each package's public API. An Era-2 package following the rigid construction pattern in full.

### 2. Responsibilities

- Financial Organization: fiscal years/periods, accounting settings (base currency, fiscal-year start month, decimal precision), an exchange-rate provider (default: a deterministic static-rate table), and per-type numbering sequences.
- Chart of Accounts: create/update/activate/deactivate/archive/restore across 5 account types (asset, liability, equity, revenue, expense), hierarchical via `parentAccountId`.
- General Ledger: journal entries with debit/credit lines, balance validation (an unbalanced entry can never be persisted), posting, reversing entries, and recurring journal templates.
- Accounts Receivable: customers, invoices (`draft → issued → partially_paid → paid`, plus `cancelled`), credit notes, payments, deterministic aging, and customer balances.
- Accounts Payable: vendors, bills (mirroring AR's lifecycle), vendor credits, payments, due dates, deterministic aging, and vendor balances.
- Treasury: unified cash/bank accounts, deposits, withdrawals, transfers, and bank reconciliation.
- Budget Engine: annual/department/project budgets, a guarded lifecycle, full revision history, and actual-vs-budget variance computed directly from posted General Ledger entries.
- Tax Engine: configurable, deterministic tax rules (VAT, GST, Sales Tax, Zero-rated, Exempt).
- Financial Reports: Balance Sheet, Income Statement, Trial Balance, Cash Flow, General Ledger Report, AR/AP Aging.

### 3. Non-responsibilities

- No LLM/AI inference in any calculation (every calculation — journal balancing, invoice/bill totals, tax, aging, budget variance, financial reports — is fixed arithmetic over decimal-string amounts).
- No UI, no REST, no real database (in-memory repositories only).
- No direct modification of any sibling package — integration is exclusively through each sibling's public API.

### 4. Public Runtime

The composition root **`createFinanceRuntime(deps = {})`** in `src/runtime.ts` returns a `FinanceRuntime`: `financialOrganization`, `chartOfAccounts`, `generalLedger`, `accountsReceivable`, `accountsPayable`, `treasury`, `budgets`, `tax`, `reports`, `relationships`, `queries`, and `events`. Repositories are constructed only inside `runtime.ts` and never appear on the returned surface.

### 5. Public Queries

A real read-only `FinanceQueries` layer: `findAccounts`, `findJournalEntries`, `findInvoices`, `findBills`, `findBudgets`, `findTaxes`, `findReports`, `findBalances`, `searchFinance`.

### 6. Typed Events

Ten real events in `FinanceDomainEvent`: `account.created`, `journal.posted`, `invoice.issued`, `invoice.paid`, `bill.created`, `bill.paid`, `budget.updated`, `tax.calculated`, `report.generated`, `period.closed`.

### 7. Dependencies

`@lateen-os/analytics-engine`, `@lateen-os/business-dna`, `@lateen-os/communication-hub`, `@lateen-os/crm-engine`, `@lateen-os/institutional-memory`, `@lateen-os/sales-engine`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine`.

### 8. Dependents

`@lateen-os/api-gateway`, `@lateen-os/hr-engine`, `@lateen-os/inventory-engine`, `@lateen-os/project-management-engine`.

### 9. Integration Points

Through `relationship-management/` (the sole surface for this integration):

- **CRM Engine** — `getCustomerContext()` via `customers.get()` (`Pick<CrmRuntime, 'customers'>`).
- **Sales Engine** — `getOpportunityContext()` via `opportunities.get()`, used to seed an AR invoice from a won deal (`Pick<SalesRuntime, 'opportunities'>`).
- **Business DNA** — `getBusinessProfileContext()` (`Pick<BusinessDnaRuntime, 'businessProfile'>`), plus structural reuse of `OrganizationId`/`CustomerId`/`SupplierId`/`EmployeeId`/`DepartmentId`/`ProjectId`.
- **Workflow Engine** — `raiseFinanceApprovalWorkflow()` composes real `defineWorkflow()` + `startWorkflow()` (`Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`).
- **Communication Hub** — `notifyFinanceEvent()` via a real `'escalation'` notification (`Pick<CommunicationRuntime, 'notifications'>`).
- **Analytics Engine** — `recordRevenueKpi()` via `kpis.recordRevenue()` (`Pick<AnalyticsRuntime, 'kpis'>`).
- **Institutional Memory** — `logFinanceDecisionToMemory()` logs a real `'decision'` knowledge entry via `lifecycle.create()` (`Pick<InstitutionalMemoryRuntime, 'lifecycle'>`).

Every collaborator is optional and degrades to `null` when not injected, keeping the engine fully usable and testable offline.

### 10. Architecture Notes

The package follows the rigid Era-2 pattern verbatim: `shared/` → `events/` → subdomains (`financial-organization`, `account`, `journal-entry`, `accounts-receivable`, `accounts-payable`, `treasury`, `budget`, `tax`, `report`) → `relationship-management/` → `queries/` → `runtime.ts` → `index.ts`. No repository leaks through the public surface; `now()` is injectable everywhere.

### 11. Design Decisions

- An unbalanced journal entry can never be persisted — deterministic validation before any save.
- Budget variance is computed directly from real posted General Ledger entries, never from a separate copy of the numbers.
- Financial reports are composed internally from the package's other engines (no re-implementation of accounting logic).
- The "zero-rated" and "exempt" tax types are enforced to a `0` rate at creation.

### 12. Extension Points

Any future package needing financial data should consume the public `createFinanceRuntime()` (or inject itself as an optional collaborator within another package's `RelationshipManagementDeps`) — it must never import an internal `repository.ts`, and must never modify this package to add a new integration; any new collaborator is added in this package's own dedicated commit.

### 13. Related Engines

- [hr-engine](./hr-engine.md)
- [inventory-engine](./inventory-engine.md)
- [institutional-memory](./institutional-memory.md)
- [marketing-engine](./marketing-engine.md)
