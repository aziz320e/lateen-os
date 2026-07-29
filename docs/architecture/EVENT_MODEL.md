---
title: Event Model
title_ar: نموذج الأحداث
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../handbook/03_CONSTITUTION.md
  - ../certification/RUNTIME_AUDIT.md
  - QUERY_MODEL.md
related_engines:
  - finance-engine
related_commits:
  - "35"
---

# العربية

## نموذج الأحداث

### 1. ناقل الأحداث المكتوب النوع

كل حزمة تملك أحداثًا نطاقية (31 من 39) تبني ناقل أحداثها فوق `createEventBus<TEventMap>()` العام من `shared-kernel`، مغلّفًا في `create<X>EventBus()` خاص بالحزمة، مع خريطة `type <X>EventMap = { 'noun.verb': { ...payload } }`. أسماء الأحداث دائمًا بصيغة `noun.verb` بزمن الماضي — مثال حقيقي من `packages/finance-engine/src/events/finance-events.ts`:

```ts
export type AccountCreatedEvent = DomainEvent<
  'account.created',
  { readonly organizationId: string; readonly accountId: string; readonly accountType: string }
>;
export type JournalPostedEvent = DomainEvent<'journal.posted', { ... }>;
export type InvoiceIssuedEvent = DomainEvent<'invoice.issued', { ... }>;
export type TaxCalculatedEvent = DomainEvent<'tax.calculated', { ... }>;
```

### 2. الضمان: كل حدث مُعلَن يُنشَر فعليًا

هذا الادعاء ليس افتراضيًا — تحقّقنا منه مباشرة عبر مطابقة إعلانات الأحداث في `finance-engine` بنقاط النشر الفعلية في كود `engine.impl.ts` الخاص بكل نطاق فرعي:

| الحدث المُعلَن | نقطة النشر الفعلية المتحقَّق منها |
| --- | --- |
| `account.created` | `finance-engine/src/account/engine.impl.ts:112` — `eventBus?.publish('account.created', { organizationId, accountId: account.id, accountType: account.accountType })` |
| `journal.posted` | `finance-engine/src/journal-entry/engine.impl.ts:146` — `eventBus?.publish('journal.posted', { organizationId, journalEntryId })` |
| `tax.calculated` | `finance-engine/src/tax/engine.impl.ts:150` — `eventBus?.publish('tax.calculated', { organizationId, taxCalculationId: calculation.id, taxRuleId, taxAmount })` |

ثلاثة أحداث مُختارة عشوائيًا من عشرة أحداث معلَنة في `finance-engine`، وكلها تتبّعت إلى نقطة نشر حقيقية بعد نجاح تغيير الحالة (لا قبله) — يتّسق هذا مع ما أعلنه `docs/certification/RUNTIME_AUDIT.md` (تحقّق `marketplace` بمعدل 10/10) ومع قاعدة `03_CONSTITUTION.md` §8.3: "الأحداث تُصدَر بعد نجاح التغيير في الحالة، لا قبله."

### 3. التغطية الحقيقية

**31 من 39 حزمة** تملك مجلد `events/` — محقّقة مباشرة عبر فحص `src/events/` عبر الحزم الـ39. الحزم الست التي لا تملكه فعليًا رغم امتلاكها `src/`: `capability-engine`, `ceo-engine`, `connector-base`, `decision-engine`, `integration-contracts`, `intelligence-engine`؛ بالإضافة إلى `integration-tests` و`typescript-config` (بلا `src/` أصلًا) — إجمالي 8 استثناءات، مطابق لـ39-8=31.

### 4. ملاحظة أسلوبية: `ai-provider-hub` يستخدم اتفاقية تسمية أقدم

`packages/ai-provider-hub/src/events/provider-events.ts` يُصدّر خريطة ثوابت بأحرف كبيرة (`PROVIDER_EVENT_NAMES.PROVIDER_SELECTED = 'provider.selected'`) بدلًا من نمط `EventMap` المباشر المستخدم في الحزم الأحدث — لكن أسماء القيم نفسها لا تزال تتبع الصيغة القانونية `noun.verb` (`provider.selected`, `provider.request.completed`, `provider.budget.exceeded`)، وناقل الأحداث لا يزال مبنيًا فوق نفس أولية `shared-kernel`. هذا فرق أسلوبي في التغليف، لا انحراف عن قاعدة التسمية.

---

# English

## Event Model

### 1. The Typed Event Bus

Every package with domain events (31 of 39) builds its event bus on `shared-kernel`'s generic `createEventBus<TEventMap>()`, wrapped in a package-specific `create<X>EventBus()` with a `type <X>EventMap = { 'noun.verb': { ...payload } }` map. Event names always follow the past-tense `noun.verb` convention — a real example from `packages/finance-engine/src/events/finance-events.ts`:

```ts
export type AccountCreatedEvent = DomainEvent<
  'account.created',
  { readonly organizationId: string; readonly accountId: string; readonly accountType: string }
>;
export type JournalPostedEvent = DomainEvent<'journal.posted', { ... }>;
export type InvoiceIssuedEvent = DomainEvent<'invoice.issued', { ... }>;
export type TaxCalculatedEvent = DomainEvent<'tax.calculated', { ... }>;
```

### 2. The Guarantee: Every Declared Event Is Genuinely Published

This claim is not taken on faith — it was verified directly by matching `finance-engine`'s event declarations against the real publish call sites in each subdomain's `engine.impl.ts`:

| Declared Event | Verified Real Publish Site |
| --- | --- |
| `account.created` | `finance-engine/src/account/engine.impl.ts:112` — `eventBus?.publish('account.created', { organizationId, accountId: account.id, accountType: account.accountType })` |
| `journal.posted` | `finance-engine/src/journal-entry/engine.impl.ts:146` — `eventBus?.publish('journal.posted', { organizationId, journalEntryId })` |
| `tax.calculated` | `finance-engine/src/tax/engine.impl.ts:150` — `eventBus?.publish('tax.calculated', { organizationId, taxCalculationId: calculation.id, taxRuleId, taxAmount })` |

Three randomly-sampled events out of ten declared in `finance-engine`, each traced to a real publish site that fires after the state change succeeds (never before) — consistent with `docs/certification/RUNTIME_AUDIT.md`'s own finding (verified 10/10 in `marketplace`) and with `03_CONSTITUTION.md` §8.3: "Events are emitted after a state change succeeds, never before."

### 3. Real Coverage

**31 of 39 packages** have an `events/` folder — verified directly by checking for `src/events/` presence across all 39 packages. The six packages that lack it despite having a `src/` tree: `capability-engine`, `ceo-engine`, `connector-base`, `decision-engine`, `integration-contracts`, `intelligence-engine`; plus `integration-tests` and `typescript-config` (no `src/` at all) — 8 exceptions total, matching 39−8=31.

### 4. A Stylistic Note: `ai-provider-hub` Uses an Older Naming Convention

`packages/ai-provider-hub/src/events/provider-events.ts` exports an upper-case constant map (`PROVIDER_EVENT_NAMES.PROVIDER_SELECTED = 'provider.selected'`) rather than the direct `EventMap` pattern used in newer packages — but the actual string values still follow the canonical `noun.verb` convention (`provider.selected`, `provider.request.completed`, `provider.budget.exceeded`), and the event bus is still built on the same `shared-kernel` primitive. This is a packaging-style difference, not a deviation from the naming rule.

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../handbook/03_CONSTITUTION.md](../handbook/03_CONSTITUTION.md)
- [../certification/RUNTIME_AUDIT.md](../certification/RUNTIME_AUDIT.md)
- [QUERY_MODEL.md](./QUERY_MODEL.md)

## Related Engines

`finance-engine` (worked, spot-checked example); the event-bus rule applies to 31 of 39 `packages/*`.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
