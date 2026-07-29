---
title: Engineering Guide
title_ar: دليل الهندسة
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../handbook/03_CONSTITUTION.md
  - ../handbook/00_MASTER_PLAN.md
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/PLATFORM_CERTIFICATION.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/DEPENDENCY_AUDIT.md
  - ../certification/RUNTIME_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
  - ../certification/SECURITY_AUDIT.md
  - ../certification/TESTING_AUDIT.md
  - ../certification/KNOWN_TECHNICAL_DEBT.md
related_engines:
  - all
related_commits:
  - "1-35"
---

# العربية

## دليل الهندسة — Lateen OS

> هذا الدليل **لا يُنشئ** قواعد جديدة. كل قاعدة هنا مأخوذة حرفيًا من [`03_CONSTITUTION.md`](../handbook/03_CONSTITUTION.md)، وموسّعة إلى إرشاد عملي بأمثلة حقيقية مأخوذة من الكود الفعلي في `packages/*`، ومُطابقة على تقارير التصديق في `docs/certification/*.md` (39 حزمة، مُصحَّحة من "38" في المسودات الأولى). عندما يختلف السلوك الفعلي للكود عن نص الدستور، يُذكر ذلك صراحة كـ"ملاحظة اتساق" بدلًا من إخفائه. هذا الدليل توثيقي بحت: لا تعديل على أي كود مصدري ضمن `packages/*`.

### كيفية القراءة

كل قسم أدناه يقابل فصلًا من `03_CONSTITUTION.md` (مُشار إليه بالرقم)، ويحتوي: (أ) نص القاعدة الملزمة، (ب) الإرشاد العملي لتطبيقها، (ج) مثال حقيقي واحد على الأقل بمسار الملف واقتباس كود فعلي، (د) مرجع تصالبي للدستور والتقارير ذات الصلة.

---

### 1. معايير الترميز (Coding Standards)

**القاعدة**: TypeScript الصارم، بلا `any` غير مُبرَّر، دوال حقيقية لا سقالات، بلا `TODO`/`FIXME`/تنفيذ جزئي (CLAUDE.md §2، §4؛ Constitution §12.2؛ Master Plan §3.4).

**الإرشاد العملي**:
- كل حزمة تُوسّع `@lateen-os/typescript-config` (Constitution §3.1) — لا تُنشئ `tsconfig.json` مستقلًا يُخفف صرامة الفحص.
- ممنوع `any` إلا في حالة اضطرار موثّقة بتعليق يشرح السبب (مثال معروف: تحويل بيانات خارجية غير مكتوبة النوع قبل التحقق منها في طبقة حدودية). التفضيل دائمًا لـ `unknown` مع تضييق النوع (type narrowing)، أو Generics.
- كل دالة تصدير عامة (`export function`) تُنفَّذ بالكامل؛ لا يوجد مسار في الكود يُرمي `throw new Error('not implemented')` أو ما شابه كإجراء دائم.
- التحقق الفعلي: تدقيق Commit 35 (`docs/AI_PROJECT_CONTEXT.md` §4، البند 7؛ `TESTING_AUDIT.md`) بحث عن `TODO`/`FIXME`/`XXX` عبر شجرة `packages/*/src` بالكامل وأعاد **صفر** نتائج. أعدنا التحقق مباشرة أثناء إعداد هذا الدليل بأمر `grep` شامل على نفس الشجرة، والنتيجة لا تزال صفرًا.

**مثال حقيقي**: `packages/finance-engine/src/account/repository.impl.ts` — تنفيذ حقيقي كامل لكل طريقة معلنة في `AccountRepository` (`findAll`, `findByType`, `findByStatus`, `findByParent`, `findByCode`)، بلا أي مسار جزئي أو placeholder:

```ts
export function createAccountRepository(seed?: readonly Account[]): AccountRepository {
  const repo = createInMemoryRepository<Account>({ seed });
  return {
    ...repo,
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((account) => account.code === code) ?? null;
    },
    // ... كل طريقة أخرى مُنفَّذة فعليًا بنفس الأسلوب
  };
}
```

**تسمية**: `createX`/`createXRuntime`/`createXQueries`/`createXEventBus`/`createXRepository` بصيغة كاميل (camelCase) للدوال، `PascalCase` للأنواع والواجهات، `kebab-case` لأسماء الملفات والحزم (Constitution §10).

**مرجع**: Constitution §12 (قواعد الالتزام)، §10 (قواعد التسمية)؛ `docs/certification/TESTING_AUDIT.md`.

---

### 2. معايير العمارة (Architecture Standards)

**القاعدة**: العمارة النظيفة إلزامية (ADR 0001)، الاعتماديات تتجه دائمًا نحو الأسفل، `shared-kernel` هو الطبقة صفر، `business-dna` هو المصدر الوحيد لـ `OrganizationId` (Constitution §1).

**الإرشاد العملي**:
- منطق النطاق (domain) والتطبيق (application) لا يستورد أبدًا تنفيذًا ملموسًا مباشرة؛ فقط الواجهات (`interface`/`type`). التنفيذ المُحقَّق (concrete) يُبنى فقط داخل `runtime.ts` للحزمة نفسها.
- **بنية مجلد الحزمة القياسية** (Constitution §3.3، `AI_PROJECT_CONTEXT.md` §10): `shared/` (المعرّفات، الأنواع الأساسية، القاعدة `Repository<T,Id>`)، مجلد فرعي واحد لكل نطاق فرعي (`account/`, `budget/`, ...) يحتوي `types.ts`/`repository.ts`/`repository.impl.ts`/`*.impl.ts`/`index.ts`، `events/` (ناقل الأحداث المكتوب)، `relationship-management/` (فقط إن وُجد تكامل حقيقي مع حزم شقيقة)، `queries/` (طبقة القراءة)، `runtime.ts` (جذر التركيب)، `index.ts` (نقطة التصدير الوحيدة).
- `OrganizationId` نوعٌ واحدٌ يُعرَّف أصلًا في `@lateen-os/shared-kernel/tenant` ثم يُعاد تصديره حصرًا عبر `@lateen-os/business-dna`؛ كل حزمة أخرى تستورده من `business-dna` — لا من `shared-kernel` مباشرة، ولا بإعادة تعريفه محليًا. تحقّق مباشر:

```ts
// packages/business-dna/src/shared/identifiers.ts
import type { BranchId, OrganizationId } from '@lateen-os/shared-kernel/tenant';
export type { OrganizationId, BranchId };

// packages/finance-engine/src/shared/identifiers.ts
export type { CustomerId, DepartmentId, EmployeeId, OrganizationId, ProjectId, SupplierId } from '@lateen-os/business-dna';
```

هذا مطابق تمامًا لما ورد في `docs/AI_PROJECT_CONTEXT.md` §4 البند 9 ولِـ `DEPENDENCY_AUDIT.md` ("`@lateen-os/business-dna`'s `OrganizationId` is the sole source of the tenancy type across every package that needs it").

**مثال البنية الحقيقي**: `packages/finance-engine/src` يحتوي فعليًا: `account/`, `accounts-payable/`, `accounts-receivable/`, `budget/`, `financial-organization/`, `journal-entry/`, `report/`, `tax/`, `treasury/` (مجلدات فرعية للنطاق)، بالإضافة إلى `shared/`, `events/`, `queries/`, `relationship-management/`, `runtime.ts` — مطابقة حرفية للبنية القياسية.

**ملاحظة اتساق مهمة (Era 1 مقابل Era 2)**: ليست كل الحزم الـ 39 تتبع هذه البنية بحذافيرها. تسع حزم من حقبة التأسيس (`ai-brain`, `ai-runtime`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `workflow-engine`, `multi-agent`, `institutional-memory`, `domain-graph`) تفتقر إلى `relationship-management/` رغم امتلاكها تكاملات حقيقية مع حزم شقيقة (مُضمَّنة مباشرة داخل ملفات `*.impl.ts` للنطاق الفرعي). هذا **ليس خرقًا حدوديًا** (لا استيراد لمستودع حزمة أخرى في أي منها)، لكنه انحراف بنيوي موثَّق في `ARCHITECTURE_AUDIT.md` F4 و`KNOWN_TECHNICAL_DEBT.md` البند 4. لا تُقلّد هذا النمط في أي حزمة جديدة.

**مرجع**: ADR `0001-clean-architecture.md`؛ Constitution §1، §3؛ `ARCHITECTURE_AUDIT.md` (Passed Checks + F4، F6).

---

### 3. قواعد وقت التشغيل (Runtime Rules)

**القاعدة**: كل محرك يُصدّر دالة تركيب واحدة `createXRuntime(deps = {})`؛ المستودعات تُنشأ حصرًا داخل `runtime.ts`؛ الاعتماديات الاختيارية تتدهور إلى `null`/`[]` موثَّقة؛ المستودعات لا تظهر أبدًا في السطح العام (Constitution §5).

**مثال حقيقي كامل**: `packages/admin-console/src/runtime.ts` — جذر تركيب نموذجي:

```ts
export function createAdminConsoleRuntime(deps: AdminConsoleRuntimeDeps = {}): AdminConsoleRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createAdminEventBus();

  const organizationRepository = createOrganizationRepository();   // يُنشأ هنا فقط
  const tenantRepository = createTenantRepository();
  // ... 10 مستودعات أخرى، كلها محلية لهذه الدالة

  const organizations = createOrganizationEngine(organizationRepository, eventBus, now);
  // ... الخدمات تُحقن بالمستودعات، لا تُعاد المستودعات نفسها

  const relationshipManagement = createRelationshipManagement({ apiGateway: deps.apiGateway, /* ... */ });

  return {
    organizations, tenants, featureFlags, identity, settings, configuration,
    audit, monitoring, dashboard, relationshipManagement, queries,
    events: eventBus,
    // لاحظ: لا مستودع واحد من الاثني عشر مُصدَّرًا هنا
  };
}
```

`AdminConsoleRuntimeDeps` (السطر 37 من نفس الملف) يوضّح الاعتماديات الاختيارية: `eventBus?`, `now?`, وسبعة تكاملات شقيقة اختيارية (`apiGateway?`, `observability?`, `analytics?`, ...) — كل واحد منها `Pick<>` ضيق، ويتدهور إلى `null`/`[]` داخل طبقة العلاقات إذا لم يُحقن (انظر القسم 5 أدناه).

**التحقق الكمي**: `RUNTIME_AUDIT.md` يؤكد **صفر تسرّب مستودعات** عبر جميع الحزم الـ 39 (فحص مباشر لكل واجهة `XRuntime` معلنة). 24 من 39 حزمة تتبع `createXRuntime()` حرفيًا؛ 4 حزم من حقبة التأسيس تستخدم اسمًا مكافئًا وظيفيًا لكن مختلف التسمية:

| الحزمة | جذر التركيب الفعلي |
| --- | --- |
| `ai-brain` | `createBrainSystem()` |
| `ai-provider-hub` | `createAiProviderHub()` |
| `ceo-engine` | `createCEOEngine()` |
| `extension-system` | `createExtensionSystem()` |

وثلاث حزم (`ai-runtime`, `decision-engine`, `intelligence-engine`) بلا كائن Runtime موحّد إطلاقًا — **انحراف مُقَنَّن ومُوثَّق عمدًا** وليس عيبًا (`docs/handbook/08_PROJECT_STATUS.md` §21؛ `RUNTIME_AUDIT.md` جدول التغطية). لا تُصلح هذا الانحراف من تلقاء نفسك في أي مهمة — انظر `AI_PROJECT_CONTEXT.md` §2.

**مرجع**: Constitution §5؛ `RUNTIME_AUDIT.md` (التغطية والنتائج)؛ `ARCHITECTURE_AUDIT.md` F1، F3.

---

### 4. قواعد المستودع (Repository Rules)

**القاعدة**: منافذ المستودع تُعرَّف كواجهات في الحزمة النطاقية المالكة للمفهوم؛ التنفيذات في-الذاكرة تعيش داخل نفس الحزمة وتُبنى فوق مُساعد `shared-kernel` العام؛ كل استعلام يتطلب `organizationId` (تعدد المستأجرين).

**الإرشاد العملي — المُساعد العام**: `packages/shared-kernel/src/repository/in-memory-repository.ts` يُصدّر `createInMemoryRepository<TEntity, TId>()` — تنفيذ واحد، يُعاد استخدامه هيكليًا (structurally) من قِبل كل حزمة، بدل أن تُعيد كل حزمة كتابة نفس منطق `Map` في-الذاكرة:

```ts
export function createInMemoryRepository<TEntity extends IdentifiedEntity<TId>, TId extends string = string>(
  options: InMemoryRepositoryOptions<TEntity> = {},
): InMemoryRepository<TEntity, TId> {
  const store = new Map<TId, TEntity>();
  return {
    async findById(organizationId, id) {
      const entity = store.get(id);
      if (!entity || getOrganizationId(entity) !== organizationId) return null; // تعدد المستأجرين مفروض هنا
      return entity;
    },
    // save / delete / list / clear
  };
}
```

هذا النمط مُستخدَم فعليًا في 216 موقع استيراد عبر المنصّة (`DEPENDENCY_AUDIT.md`: "the only cross-package imports matching `*/repository*` are the sanctioned, universal use of `@lateen-os/shared-kernel/repository`'s generic `createInMemoryRepository` helper (216 files)").

**مثال منفذ + تنفيذ متجاورَين في نفس الحزمة**: `packages/finance-engine/src/account/repository.ts` يُعرِّف `AccountRepository` كواجهة فقط (تُوسّع `Repository<Account, AccountId>` القاعدية من `shared/repository.ts`)؛ `packages/finance-engine/src/account/repository.impl.ts` — بجانبه مباشرة في نفس المجلد — يبني التنفيذ الحقيقي فوق `createInMemoryRepository`. نفس النمط بالضبط يتكرر في `packages/business-dna/src/business-profile/{repository.ts,repository.impl.ts}` — الحزمة النطاقية `business-dna` تُنشئ منفذها **وتنفيذها** داخل نفسها لأنها هي "الحزمة التي تحتاجه" لأغراضها الخاصة (`business-dna` تمتلك `runtime.ts` خاصًا بها يُنشئ هذه المستودعات).

كل طريقة استعلام تأخذ `organizationId` أولًا: `findAll(organizationId)`, `findByType(organizationId, accountType)`, إلخ — بلا استثناء عبر المنصّة.

**مرجع**: Constitution §4؛ `docs/AI_PROJECT_CONTEXT.md` §4 البند 3؛ `DEPENDENCY_AUDIT.md` (Passed Checks).

---

### 5. قواعد العلاقات (Relationship Rules)

**القاعدة**: مجلد `relationship-management/` هو القائمة المركزية الوحيدة لكل تكامل مع حزمة شقيقة؛ طريقة واحدة لكل مُتعاون؛ تضييق النوع دائمًا عبر `Pick<SiblingRuntime, '...'>`، أبدًا نوع Runtime كاملًا، أبدًا مستودعًا مباشرة.

**مثال حقيقي كامل**: `packages/admin-console/src/relationship-management/types.ts` يُعرِّف `RelationshipManagementDeps` بتسعة مُتعاونين، كلٌ منهم `Pick<>` ضيق:

```ts
export interface RelationshipManagementDeps {
  readonly apiGateway?: Pick<ApiGatewayRuntime, 'queries'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
  // ... إلخ، لا نوع Runtime كامل واحد
}
```

و`packages/admin-console/src/relationship-management/service.impl.ts` يُنفِّذ طريقة واحدة بالضبط لكل مُتعاون، كل واحدة تتدهور إلى `null`/`[]` عند عدم الحقن:

```ts
async notifyAdminEvent(organizationId, input) {
  if (!deps.communicationHub) return null;                 // تدهور موثَّق
  const notification = await deps.communicationHub.notifications.create(organizationId, { /* ... */ });
  return deps.communicationHub.notifications.send(organizationId, notification.id);
},
```

**الاستثناء الموثَّق لـ `ai-runtime`**: بما أن `ai-runtime` لا يمتلك نوع Runtime موحّدًا (القسم 3 أعلاه)، كل حزمة تتكامل معه (مثل `marketplace`, `admin-console`) تُصيّغ نوع الاعتمادية مباشرة على منفذ الاستعلام الخاص به: `Pick<RuntimeQueries, 'findAgent'>` بدلًا من `Pick<AiRuntimeRuntime, ...>` غير الموجود أصلًا. تحقّق `INTEGRATION_AUDIT.md`: "`ai-runtime`'s consumers correctly use its documented special-case typing... verified directly in `marketplace` and `admin-console`".

**التحقق الكمي**: 18 من 39 حزمة تمتلك `relationship-management/`، و**18 من 18** منها تُصيّغ كل مُتعاون كـ `Pick<>` ضيق بلا استثناء (`INTEGRATION_AUDIT.md`). تسع حزم من حقبة التأسيس تفتقر لهذا المجلد رغم امتلاكها تكاملات حقيقية (القسم 2 أعلاه) — دَين تقني موثَّق، لا تُقلّده.

**مرجع**: Constitution §3.3 (`relationship-management/` كجزء من البنية القياسية)؛ `docs/AI_PROJECT_CONTEXT.md` §6؛ `INTEGRATION_AUDIT.md`.

---

### 6. قواعد الاستعلام (Query Rules)

**القاعدة**: طبقة `queries/` منفصلة تمامًا عن طبقة الكتابة؛ قراءة فقط أبدًا تُعدِّل الحالة؛ `paginate()` و`scoreLabel()` كمُساعدين نقيّين (pure) يتكرران حرفيًا عبر كل حزمة تملك طبقة استعلام.

**مثال حقيقي**: `packages/admin-console/src/queries/admin-queries.impl.ts`:

```ts
function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;      // تطابق تام
  if (normalizedLabel.includes(normalizedKeyword)) return 2; // تطابق جزئي
  return 0;                                                  // بلا تطابق
}
```

`searchAdministration()` في نفس الملف يستخدم `scoreLabel()` عبر أربعة أنواع سجلات (`tenant`, `user`, `role`, `feature-flag`)، ثم يُرتِّب النتائج تنازليًا حسب `score` وتصاعديًا حسب `id` عند التعادل — ترتيب حتمي تمامًا، **بلا مكتبة مطابقة ضبابية (fuzzy-match) وبلا نموذج تصنيف**:

```ts
matches.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
});
```

كل طريقة `findX()` تعمل حصرًا فوق مستودعات الحزمة **نفسها** (لا مستودع حزمة شقيقة) وتُعيد نتيجة للقراءة فقط — لا استدعاء `save()`/`delete()` في أي ملف `queries/*.ts` عبر المنصّة.

**التحقق الكمي**: 31 من 39 حزمة تمتلك `queries/` (الثمانية المتبقية بلا حالة نطاقية قابلة للاستعلام أصلًا: `capability-engine`, `kernel`, `connector-base`, `integration-contracts`, `integration-tests`, `sdk`, `shared-kernel`, `ceo-engine`, `typescript-config`)، وكلها تتبع نمط `paginate()`/`scoreLabel()` بنفس منطق 3/2/0 (`RUNTIME_AUDIT.md`).

**مرجع**: Constitution §7؛ `docs/AI_PROJECT_CONTEXT.md` §7؛ `RUNTIME_AUDIT.md`.

---

### 7. قواعد الأحداث (Event Rules)

**القاعدة**: تسمية `{entity}.{action}` بصيغة الماضي؛ `EventMap` مكتوب النوع لكل حزمة؛ كل حدث مُعلَن يُنشَر فعليًا من مسار الكود الحقيقي الذي يُسبّبه؛ الأحداث تُصدَر بعد نجاح تغيير الحالة لا قبله.

**مثال حقيقي**: `packages/admin-console/src/events/admin-events.ts` يُعرِّف عشرة أنواع أحداث بصيغة `noun.verb` الماضية:

```ts
export type OrganizationCreatedEvent = DomainEvent<
  'organization.created',
  { readonly organizationId: string; readonly name: string }
>;
export type SettingsUpdatedEvent = DomainEvent<
  'settings.updated',
  { readonly organizationId: string; readonly settingId: string; readonly key: string; readonly scope: string }
>;
// ... 8 أحداث أخرى، كلها {اسم}.{فعل ماضٍ}
```

كل حزمة تملك ناقل أحداث خاصًا بها (`createAdminEventBus()`) مبنيًا فوق `shared-kernel`'s العام `createEventBus<TEventMap>()` — لا حزمة تُشارك ناقل حدث حزمة أخرى مباشرة.

**التحقق الكمي (لا أحداث "طموحة" غير مُستخدَمة)**: `docs/AI_PROJECT_CONTEXT.md` §8 يؤكد: "**Every event actually declared in the map is genuinely published** by the real code path that causes it — there are no aspirational/unused event declarations anywhere in the codebase (verified in Commit 35)"، و`RUNTIME_AUDIT.md` يُوثِّق تحققًا مباشرًا لِـ 10 من 10 أحداث في `marketplace` مُتتبَّعة إلى نقطة الاستدعاء المُسبِّبة فعليًا لها. 31 من 39 حزمة تملك أحداث نطاقية، وكلها تتبع نمط `noun.verb` بلا استثناء.

**النشر بعد النجاح لا قبله**: النمط المتكرر عبر كل خدمة هو: تنفيذ التغيير على المستودع أولًا (`await repository.save(entity)`)، ثم نشر الحدث فقط بعد نجاح تلك العملية — لا نشر تفاؤلي (optimistic) قبل تأكيد الحفظ.

**مرجع**: Constitution §8؛ `docs/AI_PROJECT_CONTEXT.md` §8؛ `RUNTIME_AUDIT.md` (Event-bus consistency).

---

### 8. قواعد الاختبار (Testing Rules)

**القاعدة**: كل منطق أعمال قابل للاختبار دون شبكة أو مزوّد LLM حي؛ اختبارات التكامل تستخدم كائنات Runtime حقيقية لحزم شقيقة (لا مكتبات محاكاة)؛ الترتيب: بناء → فحص الأنواع → اختبارات → linting؛ لا دمج إذا فشلت الاختبارات.

**الإرشاد العملي**: بفضل الاعتماديات الاختيارية (القسم 3) وتدهورها الموثَّق إلى `null`/`[]` (القسم 5)، تعمل كل حزمة كاملةً دون أي حقن؛ اختبارات الوحدة تستخدم كائنات حرفية (literal objects) مطابقة لشكل `Pick<>` ضيق فقط للعزل الدقيق، بينما اختبارات التكامل تُحقن كائنات Runtime حقيقية كاملة لحزم شقيقة فعلية — لا `jest.mock()` ولا مكتبة محاكاة مكافئة في أي مكان بالمنصّة.

**الأرقام الفعلية** (`TESTING_AUDIT.md`، مُصحَّحة من 38 إلى 39 حزمة): **5,676 اختبارًا حقيقيًا عبر 328 ملف اختبار في 37 حزمة، صفر فشل**. `capability-engine` بلا حزمة اختبار رغم امتلاكها منطقًا حقيقيًا (دَين تقني موثَّق في `KNOWN_TECHNICAL_DEBT.md` البند 3)؛ `typescript-config` بلا اختبارات لأنها حزمة `tsconfig.json` بحتة بلا كود تشغيلي.

**عائق حقيقي على مستوى الجذر**: دورة الاعتماد الدائرية الوحيدة الموجودة فعليًا (`ai-brain` ⇄ `multi-agent`، انظر القسم 9) تجعل `turbo run build/typecheck/test/lint` على مستوى الجذر يفشل فورًا بخطأ "Cyclic dependency detected" **قبل تشغيل أي حزمة على الإطلاق**. الحل الموثَّق المُستخدَم فعليًا في تدقيق Commit 35: تشغيل كل حزمة على حدة عبر `pnpm --filter <pkg> run <task>` (نفس السكربتات الحقيقية، مسار استدعاء مختلف فقط، وليس تحققًا أضعف). **لا تُفسِّر فشل السكربت الجذري كخلل في حزمتك** — راجع `TESTING_AUDIT.md` قبل افتراض وجود انحدار.

**تنبيه اتساق حقيقي وجدير بالذكر**: كل سكربت `lint` عبر 38 من 39 حزمة (كل ما عدا `typescript-config` التي لا تملك واحدًا) هو نفس الـ stub الفارغ حرفيًا: `node -e "process.exit(0)"`. لا يوجد ESLint أو أداة تحليل ساكن حقيقية مُهيَّأة في أي مكان بـ `packages/*` اليوم. **"اجتياز الـ lint" لا يعني اجتياز تحليل ساكن حقيقي** — هذا مُسجَّل صراحة في `TESTING_AUDIT.md` F3 و`KNOWN_TECHNICAL_DEBT.md` البند 2 كأولوية عالية غير مُصلَحة.

**مرجع**: Constitution §9؛ `docs/AI_PROJECT_CONTEXT.md` §5؛ `TESTING_AUDIT.md`؛ CLAUDE.md §4.

---

### 9. قواعد الاعتماديات (Dependency Rules)

**القاعدة**: لا اعتماديات دائرية (ADR 0003)؛ المفهوم المشترك يُستخرَج للأسفل بدل الدورة؛ كل وصول لِـ LLM عبر `ai-provider-hub` حصرًا (ADR 0002)؛ التحقق من الجذور الخمسة قبل تسمية حزمة جديدة.

**الاستثناء الحقيقي الوحيد الموجود اليوم — تحذير، لا نموذج يُحتذى**: `@lateen-os/ai-brain` ⇄ `@lateen-os/multi-agent` دورة اعتمادية حقيقية وفعّالة، وليست إعلانًا متروكًا بلا استخدام:

- `packages/ai-brain/package.json` يُعلن اعتمادية على `@lateen-os/multi-agent`؛ `ai-brain/src/context/types.ts` و`ai-brain/src/shared/identifiers.ts` يستوردان النوع `MissionId` منها فعليًا.
- `packages/multi-agent/package.json` يُعلن اعتمادية على `@lateen-os/ai-brain`؛ `multi-agent/src/runtime.ts` و`multi-agent/src/escalation/service.impl.ts` يستوردان النوع `Brain` منها فعليًا (لمُتعاون تصعيد اختياري مُحقَن).
- **الأثر التجريبي الحقيقي**: `pnpm install` ينجح لكن يُصدِر تحذيرًا؛ `turbo run build` **يفشل فورًا** بـ "Cyclic dependency detected" ويرفض حساب ترتيب بناء لأي حزمة، وليس فقط هاتين الحزمتين — عائق على مستوى المنصّة بأكملها لمن يعتمد على سكربتات `pnpm run *` الجذرية.
- **الإصلاح المُوصَى به رسميًا** (ADR 0003، `DEPENDENCY_AUDIT.md` F1): استخراج المفهوم المشترك (شريحة `Brain` التي يحتاجها `multi-agent` فعليًا، و/أو `MissionId` التي يحتاجها `ai-brain` فعليًا) إلى الأسفل — إلى `shared-kernel` أو وحدة معرّفات مشتركة جديدة — ثم إزالة الاعتمادية المتقاطعة المباشرة. هذا **لم يُصلَح بعد**؛ يتطلب التزامًا مخصصًا يمسّ الحزمتين معًا، وليس إصلاحًا عرضيًا ضمن مهمة أخرى.

**درس التسمية الحقيقي**: `packages/marketplace`'s `package.json` كان مُسمّى `@lateen-os/marketplace` — مطابقًا حرفيًا لِـ `apps/marketplace` الموجودة مسبقًا (واجهة توزيع الإضافات). هذا كسر تحليل مساحة عمل `pnpm`/`turbo` **للمنصّة بأكملها**: `turbo run build` فشل قبل تنفيذ أي عمل بالخطأ `Failed to add workspace "@lateen-os/marketplace" ... it already exists at "apps\marketplace\package.json"`. أُصلِح في Commit 35 بإعادة تسمية المحرك الخلفي إلى `@lateen-os/marketplace-engine` (مسار المجلد `packages/marketplace` بلا تغيير). **الدرس الملزم**: قبل تسمية أي حزمة جديدة تحت `packages/*`، ابحث عن الاسم المُقترَح حرفيًا عبر الجذور الخمسة كلها: `packages/`, `apps/`, `services/`, `workflows/`, `extensions/` — وليس `packages/` وحدها.

**عزل الوصول لِـ LLM**: كل استدعاء لِـ LLM يمر حصرًا عبر `@lateen-os/ai-provider-hub` (ADR `0002-openai-compatible-providers.md`). تعليق `index.ts` للحزمة يقول ذلك صراحةً: *"AI Brain MUST consume this hub. Applications MUST NEVER call providers directly."* — لا حزمة أعمال (business engine) تستورد SDK مزوّد مباشرة.

**مرجع**: Constitution §2؛ ADR `0003-no-cyclic-dependencies.md`، ADR `0002-openai-compatible-providers.md`؛ `docs/AI_PROJECT_CONTEXT.md` §4 البندان 1-2؛ `DEPENDENCY_AUDIT.md` F1، F3؛ `KNOWN_TECHNICAL_DEBT.md` البند 1.

---

### 10. قواعد التوثيق (Documentation Rules)

**القاعدة**: `@packageDocumentation` في `index.ts`؛ توثيق ثنائي اللغة لكل مستند في `docs/handbook/`؛ ثلاثية README + ARCHITECTURE + MODEL لكل حزمة؛ التوثيق يُحدَّث فقط عندما يُثبت التنفيذ خطأه — لا استباقًا.

**مثال حقيقي**: `packages/business-dna/src/index.ts` يحمل تعليق `@packageDocumentation` يشرح الغرض والحدود بدقة:

```ts
/**
 * ...
 * - Aggregate type definitions and enums
 * - Value object interfaces
 * - Domain event types (`{entity}.{action}` convention)
 * - Repository port interfaces (no implementations)
 *
 * No UI, API, database, ORM, or business logic.
 * Framework-agnostic. TypeScript only.
 *
 * @packageDocumentation
 */
```

**الحالة الفعلية للثلاثية التوثيقية**: 29 من 39 حزمة تملك الثلاثية الكاملة (README + ARCHITECTURE + MODEL) اليوم. الثغرات الحقيقية موثَّقة صراحة لا مُخفاة: `capability-engine`, `extension-system`, `kernel`, `shared-kernel` تفتقر لمستند MODEL فقط؛ `ceo-engine`, `sdk`, `integration-tests` تفتقر لِـ ARCHITECTURE وMODEL معًا؛ `connector-base`, `integration-contracts`, `typescript-config` تفتقر للثلاثية كاملة (لكن هذا على الأرجح إعفاء بنيوي مشروع — حزم عقود بحتة أو أدوات بلا نموذج تشغيلي حقيقي). **لم تُؤلَّف مستندات جديدة اعتباطًا لهذه الحزم في Commit 35** — القاعدة كانت: لا توثيق مُلفَّق تحت ضغط الوقت؛ التوثيق الحقيقي يتطلب قراءة التنفيذ الفعلي أولًا.

**قاعدة "لا تحديث استباقي"**: هذا الدليل نفسه امتثالٌ لهذه القاعدة — لم يُخترَع أي قاعدة جديدة، ولم يُعدَّل نص `03_CONSTITUTION.md`؛ كل ما فيه امتداد شارح مُثبَت بمثال حقيقي لقاعدة موجودة أصلًا.

**مرجع**: Constitution §11؛ `docs/AI_PROJECT_CONTEXT.md` §10 البند 7؛ `ARCHITECTURE_AUDIT.md` F5؛ `KNOWN_TECHNICAL_DEBT.md` البند 7.

---

## ملاحظات اتساق حقيقية رُصدت أثناء إعداد هذا الدليل

هذه ملاحظات وُجدت أثناء التحقق من الأمثلة أعلاه — لا تُصلح أي كود بسببها، فقط وثِّقها:

1. **تناقض تاريخي مُصحَّح بالفعل**: `docs/handbook/08_PROJECT_STATUS.md` §6/§14/§17 كان يذكر "صفر اعتماديات دائرية... عبر 30 حزمة" لنطاق المرحلة 1. هذا لا يصمد اليوم بسبب دورة `ai-brain`/`multi-agent` (موثَّق بالفعل في `KNOWN_TECHNICAL_DEBT.md` البند 8 كملاحظة توثيقية، لا كخلل كود). هذا الدليل لا يُعدِّل `08_PROJECT_STATUS.md` — خارج نطاق مهمة التوثيق هذه.
2. **الـ lint لا يعني فحصًا ساكنًا حقيقيًا** عبر المنصّة بأكملها (القسم 8 أعلاه) — جدير بالتنويه لأي مطوّر يقرأ "lint: passing" ويفترض خطأً وجود ESLint حقيقي.
3. **CLAUDE.md والدستور متسقان بلا تعارض** فيما يخص هذا الدليل: كلاهما يفرضان بناء→فحص الأنواع→اختبارات→lint، وكلاهما يمنعان التعديل على حزم غير ذات صلة، وكلاهما يمنعان الالتزام عند فشل البناء/الاختبارات. لم يُعثر على أي تعارض فعلي بين الوثيقتين.

---

# English

## Engineering Guide — Lateen OS

> This guide **creates no new rules**. Every rule here is taken verbatim from [`03_CONSTITUTION.md`](../handbook/03_CONSTITUTION.md) and expanded into practical guidance backed by real examples pulled from actual source in `packages/*`, cross-checked against the certification reports in `docs/certification/*.md` (39 packages, corrected from an earlier "38" in draft reports). Where actual code behavior diverges from the Constitution's text, that is called out explicitly as a "consistency note" rather than hidden. This guide is documentation-only: no source code under `packages/*` was modified to produce it.

### How to read this

Each section below maps to a chapter of `03_CONSTITUTION.md` (numbered accordingly) and contains: (a) the binding rule text, (b) practical guidance for applying it, (c) at least one real example with file path and real code excerpt, (d) a cross-reference back to the Constitution and relevant certification reports.

---

### 1. Coding Standards

**Rule**: Strict TypeScript, no unjustified `any`, real functions rather than stubs, no `TODO`/`FIXME`/partial implementation (CLAUDE.md §2, §4; Constitution §12.2; Master Plan §3.4).

**Practical guidance**:
- Every package extends `@lateen-os/typescript-config` (Constitution §3.1) — never introduce a standalone `tsconfig.json` that loosens strictness.
- `any` is forbidden except in a documented, unavoidable case with a comment explaining why (a known legitimate case: converting untyped external data at a boundary before validation). Prefer `unknown` with narrowing, or generics.
- Every exported public function (`export function`) is fully implemented; no code path permanently throws `new Error('not implemented')` or an equivalent stub.
- Real verification: the Commit 35 audit (`docs/AI_PROJECT_CONTEXT.md` §4 item 7; `TESTING_AUDIT.md`) searched the entire `packages/*/src` tree for `TODO`/`FIXME`/`XXX` and found **zero**. Re-verified directly while preparing this guide with a fresh full-tree `grep` — still zero.

**Real example**: `packages/finance-engine/src/account/repository.impl.ts` — a fully real implementation of every method declared on `AccountRepository` (`findAll`, `findByType`, `findByStatus`, `findByParent`, `findByCode`), with no partial or placeholder path:

```ts
export function createAccountRepository(seed?: readonly Account[]): AccountRepository {
  const repo = createInMemoryRepository<Account>({ seed });
  return {
    ...repo,
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((account) => account.code === code) ?? null;
    },
    // ... every other method genuinely implemented the same way
  };
}
```

**Naming**: `createX`/`createXRuntime`/`createXQueries`/`createXEventBus`/`createXRepository` in camelCase for functions, `PascalCase` for types/interfaces, `kebab-case` for file and package names (Constitution §10).

**Reference**: Constitution §12 (Commit Rules), §10 (Naming Rules); `docs/certification/TESTING_AUDIT.md`.

---

### 2. Architecture Standards

**Rule**: Clean Architecture is mandatory (ADR 0001), dependencies always flow downward, `shared-kernel` is Layer Zero, `business-dna` is the sole source of `OrganizationId` (Constitution §1).

**Practical guidance**:
- Domain and application logic never imports a concrete implementation directly — only interfaces/types. The concrete implementation is only ever constructed inside that package's own `runtime.ts`.
- **Standard package folder structure** (Constitution §3.3, `AI_PROJECT_CONTEXT.md` §10): `shared/` (identifiers, core types, the base `Repository<T,Id>`), one subfolder per subdomain (`account/`, `budget/`, ...) containing `types.ts`/`repository.ts`/`repository.impl.ts`/`*.impl.ts`/`index.ts`, `events/` (typed event bus), `relationship-management/` (only if the package genuinely integrates with siblings), `queries/` (read layer), `runtime.ts` (composition root), `index.ts` (the single export point).
- `OrganizationId` is one type, originally defined in `@lateen-os/shared-kernel/tenant`, then re-exported exclusively through `@lateen-os/business-dna`; every other package imports it from `business-dna` — never directly from `shared-kernel`, and never redefined locally. Direct verification:

```ts
// packages/business-dna/src/shared/identifiers.ts
import type { BranchId, OrganizationId } from '@lateen-os/shared-kernel/tenant';
export type { OrganizationId, BranchId };

// packages/finance-engine/src/shared/identifiers.ts
export type { CustomerId, DepartmentId, EmployeeId, OrganizationId, ProjectId, SupplierId } from '@lateen-os/business-dna';
```

This matches `docs/AI_PROJECT_CONTEXT.md` §4 item 9 and `DEPENDENCY_AUDIT.md` exactly ("`@lateen-os/business-dna`'s `OrganizationId` is the sole source of the tenancy type across every package that needs it").

**Real structure example**: `packages/finance-engine/src` actually contains: `account/`, `accounts-payable/`, `accounts-receivable/`, `budget/`, `financial-organization/`, `journal-entry/`, `report/`, `tax/`, `treasury/` (subdomain folders), plus `shared/`, `events/`, `queries/`, `relationship-management/`, `runtime.ts` — a literal match of the standard structure.

**Important consistency note (Era 1 vs. Era 2)**: not all 39 packages follow this structure exactly. Nine foundation-era packages (`ai-brain`, `ai-runtime`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `workflow-engine`, `multi-agent`, `institutional-memory`, `domain-graph`) lack a `relationship-management/` folder despite having real sibling integrations (embedded directly inside subdomain `*.impl.ts` files). This is **not a boundary violation** (no package imports a sibling's repository), but it is a documented structural deviation recorded in `ARCHITECTURE_AUDIT.md` F4 and `KNOWN_TECHNICAL_DEBT.md` item 4. Do not replicate this pattern in any new package.

**Reference**: ADR `0001-clean-architecture.md`; Constitution §1, §3; `ARCHITECTURE_AUDIT.md` (Passed Checks + F4, F6).

---

### 3. Runtime Rules

**Rule**: Every engine exports exactly one composition function `createXRuntime(deps = {})`; repositories are constructed exclusively inside `runtime.ts`; optional dependencies degrade to documented `null`/`[]`; repositories never appear in the public surface (Constitution §5).

**Full real example**: `packages/admin-console/src/runtime.ts` — a canonical composition root:

```ts
export function createAdminConsoleRuntime(deps: AdminConsoleRuntimeDeps = {}): AdminConsoleRuntime {
  const now = deps.now ?? nowIso;
  const eventBus = deps.eventBus ?? createAdminEventBus();

  const organizationRepository = createOrganizationRepository();   // constructed here only
  const tenantRepository = createTenantRepository();
  // ... 10 more repositories, all local to this function

  const organizations = createOrganizationEngine(organizationRepository, eventBus, now);
  // ... services are injected with repositories, repositories themselves are never returned

  const relationshipManagement = createRelationshipManagement({ apiGateway: deps.apiGateway, /* ... */ });

  return {
    organizations, tenants, featureFlags, identity, settings, configuration,
    audit, monitoring, dashboard, relationshipManagement, queries,
    events: eventBus,
    // note: not one of the twelve repositories is exported here
  };
}
```

`AdminConsoleRuntimeDeps` (line 37 of the same file) shows the optional dependencies clearly: `eventBus?`, `now?`, and seven optional sibling integrations (`apiGateway?`, `observability?`, `analytics?`, ...) — each a narrow `Pick<>`, degrading to `null`/`[]` inside the relationship layer when not injected (see section 5 below).

**Quantitative verification**: `RUNTIME_AUDIT.md` confirms **zero repository leakage** across all 39 packages (direct inspection of every declared `XRuntime` interface). 24 of 39 packages follow `createXRuntime()` literally; 4 foundation-era packages use a functionally equivalent but differently-named entry point:

| Package | Actual composition root |
| --- | --- |
| `ai-brain` | `createBrainSystem()` |
| `ai-provider-hub` | `createAiProviderHub()` |
| `ceo-engine` | `createCEOEngine()` |
| `extension-system` | `createExtensionSystem()` |

And three packages (`ai-runtime`, `decision-engine`, `intelligence-engine`) have no unified Runtime object at all — a **deliberately sanctioned deviation, not a defect** (`docs/handbook/08_PROJECT_STATUS.md` §21; `RUNTIME_AUDIT.md` coverage table). Do not "fix" this deviation unilaterally in any task — see `AI_PROJECT_CONTEXT.md` §2.

**Reference**: Constitution §5; `RUNTIME_AUDIT.md` (coverage and findings); `ARCHITECTURE_AUDIT.md` F1, F3.

---

### 4. Repository Rules

**Rule**: Repository ports are defined as interfaces in the domain package that owns the concept; in-memory implementations live inside that same package and are built on `shared-kernel`'s generic helper; every lookup requires `organizationId` (multi-tenancy).

**Practical guidance — the generic helper**: `packages/shared-kernel/src/repository/in-memory-repository.ts` exports `createInMemoryRepository<TEntity, TId>()` — one implementation, structurally reused by every package, instead of every package hand-rolling the same in-memory `Map` logic:

```ts
export function createInMemoryRepository<TEntity extends IdentifiedEntity<TId>, TId extends string = string>(
  options: InMemoryRepositoryOptions<TEntity> = {},
): InMemoryRepository<TEntity, TId> {
  const store = new Map<TId, TEntity>();
  return {
    async findById(organizationId, id) {
      const entity = store.get(id);
      if (!entity || getOrganizationId(entity) !== organizationId) return null; // multi-tenancy enforced here
      return entity;
    },
    // save / delete / list / clear
  };
}
```

This pattern is genuinely reused across 216 import sites platform-wide (`DEPENDENCY_AUDIT.md`: "the only cross-package imports matching `*/repository*` are the sanctioned, universal use of `@lateen-os/shared-kernel/repository`'s generic `createInMemoryRepository` helper (216 files)").

**Example of a port and its implementation co-located in the same package**: `packages/finance-engine/src/account/repository.ts` defines `AccountRepository` as an interface only (extending the base `Repository<Account, AccountId>` from `shared/repository.ts`); `packages/finance-engine/src/account/repository.impl.ts` — right next to it in the same folder — builds the real implementation on top of `createInMemoryRepository`. The exact same pattern recurs in `packages/business-dna/src/business-profile/{repository.ts,repository.impl.ts}` — the domain package `business-dna` constructs both its own port **and** its own implementation because it is itself "the package that needs it" for its own aggregates (`business-dna` has its own `runtime.ts` that constructs these repositories).

Every query method takes `organizationId` first: `findAll(organizationId)`, `findByType(organizationId, accountType)`, etc. — with no exception found anywhere on the platform.

**Reference**: Constitution §4; `docs/AI_PROJECT_CONTEXT.md` §4 item 3; `DEPENDENCY_AUDIT.md` (Passed Checks).

---

### 5. Relationship Rules

**Rule**: `relationship-management/` is the single centralized list of every sibling integration; exactly one method per collaborator; always narrow-typed via `Pick<SiblingRuntime, '...'>`, never a whole Runtime type, never a repository.

**Full real example**: `packages/admin-console/src/relationship-management/types.ts` defines `RelationshipManagementDeps` with nine collaborators, each a narrow `Pick<>`:

```ts
export interface RelationshipManagementDeps {
  readonly apiGateway?: Pick<ApiGatewayRuntime, 'queries'>;
  readonly businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>;
  readonly institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>;
  readonly communicationHub?: Pick<CommunicationRuntime, 'notifications'>;
  // ... etc., never one whole Runtime type
}
```

And `packages/admin-console/src/relationship-management/service.impl.ts` implements exactly one method per collaborator, each degrading to `null`/`[]` when not injected:

```ts
async notifyAdminEvent(organizationId, input) {
  if (!deps.communicationHub) return null;                 // documented degradation
  const notification = await deps.communicationHub.notifications.create(organizationId, { /* ... */ });
  return deps.communicationHub.notifications.send(organizationId, notification.id);
},
```

**The documented `ai-runtime` special case**: since `ai-runtime` has no unified Runtime type (section 3 above), every package that integrates with it (e.g. `marketplace`, `admin-console`) types the dependency directly against its query port: `Pick<RuntimeQueries, 'findAgent'>` instead of a nonexistent `Pick<AiRuntimeRuntime, ...>`. Verified in `INTEGRATION_AUDIT.md`: "`ai-runtime`'s consumers correctly use its documented special-case typing... verified directly in `marketplace` and `admin-console`".

**Quantitative verification**: 18 of 39 packages have `relationship-management/`, and **18 of 18** type every collaborator as a narrow `Pick<>` with zero exceptions (`INTEGRATION_AUDIT.md`). Nine foundation-era packages lack this folder despite real sibling integrations (section 2 above) — documented technical debt, not a pattern to copy.

**Reference**: Constitution §3.3 (`relationship-management/` as part of the standard structure); `docs/AI_PROJECT_CONTEXT.md` §6; `INTEGRATION_AUDIT.md`.

---

### 6. Query Rules

**Rule**: `queries/` is fully separate from the write layer; read-only, never mutates state; `paginate()` and `scoreLabel()` are pure helpers repeated verbatim across every package with a query layer.

**Real example**: `packages/admin-console/src/queries/admin-queries.impl.ts`:

```ts
function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;      // exact match
  if (normalizedLabel.includes(normalizedKeyword)) return 2; // substring match
  return 0;                                                  // no match
}
```

`searchAdministration()` in the same file uses `scoreLabel()` across four record types (`tenant`, `user`, `role`, `feature-flag`), then sorts results by `score` descending and `id` ascending on ties — a fully deterministic order, **never a fuzzy-match library, never a ranking model**:

```ts
matches.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
});
```

Every `findX()` method operates exclusively over that **same** package's own repositories (never a sibling's) and returns a read-only result — no `save()`/`delete()` call appears in any `queries/*.ts` file anywhere on the platform.

**Quantitative verification**: 31 of 39 packages have `queries/` (the remaining eight have no queryable domain state of their own: `capability-engine`, `kernel`, `connector-base`, `integration-contracts`, `integration-tests`, `sdk`, `shared-kernel`, `ceo-engine`, `typescript-config`), and all of them follow the `paginate()`/`scoreLabel()` pattern with the same 3/2/0 scoring logic (`RUNTIME_AUDIT.md`).

**Reference**: Constitution §7; `docs/AI_PROJECT_CONTEXT.md` §7; `RUNTIME_AUDIT.md`.

---

### 7. Event Rules

**Rule**: `{entity}.{action}` past-tense naming; a typed `EventMap` per package; every declared event is genuinely published by the real code path that causes it; events are emitted after a state change succeeds, never before.

**Real example**: `packages/admin-console/src/events/admin-events.ts` defines ten event types in past-tense `noun.verb` form:

```ts
export type OrganizationCreatedEvent = DomainEvent<
  'organization.created',
  { readonly organizationId: string; readonly name: string }
>;
export type SettingsUpdatedEvent = DomainEvent<
  'settings.updated',
  { readonly organizationId: string; readonly settingId: string; readonly key: string; readonly scope: string }
>;
// ... 8 more events, all {noun}.{past-tense verb}
```

Every package owns its own event bus (`createAdminEventBus()`) built on `shared-kernel`'s generic `createEventBus<TEventMap>()` — no package shares another package's event bus directly.

**Quantitative verification (no "aspirational" unused events)**: `docs/AI_PROJECT_CONTEXT.md` §8 confirms: "**Every event actually declared in the map is genuinely published** by the real code path that causes it — there are no aspirational/unused event declarations anywhere in the codebase (verified in Commit 35)", and `RUNTIME_AUDIT.md` documents a direct trace of 10 of 10 `marketplace` events to their genuine triggering call site. 31 of 39 packages have domain events, all following `noun.verb` with zero exceptions.

**Publish-after-success, not before**: the repeated pattern across every service is: perform the state change on the repository first (`await repository.save(entity)`), then publish the event only after that operation succeeds — never an optimistic publish ahead of confirmed persistence.

**Reference**: Constitution §8; `docs/AI_PROJECT_CONTEXT.md` §8; `RUNTIME_AUDIT.md` (Event-bus consistency).

---

### 8. Testing Rules

**Rule**: All business logic is testable without network access or a live LLM; integration tests use real sibling Runtime objects (no mocking libraries); order is build → typecheck → tests → lint; no merge if tests fail.

**Practical guidance**: because of optional dependencies (section 3) and their documented `null`/`[]` degradation (section 5), every package works completely with zero injection; unit tests use hand-built literal objects matching a narrow `Pick<>` shape only for fine-grained isolation, while integration tests inject full, real sibling Runtime objects — no `jest.mock()` or equivalent mocking library appears anywhere on the platform.

**Real numbers** (`TESTING_AUDIT.md`, corrected from 38 to 39 packages): **5,676 real tests across 328 test files in 37 packages, zero failures**. `capability-engine` has no test suite despite containing real logic (documented technical debt, `KNOWN_TECHNICAL_DEBT.md` item 3); `typescript-config` has no tests because it is a pure `tsconfig.json` package with no runtime code.

**A real root-level blocker**: the one genuine circular dependency on the platform (`ai-brain` ⇄ `multi-agent`, section 9) makes `turbo run build/typecheck/test/lint` at the workspace root fail immediately with a "Cyclic dependency detected" error **before running a single package's script**. The documented workaround actually used during the Commit 35 audit: run each package individually via `pnpm --filter <pkg> run <task>` (the exact same real scripts, just a different invocation path, not a weaker verification). **Do not interpret a root-script failure as a regression in your own package** — check `TESTING_AUDIT.md` before assuming a regression.

**A real, worth-noting consistency warning**: every `lint` script across 38 of 39 packages (all except `typescript-config`, which has none) is the literal same no-op stub: `node -e "process.exit(0)"`. No real ESLint or equivalent static-analysis tool is configured anywhere in `packages/*` today. **"Lint passing" does not mean real static analysis passed** — explicitly recorded in `TESTING_AUDIT.md` F3 and `KNOWN_TECHNICAL_DEBT.md` item 2 as a high-priority unresolved item.

**Reference**: Constitution §9; `docs/AI_PROJECT_CONTEXT.md` §5; `TESTING_AUDIT.md`; CLAUDE.md §4.

---

### 9. Dependency Rules

**Rule**: No circular dependencies (ADR 0003); a shared concept is extracted downward instead of a cycle; every LLM access goes through `ai-provider-hub` exclusively (ADR 0002); check all five workspace roots before naming a new package.

**The one real exception that exists today — a warning, not a pattern to follow**: `@lateen-os/ai-brain` ⇄ `@lateen-os/multi-agent` is a real, actively-exercised circular dependency, not a stale unused declaration:

- `packages/ai-brain/package.json` declares a dependency on `@lateen-os/multi-agent`; `ai-brain/src/context/types.ts` and `ai-brain/src/shared/identifiers.ts` genuinely import the type `MissionId` from it.
- `packages/multi-agent/package.json` declares a dependency on `@lateen-os/ai-brain`; `multi-agent/src/runtime.ts` and `multi-agent/src/escalation/service.impl.ts` genuinely import the type `Brain` from it (for an optional, injected escalation collaborator).
- **Real empirical impact**: `pnpm install` succeeds but prints a warning; `turbo run build` **fails immediately** with "Cyclic dependency detected" and refuses to compute a build order for any package at all — a whole-workspace blocker for anyone relying on the root `pnpm run *` scripts.
- **The officially recommended fix** (ADR 0003, `DEPENDENCY_AUDIT.md` F1): extract the shared concept (the `Brain` slice `multi-agent` genuinely needs, and/or the `MissionId` type `ai-brain` genuinely needs) downward — into `shared-kernel` or a new shared identifiers module — then remove the direct cross-dependency. This has **not** been fixed yet; it requires a dedicated commit touching both packages together, not an incidental fix folded into an unrelated task.

**A real naming lesson**: `packages/marketplace`'s `package.json` was named `@lateen-os/marketplace` — identical to the pre-existing `apps/marketplace` (the extension-distribution frontend). This broke `pnpm`/`turbo` workspace resolution for **the entire platform**: `turbo run build` failed before doing any work at all, with `Failed to add workspace "@lateen-os/marketplace" ... it already exists at "apps\marketplace\package.json"`. Fixed in Commit 35 by renaming the backend engine to `@lateen-os/marketplace-engine` (the directory path `packages/marketplace` was left unchanged). **The binding lesson**: before naming any new package under `packages/*`, grep the exact proposed name literally across all five workspace roots: `packages/`, `apps/`, `services/`, `workflows/`, `extensions/` — not `packages/` alone.

**LLM access isolation**: every LLM call flows exclusively through `@lateen-os/ai-provider-hub` (ADR `0002-openai-compatible-providers.md`). The package's `index.ts` doc comment states this outright: *"AI Brain MUST consume this hub. Applications MUST NEVER call providers directly."* — no business engine imports a provider SDK directly.

**Reference**: Constitution §2; ADR `0003-no-cyclic-dependencies.md`, ADR `0002-openai-compatible-providers.md`; `docs/AI_PROJECT_CONTEXT.md` §4 items 1-2; `DEPENDENCY_AUDIT.md` F1, F3; `KNOWN_TECHNICAL_DEBT.md` item 1.

---

### 10. Documentation Rules

**Rule**: `@packageDocumentation` in `index.ts`; bilingual documentation for every `docs/handbook/` document; a README + ARCHITECTURE + MODEL trio per package; documentation is updated only when implementation proves it wrong — never speculatively.

**Real example**: `packages/business-dna/src/index.ts` carries a `@packageDocumentation` comment that precisely states purpose and boundaries:

```ts
/**
 * ...
 * - Aggregate type definitions and enums
 * - Value object interfaces
 * - Domain event types (`{entity}.{action}` convention)
 * - Repository port interfaces (no implementations)
 *
 * No UI, API, database, ORM, or business logic.
 * Framework-agnostic. TypeScript only.
 *
 * @packageDocumentation
 */
```

**The real state of the documentation trio**: 29 of 39 packages have the full trio (README + ARCHITECTURE + MODEL) today. The real gaps are documented explicitly, not hidden: `capability-engine`, `extension-system`, `kernel`, `shared-kernel` are missing only a MODEL document; `ceo-engine`, `sdk`, `integration-tests` are missing both ARCHITECTURE and MODEL; `connector-base`, `integration-contracts`, `typescript-config` are missing the full trio (likely a legitimate structural exemption — pure contract-only or tooling packages with no real runtime model). **No new documents were fabricated for these packages in Commit 35** — the rule was: no fabricated documentation under time pressure; real documentation requires reading the real implementation first.

**The "no speculative update" rule**: this guide itself complies with that rule — no new rule was invented, and `03_CONSTITUTION.md`'s text was not modified; everything here is an explanatory extension of an already-existing rule, backed by a real example.

**Reference**: Constitution §11; `docs/AI_PROJECT_CONTEXT.md` §10 item 7; `ARCHITECTURE_AUDIT.md` F5; `KNOWN_TECHNICAL_DEBT.md` item 7.

---

## Real Consistency Notes Found While Preparing This Guide

These were found while verifying the examples above — none of them require or trigger a source-code fix, they are documented here as instructed:

1. **An already-corrected historical discrepancy**: `docs/handbook/08_PROJECT_STATUS.md` §6/§14/§17 previously stated "zero cyclic dependencies... across 30 packages" for the Phase-1 scope. This no longer holds today because of the `ai-brain`/`multi-agent` cycle (already documented in `KNOWN_TECHNICAL_DEBT.md` item 8 as a documentation-accuracy note, not a code defect). This guide does not edit `08_PROJECT_STATUS.md` — that is out of scope for this documentation task.
2. **Lint does not mean real static analysis** across the entire platform (section 8 above) — worth flagging for anyone reading "lint: passing" and assuming a real ESLint configuration exists.
3. **CLAUDE.md and the Constitution are consistent with each other, with no contradiction found**, as far as this guide's scope: both mandate build→typecheck→tests→lint, both forbid modifying unrelated packages, both forbid committing when build/tests fail. No actual conflict was found between the two documents.

---

## Related Documents

- [03_CONSTITUTION](../handbook/03_CONSTITUTION.md)
- [00_MASTER_PLAN](../handbook/00_MASTER_PLAN.md)
- [AI_PROJECT_CONTEXT](../AI_PROJECT_CONTEXT.md)
- [PLATFORM_CERTIFICATION](../certification/PLATFORM_CERTIFICATION.md)
- [ARCHITECTURE_AUDIT](../certification/ARCHITECTURE_AUDIT.md)
- [DEPENDENCY_AUDIT](../certification/DEPENDENCY_AUDIT.md)
- [RUNTIME_AUDIT](../certification/RUNTIME_AUDIT.md)
- [INTEGRATION_AUDIT](../certification/INTEGRATION_AUDIT.md)
- [SECURITY_AUDIT](../certification/SECURITY_AUDIT.md)
- [TESTING_AUDIT](../certification/TESTING_AUDIT.md)
- [KNOWN_TECHNICAL_DEBT](../certification/KNOWN_TECHNICAL_DEBT.md)

## Related Engines

All 39 packages under `packages/*` — governed uniformly by this guide and by `03_CONSTITUTION.md`.

## Related Commits

Commit 1 (`ea48fe6`) through Commit 35 (Enterprise Platform Certification & Stabilization).
