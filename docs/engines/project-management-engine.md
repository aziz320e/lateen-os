---
title: Project Management Engine
title_ar: محرك إدارة المشاريع
version: 1.0.0
status: active
package: "@lateen-os/project-management-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - crm-engine
  - hr-engine
  - finance-engine
  - inventory-engine
  - workflow-engine
  - communication-hub
  - analytics-engine
  - business-dna
  - institutional-memory
---

# العربية

## الغرض

`@lateen-os/project-management-engine` هو طبقة تسليم المشاريع القانونية لنظام Lateen OS: يملك بنية المشروع (محافظ، برامج، مشاريع، مراحل، معالم — دورة حياة كاملة)، إدارة المهام (مهام وفرعياتها، اعتماديات، أولويات، تسميات، تواريخ استحقاق)، تخطيط الموارد (تعيين موظفين وعمال ذكاء اصطناعي، عبء العمل، السعة، الاستغلال)، محرك الجدولة (مسار حرج حتمي CPM — بدون أي تحسين ذكاء اصطناعي)، تتبع الوقت (سجلات عمل، ساعات فعلية مقابل مقدّرة، وقت إضافي)، تتبع الميزانية (مخطط/فعلي/متبقٍ/انحراف — أبدًا محاسبة بحد ذاتها)، تخطيط المواد (كميات مطلوبة/محجوزة ونواقص — أبدًا إدارة مخزون بحد ذاتها)، مخاطر المشروع (سجل مخاطر حتمي باحتمال × أثر)، والتسليمات (قبول، موافقات، إكمال) — وهو الحزمة التي تُكامل CRM Engine وHR Engine وFinance Engine وInventory Engine وWorkflow Engine وCommunication Hub وAnalytics Engine وBusiness DNA وInstitutional Memory نيابة عن نطاق المشاريع.

## المسؤوليات

- بنية المشروع: محافظ، برامج، مشاريع، مراحل، معالم — هرمية؛ دورة حياة: إنشاء/تحديث/أرشفة/استعادة/بدء/إيقاف مؤقت/استئناف/إكمال/إلغاء.
- إدارة المهام: مهام وفرعيات باعتماديات محروسة من الحلقات (cycle-guarded)، أولويات، تسميات، تواريخ استحقاق؛ دورة حياة: planned/ready/in_progress/blocked/completed/cancelled.
- تخطيط الموارد: تعيين موظف/عامل ذكاء اصطناعي، عبء عمل/سعة/تخصيص/استغلال حتمي — يُركّب مع HR Engine (ومن خلالها AI Workforce) دون تكرار منطق القوى العاملة.
- محرك الجدولة: مسار حرج حتمي (CPM) — بداية/نهاية مبكرة ومتأخرة، الركود (slack)، المسار الحرج، لقطات جدول أساسية. **بدون أي تحسين ذكاء اصطناعي**.
- تتبع الوقت: سجلات عمل غير قابلة للتغيير، تجميع ساعات فعلية، استغلال مقابل الساعات المقدّرة، علم وقت إضافي.
- تتبع الميزانية: ميزانية مخططة، تكلفة فعلية، ميزانية متبقية، انحراف تكلفة — أرقام هذه الحزمة الخاصة؛ يُركّب مع Finance Engine لعملية ترحيل دفتر أستاذ اختيارية واحدة فقط. **لا يُنفّذ محاسبة أبدًا**.
- تخطيط المواد: محاسبة كميات مطلوبة/محجوزة واكتشاف نواقص حتمي؛ يُركّب مع Inventory Engine لحجز المخزون الفعلي. **لا يدير المخزون مباشرة**.
- مخاطر المشروع: سجل مخاطر بتسجيل احتمال × أثر حتمي وتصنيف، تتبع تخفيف، ودورة حياة حالة محروسة.
- التسليمات: موافقات قبول ودورة حياة محروسة draft/in_review/accepted/rejected/completed.
- طبقة استعلامات (`ProjectQueries`) وناقل أحداث مكتوب النوع.

## خارج نطاق المسؤولية

- لا يُنفّذ محاسبة — يُركّب فقط مع Finance Engine لترحيل قيد يومية واحد اختياري.
- لا يدير المخزون مباشرة — يُركّب فقط مع Inventory Engine لحجز مخزون حقيقي.
- لا يعتمد على `@lateen-os/ai-workforce` مباشرة أبدًا؛ سياق AI Workforce يمر حصرًا عبر قدرة HR Engine الخاصة المُدمجة مسبقًا.
- لا تحسين ذكاء اصطناعي في محرك الجدولة — مسار حرج حتمي بحت.

## وقت التشغيل العام

جذر التركيب هو `createProjectRuntime(deps: ProjectRuntimeDeps = {})` في `src/runtime.ts`. المستودعات الإحدى عشرة (portfolio، program، project، phase، milestone، task، assignment، schedule، budget، risk، deliverable) تُبنى داخل `runtime.ts` فقط ولا تظهر أبدًا على السطح العام المُعاد.

## الاستعلامات العامة

طبقة `queries/` حقيقية (`ProjectQueries`) تحتوي: `findProjects`، `findTasks`، `findMilestones`، `findAssignments`، `findSchedules`، `findBudgets`، `findRisks`، `findDeliverables`، `searchProjects`.

## الأحداث المكتوبة النوع

ناقل أحداث حقيقي (`ProjectEventMap`، 10 أحداث)، كل حدث منشور فعليًا من قِبل الخدمة الحقيقية التي تُسببه: `project.created`، `project.started`، `project.completed`، `project.cancelled`، `task.created`، `task.completed`، `resource.assigned`، `budget.updated`، `risk.created`، `deliverable.accepted`.

## الاعتماديات

حسب `package.json`: `@lateen-os/shared-kernel`، `@lateen-os/business-dna` (`OrganizationId`؛ متعاون اختياري في طبقة العلاقات)، `@lateen-os/crm-engine`، `@lateen-os/hr-engine` (المسار الوحيد لسياق AI Workforce)، `@lateen-os/finance-engine` (قيود تكلفة مشروع فقط)، `@lateen-os/inventory-engine` (حجز مواد فقط)، `@lateen-os/workflow-engine`، `@lateen-os/communication-hub`، `@lateen-os/analytics-engine`، `@lateen-os/institutional-memory`. بالإضافة إلى `@lateen-os/ai-workforce` كاعتمادية تطوير فقط (devDependency)، تُستخدم حصرًا في `tests/integration.test.ts` لإثبات صحة تمرير HR Engine الفعلي — لا تُستورد أبدًا من `src/`.

## الحزم المعتمِدة

بحثًا فعليًا في كل `package.json`، تعتمد عليها: `@lateen-os/api-gateway`، `@lateen-os/customer-success-engine`، `@lateen-os/document-management-engine`.

## نقاط التكامل

مجلد `relationship-management/` حقيقي يُكامل مع تسع حزم مطلوبة:

- **CRM Engine** — `getCustomerContext()` تجلب عميل CRM حقيقيًا عبر `customers.get()`. اختياري — محقون كـ `Pick<CrmRuntime, 'customers'>`.
- **HR Engine** — `getEmployeeContext()` تجلب موظف HR حقيقيًا عبر `employees.get()`. `getAiWorkforceUtilizationContext()` تُركّب بيانات AI Workforce **فقط عبر قدرة HR Engine المُدمجة مسبقًا** (`relationships.getAiWorkforceUtilizationContext()`) — هذه الحزمة لا تعتمد أبدًا على `@lateen-os/ai-workforce` مباشرة. اختياري — محقون كـ `Pick<HrRuntime, 'employees' | 'relationships'>`.
- **Finance Engine** — `recordProjectCostEntry()` تُركّب قيد يومية Finance Engine حقيقيًا ومُرحّلًا (`generalLedger.createJournalEntry()` + `postJournalEntry()`). هذه النقطة الوحيدة التي تلمس فيها هذه الحزمة المحاسبة، ولا تُنفّذها أبدًا بنفسها. اختياري — محقون كـ `Pick<FinanceRuntime, 'generalLedger'>`.
- **Inventory Engine** — `reserveProjectMaterial()` تُركّب حجز مخزون Inventory Engine حقيقيًا (`movements.reserve()`). اختياري — محقون كـ `Pick<InventoryRuntime, 'movements'>`.
- **Workflow Engine** — `raiseProjectApprovalWorkflow()` تُركّب `defineWorkflow()` + `startWorkflow()` حقيقيتين لبدء سير عمل موافقة مشروع حقيقي. اختياري — محقون كـ `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.
- **Communication Hub** — `notifyProjectEvent()` تُنشئ وترسل إشعار `'escalation'` حقيقيًا. اختياري — محقون كـ `Pick<CommunicationRuntime, 'notifications'>`.
- **Analytics Engine** — `recordProjectMetric()` تُسجّل لقطة مقياس gauge حقيقية عبر `metrics.recordGauge()`. اختياري — محقون كـ `Pick<AnalyticsRuntime, 'metrics'>`.
- **Business DNA** — `getBusinessProfileContext()` تجلب ملف عمل Business DNA حقيقيًا عبر `businessProfile.get()`. اختياري — محقون كـ `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Institutional Memory** — `logProjectDecisionToMemory()` تُسجّل مُدخل معرفة `'decision'` حقيقيًا وغير قابل للتغيير عبر `lifecycle.create()`. اختياري — محقون كـ `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

كل متعاون اختياري يتدهور إلى قيمة فارغة موثقة (`null`) عند عدم حقنه، فتبقى الحزمة قابلة للاستخدام والاختبار الكامل دون اتصال.

## ملاحظات معمارية

- لا اعتماد مباشر على `@lateen-os/ai-workforce` رغم استهلاك بيانات القوى العاملة الرقمية — يمر ذلك حصرًا عبر HR Engine المُدمجة مسبقًا، لتجنب ازدواجية منطق القوى العاملة.
- الميزانية والمواد أرقام هذه الحزمة الخاصة، لا تُنفّذ محاسبة أو إدارة مخزون فعلية — تُركّب فقط مع الحزمتين المختصتين عبر نقطة تكامل اختيارية واحدة محددة لكل منهما.
- محرك الجدولة حتمي بالكامل (CPM) — بدون أي نموذج تحسين ذكاء اصطناعي.

## قرارات التصميم

- كل دالة `create*` تقبل `now: () => string` قابلة للحقن، بقيمة افتراضية `nowIso` حتمية.
- كل متعاون في `relationship-management` مُكتوب كـ `Pick<SiblingRuntime, '...'>` ضيق النطاق.
- أسماء الأحداث تتبع اصطلاح `noun.verb` بصيغة الماضي.
- كل الحسابات (المسار الحرج/الركود، تسجيل المخاطر، التخصيص/السعة، انحراف التكلفة، اكتشاف الوقت الإضافي) حساب ثابت فوق مبالغ سلسلة عشرية ورسوم بيانية عدّ أيام — وليست استدلال نموذج.

## نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات مشروع يجب أن تستهلك `createProjectRuntime()` العام فقط. أي حزمة جديدة تريد أن تُصبح متعاونًا تنضم كمتعاون اختياري جديد في `ProjectRuntimeDeps` عبر التزام (commit) مخصص لهذه الحزمة نفسها — لا يجوز أبدًا تعديل الحزمة الشقيقة لخدمة هذا التكامل، ولا يجوز لأي حزمة جديدة الاعتماد مباشرة على `ai-workforce` لتكرار ما تُقدّمه HR Engine بالفعل.

## المحركات ذات الصلة

- [CRM Engine](./crm-engine.md)
- [HR Engine](./hr-engine.md)
- [Finance Engine](./finance-engine.md)
- [Inventory Engine](./inventory-engine.md)
- [Workflow Engine](./workflow-engine.md)
- [Communication Hub](./communication-hub.md)
- [Analytics Engine](./analytics-engine.md)
- [Business DNA](./business-dna.md)
- [Institutional Memory](./institutional-memory.md)

---

# English

## Purpose

`@lateen-os/project-management-engine` is the canonical project-delivery layer for Lateen OS: it owns Project Structure (portfolios, programs, projects, phases, milestones — full lifecycle), Task Management (tasks, subtasks, dependencies, priorities, labels, due dates), Resource Planning (employee and AI-worker assignment, workload, capacity, utilization), the Scheduling Engine (deterministic Critical Path Method — no AI optimization), Time Tracking (work logs, actual vs. estimated hours, overtime), Budget Tracking (planned/actual/remaining/variance — never accounting itself), Material Planning (required/reserved quantities and shortages — never inventory management itself), Project Risks (a deterministic probability × impact risk register), and Deliverables (acceptance, approvals, completion) — and is the package that integrates CRM Engine, HR Engine, Finance Engine, Inventory Engine, Workflow Engine, Communication Hub, Analytics Engine, Business DNA, and Institutional Memory on behalf of the project domain.

## Responsibilities

- Project Structure: portfolios, programs, projects, phases, milestones — hierarchical; lifecycle: create/update/archive/restore/start/pause/resume/complete/cancel.
- Task Management: tasks and subtasks with cycle-guarded dependencies, priorities, labels, due dates; lifecycle: planned/ready/in_progress/blocked/completed/cancelled.
- Resource Planning: employee and AI-worker assignment, deterministic workload/capacity/allocation/utilization — composes with HR Engine (and, through it, AI Workforce) without duplicating workforce logic.
- Scheduling Engine: deterministic Critical Path Method — early/late start & finish, slack, critical path, baseline schedule snapshots. **No AI optimization**.
- Time Tracking: immutable work logs, actual-hours aggregation, utilization against estimated hours, overtime flag.
- Budget Tracking: planned budget, actual cost, remaining budget, cost variance — this package's own numbers; composes with Finance Engine for one opt-in ledger posting. **Never implements accounting**.
- Material Planning: required/reserved quantity bookkeeping and deterministic shortage detection; composes with Inventory Engine for real stock reservation. **Does not manage inventory directly**.
- Project Risks: a risk register with deterministic probability × impact scoring and banding, mitigation tracking, and a guarded status lifecycle.
- Deliverables: acceptance approvals and a guarded draft/in_review/accepted/rejected/completed lifecycle.
- A `ProjectQueries` query layer and a typed event bus.

## Non-responsibilities

- Never implements accounting — composes only with Finance Engine for one optional journal-entry posting.
- Never manages inventory directly — composes only with Inventory Engine for real stock reservation.
- Never depends on `@lateen-os/ai-workforce` directly; AI Workforce context flows exclusively through HR Engine's own already-integrated capability.
- No AI optimization in the Scheduling Engine — purely deterministic critical path.

## Public Runtime

The composition root is `createProjectRuntime(deps: ProjectRuntimeDeps = {})` in `src/runtime.ts`. All eleven repositories (portfolio, program, project, phase, milestone, task, assignment, schedule, budget, risk, deliverable) are constructed only inside `runtime.ts` and never appear on the returned surface.

## Public Queries

A real `queries/` layer (`ProjectQueries`) exposes: `findProjects`, `findTasks`, `findMilestones`, `findAssignments`, `findSchedules`, `findBudgets`, `findRisks`, `findDeliverables`, `searchProjects`.

## Typed Events

A real event bus (`ProjectEventMap`, 10 events), each genuinely published by the real service that causes it: `project.created`, `project.started`, `project.completed`, `project.cancelled`, `task.created`, `task.completed`, `resource.assigned`, `budget.updated`, `risk.created`, `deliverable.accepted`.

## Dependencies

Per `package.json`: `@lateen-os/shared-kernel`, `@lateen-os/business-dna` (`OrganizationId`; optional Relationship Layer collaborator), `@lateen-os/crm-engine`, `@lateen-os/hr-engine` (the sole path to AI Workforce context), `@lateen-os/finance-engine` (project cost journal entries only), `@lateen-os/inventory-engine` (material reservation only), `@lateen-os/workflow-engine`, `@lateen-os/communication-hub`, `@lateen-os/analytics-engine`, `@lateen-os/institutional-memory`. Plus `@lateen-os/ai-workforce` as a **devDependency only**, used exclusively by `tests/integration.test.ts` to prove the HR Engine passthrough is genuine — never imported from `src/`.

## Dependents

Verified by grepping every `package.json`: `@lateen-os/api-gateway`, `@lateen-os/customer-success-engine`, and `@lateen-os/document-management-engine` depend on it.

## Integration Points

A real `relationship-management/` folder integrates 9 required packages:

- **CRM Engine** — `getCustomerContext()` fetches a real CRM Engine customer via `customers.get()`. Optional — injected as `Pick<CrmRuntime, 'customers'>`.
- **HR Engine** — `getEmployeeContext()` fetches a real HR Engine employee via `employees.get()`. `getAiWorkforceUtilizationContext()` composes AI Workforce data **only through HR Engine's own already-integrated capability** (`relationships.getAiWorkforceUtilizationContext()`) — this package never depends on `@lateen-os/ai-workforce` directly. Optional — injected as `Pick<HrRuntime, 'employees' | 'relationships'>`.
- **Finance Engine** — `recordProjectCostEntry()` composes a real, posted Finance Engine journal entry (`generalLedger.createJournalEntry()` + `postJournalEntry()`). This is the only place this package touches accounting, and it never implements the accounting itself. Optional — injected as `Pick<FinanceRuntime, 'generalLedger'>`.
- **Inventory Engine** — `reserveProjectMaterial()` composes a real Inventory Engine stock reservation (`movements.reserve()`). Optional — injected as `Pick<InventoryRuntime, 'movements'>`.
- **Workflow Engine** — `raiseProjectApprovalWorkflow()` composes real `defineWorkflow()` + `startWorkflow()` to start a genuine project-approval workflow instance. Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.
- **Communication Hub** — `notifyProjectEvent()` creates and sends a real `'escalation'` notification. Optional — injected as `Pick<CommunicationRuntime, 'notifications'>`.
- **Analytics Engine** — `recordProjectMetric()` records a real gauge metric snapshot via `metrics.recordGauge()`. Optional — injected as `Pick<AnalyticsRuntime, 'metrics'>`.
- **Business DNA** — `getBusinessProfileContext()` fetches the real Business DNA business profile via `businessProfile.get()`. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Institutional Memory** — `logProjectDecisionToMemory()` logs a real, immutable `'decision'` knowledge entry via `lifecycle.create()`. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

Every optional collaborator degrades to a documented no-op (`null`) when not injected, so the package stays fully usable — and fully tested — completely offline.

## Architecture Notes

- No direct dependency on `@lateen-os/ai-workforce` despite consuming digital-workforce data — that flows exclusively through the already-integrated HR Engine, avoiding duplicated workforce logic.
- Budget and material figures are this package's own numbers; it never performs real accounting or inventory management — it composes with exactly one optional integration point in each of the two specialist engines.
- The Scheduling Engine is fully deterministic (CPM) — no AI optimization model of any kind.

## Design Decisions

- Every `create*` factory accepts an injectable `now: () => string`, defaulting to a deterministic `nowIso`.
- Every `relationship-management` collaborator is typed as a narrow `Pick<SiblingRuntime, '...'>` slice.
- Event names follow the `noun.verb` past-tense convention.
- Every calculation (critical path/slack, risk scoring, allocation/capacity, cost variance, overtime detection) is fixed arithmetic over decimal-string amounts and day-count graphs, not model inference.

## Extension Points

Any future package needing project data should consume only the public `createProjectRuntime()`. Any new package wanting to become a collaborator joins as a new optional collaborator in `ProjectRuntimeDeps` through a dedicated commit scoped to this package — the sibling package must never be modified to accommodate this integration, and no new package should depend directly on `ai-workforce` to duplicate what HR Engine already provides.

## Related Engines

- [CRM Engine](./crm-engine.md)
- [HR Engine](./hr-engine.md)
- [Finance Engine](./finance-engine.md)
- [Inventory Engine](./inventory-engine.md)
- [Workflow Engine](./workflow-engine.md)
- [Communication Hub](./communication-hub.md)
- [Analytics Engine](./analytics-engine.md)
- [Business DNA](./business-dna.md)
- [Institutional Memory](./institutional-memory.md)
