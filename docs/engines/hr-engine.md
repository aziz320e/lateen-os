---
title: HR Engine
title_ar: محرك الموارد البشرية
version: 1.0.0
status: active
package: "@lateen-os/hr-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - finance-engine
  - ai-workforce
  - business-dna
  - workflow-engine
  - communication-hub
  - analytics-engine
  - institutional-memory
---

# العربية

## محرك الموارد البشرية — HR Engine

### 1. الغرض

`@lateen-os/hr-engine` يملك هيكل المنظمة (الأقسام/وحدات الأعمال/الأقسام الفرعية)، إدارة المناصب، إدارة الموظفين، محرك الحضور، إدارة الإجازات، إعداد الرواتب، إدارة الأداء، ومحرك التدريب لـ Lateen OS، ويربط Finance Engine وAI Workforce وBusiness DNA وWorkflow Engine وCommunication Hub وAnalytics Engine وInstitutional Memory نيابة عن نطاق الموارد البشرية. حزمة من الجيل الثاني تتبع النمط الصارم بالكامل.

### 2. المسؤوليات

- هيكل المنظمة: أقسام/وحدات أعمال/أقسام فرعية بدورة حياة محمية.
- إدارة المناصب: إنشاء/تحديث بدورة حياة محمية وحساب الشواغر (Vacancy).
- إدارة الموظفين: تعيين، نقل، ترقية، إنهاء خدمة، إعادة تعيين — مُركّبة مع إدارة المناصب لحساب عدد الموظفين.
- محرك الحضور: تسجيل دخول/خروج، حساب مدة الجلسة، ساعات إضافية، تأخير، تسجيل غياب، وتسجيل عطلات.
- إدارة الإجازات: طلب إجازة، أرصدة إجازات، دورة حياة محمية، حساب الأيام المطلوبة.
- إعداد الرواتب: مُركّب مع الموظفين/الحضور/الإجازات — بند راتب، ساعات إضافية بمُضاعِف ثابت، أيام عمل شهرية قياسية.
- إدارة الأداء: فترات مراجعة، أهداف، تقييمات، حساب تقييم إجمالي وتوصية ترقية بعتبة ثابتة.
- محرك التدريب: دورات، شهادات (مع حساب انتهاء صلاحية)، مهارات موظفين، إتمام تدريب.

### 3. خارج نطاق المسؤولية

- لا استدلال بنماذج لغة كبيرة.
- لا ترحيل فعلي للرواتب أو دفع فعلي — "إعداد" فقط، لا محاسبة (الحزمة لا تُرحّل قيود دفتر أستاذ بنفسها؛ أي ترحيل محاسبي فعلي يمر عبر Finance Engine العام).
- لا تعديل مباشر لأي حزمة شقيقة.

### 4. وقت التشغيل العام

جذر التركيب **`createHrRuntime(deps = {})`** في `src/runtime.ts` يُرجع `HrRuntime`: `organizationStructure`، `positions`، `employees`، `attendance`، `leave`، `payroll`، `performance`، `training`، `relationships`، `queries`، و`events`.

### 5. الاستعلامات العامة

طبقة `HrQueries`: `findEmployees`، `findDepartments`، `findAttendance`، `findLeaveRequests`، `findPayrollData`، `findPerformance`، `findTraining`، `searchHr`.

### 6. الأحداث المكتوبة النوع

عشرة أحداث حقيقية في `HrDomainEvent`: `employee.hired`، `employee.transferred`، `employee.promoted`، `employee.terminated`، `attendance.recorded`، `leave.requested`، `leave.approved`، `performance.completed`، `training.completed`، `payroll.prepared`.

### 7. الاعتماديات

`@lateen-os/ai-workforce`، `@lateen-os/analytics-engine`، `@lateen-os/business-dna`، `@lateen-os/communication-hub`، `@lateen-os/finance-engine`، `@lateen-os/institutional-memory`، `@lateen-os/shared-kernel`، `@lateen-os/workflow-engine`.

### 8. الحزم المعتمِدة

`@lateen-os/api-gateway`، `@lateen-os/project-management-engine`.

### 9. نقاط التكامل

عبر `relationship-management/`:

- **Business DNA** — `getBusinessProfileContext()` (`Pick<BusinessDnaRuntime, 'businessProfile'>`).
- **Finance Engine** — `recordPayrollTaxWithholding()` يستدعي `tax.calculateAndRecord()` الحقيقي من Finance Engine — إعداد فقط، لا ترحيل محاسبي من طرف HR Engine نفسه (`Pick<FinanceRuntime, 'tax'>`).
- **AI Workforce** — `getAiWorkforceUtilizationContext()` يحسب نسبة استخدام حقيقية (عمّال نشطون/مشغولون) عبر `findWorkers()` لعرض قوة عمل مدمجة بشرية + ذكاء اصطناعي (`Pick<WorkforceQueries, 'findWorkers'>`).
- **Workflow Engine** — `raiseHrApprovalWorkflow()` يركّب `defineWorkflow()` + `startWorkflow()` حقيقيين.
- **Communication Hub** — `notifyHrEvent()` عبر إشعار `'escalation'` حقيقي.
- **Analytics Engine** — `recordWorkforceUtilizationKpi()` عبر `kpis.recordWorkforceUtilization()`.
- **Institutional Memory** — `logHrDecisionToMemory()` يسجّل إدخال معرفة `'decision'` حقيقي بفئة `'people'`.

كل تعاون اختياري ويتدهور إلى `null` عند عدم الحقن.

### 10. ملاحظات معمارية

تلتزم الحزمة بالكامل بالنمط الصارم للجيل الثاني. تكاملها مع AI Workforce (`Pick<WorkforceQueries, 'findAgent'... 'findWorkers'>`) هو نمط موثّق ومكرر عبر حزم الجيل الثاني التي تتكامل مع حزم لا تملك نوع Runtime موحّد.

### 11. قرارات التصميم

- توصية الترقية محكومة بعتبة تقييم ثابتة (`PROMOTION_RATING_THRESHOLD`) وليست استدلالًا.
- الرواتب الإضافية محسوبة بمُضاعِف ثابت (`OVERTIME_MULTIPLIER`) وساعات شهرية قياسية ثابتة (`STANDARD_MONTHLY_HOURS`).
- استخدام قوة العمل الذكاء الاصطناعي محسوب كنسبة حتمية (`busyCount / activeCount`)، لا تقدير.

### 12. نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات موارد بشرية يجب أن تستهلك `createHrRuntime()` العام فقط — لا وصول مباشر لأي `repository.ts` داخلي، ولا تعديل هذه الحزمة لإضافة تكامل جديد.

### 13. المحركات ذات الصلة

- [finance-engine](./finance-engine.md)
- [inventory-engine](./inventory-engine.md)
- [institutional-memory](./institutional-memory.md)

---

# English

## HR Engine

### 1. Purpose

`@lateen-os/hr-engine` owns organization structure (departments/business units/divisions), position management, employee management, the attendance engine, leave management, payroll preparation, performance management, and the training engine for Lateen OS, and integrates Finance Engine, AI Workforce, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory on behalf of the HR domain. An Era-2 package following the rigid construction pattern in full.

### 2. Responsibilities

- Organization Structure: departments/business units/divisions with a guarded lifecycle.
- Position Management: create/update with a guarded lifecycle and vacancy computation.
- Employee Management: hire, transfer, promote, terminate, rehire — composed with Position Management for headcount.
- Attendance Engine: clock-in/clock-out, session-duration computation, overtime, lateness, absence recording, and holiday registration.
- Leave Management: leave requests, leave balances, a guarded lifecycle, days-requested computation.
- Payroll Preparation: composed with Employee/Attendance/Leave — payroll line items, overtime at a fixed multiplier, standard monthly working days.
- Performance Management: review periods, objectives, evaluations, overall-rating computation, and a fixed-threshold promotion recommendation.
- Training Engine: courses, certifications (with expiry computation), employee skills, training completion.

### 3. Non-responsibilities

- No LLM/AI inference.
- No actual payroll disbursement or posting — "preparation" only, not accounting (the package does not post general-ledger entries itself; any real accounting posting flows through Finance Engine's own public API).
- No direct modification of any sibling package.

### 4. Public Runtime

The composition root **`createHrRuntime(deps = {})`** in `src/runtime.ts` returns an `HrRuntime`: `organizationStructure`, `positions`, `employees`, `attendance`, `leave`, `payroll`, `performance`, `training`, `relationships`, `queries`, and `events`.

### 5. Public Queries

An `HrQueries` layer: `findEmployees`, `findDepartments`, `findAttendance`, `findLeaveRequests`, `findPayrollData`, `findPerformance`, `findTraining`, `searchHr`.

### 6. Typed Events

Ten real events in `HrDomainEvent`: `employee.hired`, `employee.transferred`, `employee.promoted`, `employee.terminated`, `attendance.recorded`, `leave.requested`, `leave.approved`, `performance.completed`, `training.completed`, `payroll.prepared`.

### 7. Dependencies

`@lateen-os/ai-workforce`, `@lateen-os/analytics-engine`, `@lateen-os/business-dna`, `@lateen-os/communication-hub`, `@lateen-os/finance-engine`, `@lateen-os/institutional-memory`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine`.

### 8. Dependents

`@lateen-os/api-gateway`, `@lateen-os/project-management-engine`.

### 9. Integration Points

Through `relationship-management/`:

- **Business DNA** — `getBusinessProfileContext()` (`Pick<BusinessDnaRuntime, 'businessProfile'>`).
- **Finance Engine** — `recordPayrollTaxWithholding()` calls Finance Engine's real `tax.calculateAndRecord()` — preparation only, no accounting posting performed by HR Engine itself (`Pick<FinanceRuntime, 'tax'>`).
- **AI Workforce** — `getAiWorkforceUtilizationContext()` computes real utilization (active/busy workers) via `findWorkers()` for a combined human + AI workforce view (`Pick<WorkforceQueries, 'findWorkers'>`).
- **Workflow Engine** — `raiseHrApprovalWorkflow()` composes real `defineWorkflow()` + `startWorkflow()`.
- **Communication Hub** — `notifyHrEvent()` via a real `'escalation'` notification.
- **Analytics Engine** — `recordWorkforceUtilizationKpi()` via `kpis.recordWorkforceUtilization()`.
- **Institutional Memory** — `logHrDecisionToMemory()` logs a real `'decision'` knowledge entry with category `'people'`.

Every collaborator is optional and degrades to `null` when not injected.

### 10. Architecture Notes

The package follows the rigid Era-2 pattern in full. Its AI Workforce integration (`Pick<WorkforceQueries, 'findWorkers'>`) is a documented, repeated pattern across Era-2 packages that integrate with siblings lacking a single unified Runtime type.

### 11. Design Decisions

- The promotion recommendation is governed by a fixed rating threshold (`PROMOTION_RATING_THRESHOLD`), not inference.
- Overtime pay is computed with a fixed multiplier (`OVERTIME_MULTIPLIER`) and fixed standard monthly hours (`STANDARD_MONTHLY_HOURS`).
- AI workforce utilization is a deterministic ratio (`busyCount / activeCount`), not an estimate.

### 12. Extension Points

Any future package needing HR data should consume the public `createHrRuntime()` only — no direct access to any internal `repository.ts`, and no modification of this package to add a new integration.

### 13. Related Engines

- [finance-engine](./finance-engine.md)
- [inventory-engine](./inventory-engine.md)
- [institutional-memory](./institutional-memory.md)
