---
title: Runtime Model
title_ar: نموذج وقت التشغيل
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../handbook/03_CONSTITUTION.md
  - ../certification/RUNTIME_AUDIT.md
  - COMPOSITION_ROOTS.md
related_engines:
  - finance-engine
related_commits:
  - "35"
---

# العربية

## نموذج وقت التشغيل

### 1. القاعدة: السطح العام لا يُصدّر مستودعًا أبدًا

كل حزمة تُشكّل سطحها العام (Runtime) بحيث لا يُرجع أبدًا مستودعًا (`*Repository`/`*Repo`) — يُرجع فقط خدمات، استعلامات (`queries`)، وناقل أحداث (`events`). تحقّق `docs/certification/RUNTIME_AUDIT.md` من هذا عبر فحص كل واجهة `XRuntime` سطرًا-بسطر عبر الحزم الـ39 — صفر استثناءات. المستودعات تُبنى فقط داخل `runtime.ts`، وتُحقن بالإغلاق (closure) داخل الخدمات — لا تُعاد للمستدعي أبدًا.

### 2. مثال حقيقي: التركيب الداخلي لـ `finance-engine`

`packages/finance-engine/src/runtime.ts` هو المثال الأوضح لحزمة عصر ثانٍ ناضجة: يُنشئ 20 مستودعًا في-الذاكرة (سنوات مالية، فترات مالية، إعدادات محاسبة، تسلسلات ترقيم، حسابات، قيود يومية، قوالب قيود متكررة، عملاء الذمم، فواتير، إشعارات دائنة، مدفوعات، موردون، فواتير شراء، إشعارات مدينة، حسابات نقدية، معاملات خزينة، تسويات، ميزانيات، مراجعات ميزانية، قواعد ضريبية، حسابات ضريبية، تقارير مالية) — كلها محجوبة تمامًا خلف 9 محركات فرعية (`financialOrganization`, `chartOfAccounts`, `generalLedger`, `accountsReceivable`, `accountsPayable`, `treasury`, `budgets`, `tax`, `reports`)، ثم `relationships` (طبقة العلاقات مع `crm`, `sales`, `businessDna`, `workflow`, `communicationHub`, `analytics`, `institutionalMemory`)، و`queries`، و`events` — مُجمَّعة في كائن `FinanceRuntime` واحد يُرجعه `createFinanceRuntime(deps = {})`.

### 3. مخطط تركيب `finance-engine` الفعلي

```mermaid
flowchart TB
    subgraph Repos["المستودعات (20، مخفية تمامًا)"]
        R1["fiscalYear · fiscalPeriod<br/>accountingSettings · numberingSequence"]
        R2["account"]
        R3["journalEntry · recurringJournalTemplate"]
        R4["arCustomer · arInvoice · creditNote · arPayment"]
        R5["vendor · bill · vendorCredit · apPayment"]
        R6["cashAccount · treasuryTransaction · reconciliation"]
        R7["budget · budgetRevision"]
        R8["taxRule · taxCalculation"]
        R9["financeReport"]
    end

    subgraph Engines["المحركات الفرعية (9)"]
        E1[financialOrganization]
        E2[chartOfAccounts]
        E3[generalLedger]
        E4[accountsReceivable]
        E5[accountsPayable]
        E6[treasury]
        E7[budgets]
        E8[tax]
        E9[reports]
    end

    R1 --> E1
    R2 --> E2
    R3 --> E3
    R4 --> E4
    R5 --> E5
    R6 --> E6
    R7 --> E7
    R2 --> E7
    R3 --> E7
    R8 --> E8
    R9 --> E9
    R2 --> E9
    R3 --> E9
    R6 --> E9
    E4 --> E9
    E5 --> E9

    subgraph Runtime["FinanceRuntime (مُرجَع)"]
        RT_ENGINES["financialOrganization · chartOfAccounts · generalLedger<br/>accountsReceivable · accountsPayable · treasury<br/>budgets · tax · reports"]
        RT_REL["relationships"]
        RT_Q["queries"]
        RT_EV["events"]
    end

    E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8 & E9 --> RT_ENGINES

    subgraph Siblings["اعتماديات اختيارية (طبقة العلاقات)"]
        S1[crm-engine]
        S2[sales-engine]
        S3[business-dna]
        S4[workflow-engine]
        S5[communication-hub]
        S6[analytics-engine]
        S7[institutional-memory]
    end
    S1 & S2 & S3 & S4 & S5 & S6 & S7 -. "Pick&lt;SiblingRuntime,'...'&gt; اختياري" .-> RT_REL

    RT_ENGINES --> RT_REL --> RT_Q --> RT_EV
```

لاحظ: أي مستودع (`Repos`) لا يظهر أبدًا في `Runtime` (المُرجَع) — فقط المحركات المبنية فوقه.

### 4. الضمان العام

هذا النمط مطابق حرفيًا عبر الحزم الـ39 (بالتفاوتات الموثّقة في [COMPOSITION_ROOTS](./COMPOSITION_ROOTS.md)) — أي مستهلك لحزمة `finance-engine` (مثل `api-gateway` أو `admin-console`) يستدعي `createFinanceRuntime()` ويحصل على `FinanceRuntime` فقط، دون أي وصول ممكن لأي مستودع من الـ20 المذكورة أعلاه.

---

# English

## Runtime Model

### 1. The Rule: The Public Surface Never Exports a Repository

Every package shapes its public Runtime surface so it never returns a repository (`*Repository`/`*Repo`) — only services, queries, and an event bus. `docs/certification/RUNTIME_AUDIT.md` verified this by inspecting every `XRuntime` interface line-by-line across all 39 packages — zero exceptions. Repositories are constructed only inside `runtime.ts` and injected by closure into services — never returned to the caller.

### 2. A Real Example: `finance-engine`'s Internal Composition

`packages/finance-engine/src/runtime.ts` is the clearest example of a mature Era-2 package: it constructs 20 in-memory repositories (fiscal years, fiscal periods, accounting settings, numbering sequences, accounts, journal entries, recurring journal templates, AR customers, AR invoices, credit notes, AR payments, vendors, bills, vendor credits, AP payments, cash accounts, treasury transactions, reconciliations, budgets, budget revisions, tax rules, tax calculations, finance reports) — all fully hidden behind 9 sub-engines (`financialOrganization`, `chartOfAccounts`, `generalLedger`, `accountsReceivable`, `accountsPayable`, `treasury`, `budgets`, `tax`, `reports`), then `relationships` (the Relationship Layer with `crm`, `sales`, `businessDna`, `workflow`, `communicationHub`, `analytics`, `institutionalMemory`), `queries`, and `events` — all assembled into one `FinanceRuntime` object returned by `createFinanceRuntime(deps = {})`.

### 3. `finance-engine`'s Real Composition Diagram

```mermaid
flowchart TB
    subgraph Repos["Repositories (20, fully hidden)"]
        R1["fiscalYear · fiscalPeriod<br/>accountingSettings · numberingSequence"]
        R2["account"]
        R3["journalEntry · recurringJournalTemplate"]
        R4["arCustomer · arInvoice · creditNote · arPayment"]
        R5["vendor · bill · vendorCredit · apPayment"]
        R6["cashAccount · treasuryTransaction · reconciliation"]
        R7["budget · budgetRevision"]
        R8["taxRule · taxCalculation"]
        R9["financeReport"]
    end

    subgraph Engines["Sub-Engines (9)"]
        E1[financialOrganization]
        E2[chartOfAccounts]
        E3[generalLedger]
        E4[accountsReceivable]
        E5[accountsPayable]
        E6[treasury]
        E7[budgets]
        E8[tax]
        E9[reports]
    end

    R1 --> E1
    R2 --> E2
    R3 --> E3
    R4 --> E4
    R5 --> E5
    R6 --> E6
    R7 --> E7
    R2 --> E7
    R3 --> E7
    R8 --> E8
    R9 --> E9
    R2 --> E9
    R3 --> E9
    R6 --> E9
    E4 --> E9
    E5 --> E9

    subgraph Runtime["FinanceRuntime (returned)"]
        RT_ENGINES["financialOrganization · chartOfAccounts · generalLedger<br/>accountsReceivable · accountsPayable · treasury<br/>budgets · tax · reports"]
        RT_REL["relationships"]
        RT_Q["queries"]
        RT_EV["events"]
    end

    E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8 & E9 --> RT_ENGINES

    subgraph Siblings["Optional Sibling Dependencies (Relationship Layer)"]
        S1[crm-engine]
        S2[sales-engine]
        S3[business-dna]
        S4[workflow-engine]
        S5[communication-hub]
        S6[analytics-engine]
        S7[institutional-memory]
    end
    S1 & S2 & S3 & S4 & S5 & S6 & S7 -. "optional Pick&lt;SiblingRuntime,'...'&gt;" .-> RT_REL

    RT_ENGINES --> RT_REL --> RT_Q --> RT_EV
```

Note: no repository (`Repos`) ever appears in `Runtime` (the returned surface) — only the engines built on top of them.

### 4. The Platform-Wide Guarantee

This pattern is byte-for-byte consistent across all 39 packages (with the documented variances in [COMPOSITION_ROOTS](./COMPOSITION_ROOTS.md)) — any consumer of `finance-engine` (e.g. `api-gateway` or `admin-console`) calls `createFinanceRuntime()` and receives only a `FinanceRuntime` — with no possible access to any of the 20 repositories listed above.

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../handbook/03_CONSTITUTION.md](../handbook/03_CONSTITUTION.md)
- [../certification/RUNTIME_AUDIT.md](../certification/RUNTIME_AUDIT.md)
- [COMPOSITION_ROOTS.md](./COMPOSITION_ROOTS.md)

## Related Engines

`finance-engine` (worked example); the runtime-shape rule applies to all 39 `packages/*`.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
