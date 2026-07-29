---
title: Inventory Engine
title_ar: محرك المخزون
version: 1.0.0
status: active
package: "@lateen-os/inventory-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
related_packages:
  - finance-engine
  - hr-engine
  - business-dna
  - workflow-engine
  - communication-hub
  - analytics-engine
  - institutional-memory
---

# العربية

## محرك المخزون — Inventory Engine

### 1. الغرض

`@lateen-os/inventory-engine` يملك كتالوج المخزون (أصناف، فئات، علامات تجارية)، إدارة المستودعات (مستودعات، مناطق، مواقع تخزين، صناديق)، مخزون Lateen OS، حركات المخزون، تقييم المخزون (FIFO/متوسط مرجّح)، جرد المخزون، وإعداد المشتريات، ويربط Finance Engine وSales Engine وBusiness DNA وWorkflow Engine وCommunication Hub وAnalytics Engine وInstitutional Memory نيابة عن نطاق المخزون. حزمة من الجيل الثاني تتبع النمط الصارم بالكامل.

### 2. المسؤوليات

- كتالوج المخزون: أصناف، فئات، علامات تجارية بدورة حياة محمية.
- إدارة المستودعات: مستودعات، مناطق، مواقع تخزين، صناديق، مع حساب السعة المتبقية.
- مخزون Lateen OS: حساب الكمية المتاحة، وكشف الانخفاض عن حد إعادة الطلب/الحد الأدنى/تجاوز الحد الأقصى.
- حركات المخزون: استلام، صرف، تحويل، تسوية، إرجاع، حجز، إطلاق حجز — مُركّبة مع محرك المخزون.
- تقييم المخزون: استهلاك FIFO وحساب التكلفة المتوسطة المرجّحة.
- جرد المخزون: عد فعلي مُركّب مع المخزون والحركات، حساب التباين.
- إعداد المشتريات: مُركّب مع المخزون — كشف نقص، اقتراح كمية إعادة طلب.

### 3. خارج نطاق المسؤولية

- لا استدلال بنماذج لغة كبيرة.
- لا ترحيل محاسبي فعلي من طرف هذه الحزمة — أي قيد دفتر أستاذ حقيقي يمر عبر Finance Engine العام فقط.
- لا تعديل مباشر لأي حزمة شقيقة.

### 4. وقت التشغيل العام

جذر التركيب **`createInventoryRuntime(deps = {})`** في `src/runtime.ts` يُرجع `InventoryRuntime`: `catalog`، `warehouses`، `stock`، `movements`، `valuation`، `counting`، `procurement`، `relationships`، `queries`، و`events`.

### 5. الاستعلامات العامة

طبقة `InventoryQueries`: `findItems`، `findWarehouses`، `findInventory`، `findMovements`، `findReservations`، `findValuations`، `findCounts`، `searchInventory`.

### 6. الأحداث المكتوبة النوع

عشرة أحداث حقيقية في `InventoryDomainEvent`: `inventory.item.created`، `inventory.received`، `inventory.issued`، `inventory.transferred`، `inventory.adjusted`، `inventory.reserved`، `inventory.released`، `inventory.count.completed`، `inventory.shortage.detected`، `inventory.reorder.recommended`.

### 7. الاعتماديات

`@lateen-os/analytics-engine`، `@lateen-os/business-dna`، `@lateen-os/communication-hub`، `@lateen-os/finance-engine`، `@lateen-os/institutional-memory`، `@lateen-os/sales-engine`، `@lateen-os/shared-kernel`، `@lateen-os/workflow-engine`.

### 8. الحزم المعتمِدة

`@lateen-os/api-gateway`، `@lateen-os/project-management-engine`.

### 9. نقاط التكامل

عبر `relationship-management/`:

- **Business DNA** — `getProductContext()` عبر `products.getProduct()` (`Pick<BusinessDnaRuntime, 'products'>`).
- **Sales Engine** — `getOpportunityContext()` عبر `opportunities.get()` (`Pick<SalesRuntime, 'opportunities'>`).
- **Finance Engine** — `recordInventoryValuationEntry()` يركّب `generalLedger.createJournalEntry()` + `postJournalEntry()` حقيقيين لتسجيل حركة تقييم مخزون — النقطة الوحيدة التي تلامس فيها هذه الحزمة المحاسبة، ودون تنفيذ المحاسبة بنفسها (`Pick<FinanceRuntime, 'generalLedger'>`).
- **Workflow Engine** — `raiseInventoryApprovalWorkflow()` يركّب `defineWorkflow()` + `startWorkflow()` حقيقيين.
- **Communication Hub** — `notifyInventoryEvent()` عبر إشعار `'escalation'` حقيقي.
- **Analytics Engine** — `recordInventoryValueMetric()` عبر `metrics.recordGauge()`.
- **Institutional Memory** — `logInventoryDecisionToMemory()` يسجّل إدخال معرفة `'decision'` حقيقي بفئة `'operational'`.

كل تعاون اختياري ويتدهور إلى `null` عند عدم الحقن.

### 10. ملاحظات معمارية

تلتزم الحزمة بالكامل بالنمط الصارم للجيل الثاني. تكامل الفواتير/التقييم مع Finance Engine يوضّح مبدأ "لا تنفيذ محاسبة داخل حزمة غير مالية" — Inventory Engine يركّب قيد يومية حقيقيًا عبر واجهة Finance Engine العامة فقط، ولا يحسب توازن القيد أو يرحّله بمنطقه الخاص.

### 11. قرارات التصميم

- استهلاك FIFO والتكلفة المتوسطة المرجّحة حسابات حتمية صرفة، لا تقدير.
- كشف النقص واقتراح إعادة الطلب محسوبان من حدود حتمية (حد أدنى/حد إعادة طلب)، لا تنبؤ.

### 12. نقاط التوسعة

أي حزمة مستقبلية تحتاج بيانات مخزون يجب أن تستهلك `createInventoryRuntime()` العام فقط — لا وصول مباشر لأي `repository.ts` داخلي، ولا تعديل هذه الحزمة لإضافة تكامل جديد.

### 13. المحركات ذات الصلة

- [finance-engine](./finance-engine.md)
- [hr-engine](./hr-engine.md)
- [institutional-memory](./institutional-memory.md)

---

# English

## Inventory Engine

### 1. Purpose

`@lateen-os/inventory-engine` owns the inventory catalog (items, categories, brands), warehouse management (warehouses, zones, storage locations, bins), inventory stock, inventory movements, stock valuation (FIFO/Weighted Average), inventory counting, and procurement preparation for Lateen OS, and integrates Finance Engine, Sales Engine, Business DNA, Workflow Engine, Communication Hub, Analytics Engine, and Institutional Memory on behalf of the inventory domain. An Era-2 package following the rigid construction pattern in full.

### 2. Responsibilities

- Inventory Catalog: items, categories, brands with a guarded lifecycle.
- Warehouse Management: warehouses, zones, storage locations, bins, with remaining-capacity computation.
- Inventory Stock: available-quantity computation and detection of falling below reorder point/minimum or above maximum.
- Inventory Movements: receive, issue, transfer, adjust, return, reserve, release — composed with the Stock engine.
- Stock Valuation: FIFO consumption and weighted-average cost computation.
- Inventory Counting: physical counts composed with Stock and Movements, variance computation.
- Procurement Preparation: composed with Stock — shortage detection, suggested reorder quantity.

### 3. Non-responsibilities

- No LLM/AI inference.
- No actual accounting posting performed by this package itself — any real ledger entry flows through Finance Engine's own public API only.
- No direct modification of any sibling package.

### 4. Public Runtime

The composition root **`createInventoryRuntime(deps = {})`** in `src/runtime.ts` returns an `InventoryRuntime`: `catalog`, `warehouses`, `stock`, `movements`, `valuation`, `counting`, `procurement`, `relationships`, `queries`, and `events`.

### 5. Public Queries

An `InventoryQueries` layer: `findItems`, `findWarehouses`, `findInventory`, `findMovements`, `findReservations`, `findValuations`, `findCounts`, `searchInventory`.

### 6. Typed Events

Ten real events in `InventoryDomainEvent`: `inventory.item.created`, `inventory.received`, `inventory.issued`, `inventory.transferred`, `inventory.adjusted`, `inventory.reserved`, `inventory.released`, `inventory.count.completed`, `inventory.shortage.detected`, `inventory.reorder.recommended`.

### 7. Dependencies

`@lateen-os/analytics-engine`, `@lateen-os/business-dna`, `@lateen-os/communication-hub`, `@lateen-os/finance-engine`, `@lateen-os/institutional-memory`, `@lateen-os/sales-engine`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine`.

### 8. Dependents

`@lateen-os/api-gateway`, `@lateen-os/project-management-engine`.

### 9. Integration Points

Through `relationship-management/`:

- **Business DNA** — `getProductContext()` via `products.getProduct()` (`Pick<BusinessDnaRuntime, 'products'>`).
- **Sales Engine** — `getOpportunityContext()` via `opportunities.get()` (`Pick<SalesRuntime, 'opportunities'>`).
- **Finance Engine** — `recordInventoryValuationEntry()` composes real `generalLedger.createJournalEntry()` + `postJournalEntry()` to record an inventory valuation movement — the only place this package touches accounting, and it never implements the accounting itself (`Pick<FinanceRuntime, 'generalLedger'>`).
- **Workflow Engine** — `raiseInventoryApprovalWorkflow()` composes real `defineWorkflow()` + `startWorkflow()`.
- **Communication Hub** — `notifyInventoryEvent()` via a real `'escalation'` notification.
- **Analytics Engine** — `recordInventoryValueMetric()` via `metrics.recordGauge()`.
- **Institutional Memory** — `logInventoryDecisionToMemory()` logs a real `'decision'` knowledge entry with category `'operational'`.

Every collaborator is optional and degrades to `null` when not injected.

### 10. Architecture Notes

The package follows the rigid Era-2 pattern in full. Its invoicing/valuation integration with Finance Engine illustrates the principle of "no accounting implemented inside a non-finance package" — Inventory Engine composes a real journal entry purely through Finance Engine's public API and never balances or posts the entry with its own logic.

### 11. Design Decisions

- FIFO consumption and weighted-average cost are pure deterministic calculations, not estimates.
- Shortage detection and reorder suggestion are computed from deterministic thresholds (minimum/reorder point), not forecasting.

### 12. Extension Points

Any future package needing inventory data should consume the public `createInventoryRuntime()` only — no direct access to any internal `repository.ts`, and no modification of this package to add a new integration.

### 13. Related Engines

- [finance-engine](./finance-engine.md)
- [hr-engine](./hr-engine.md)
- [institutional-memory](./institutional-memory.md)
