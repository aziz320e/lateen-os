---
title: Package Catalog
title_ar: كتالوج الحزم
version: 1.0.0
status: active
phase: "Milestone 2 — Documentation Sprint (Complete)"
owner: Lateen OS Architecture Office
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/DEPENDENCY_AUDIT.md
  - ../certification/RUNTIME_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
  - PACKAGE_MAP.md
  - DEPENDENCY_MODEL.md
  - COMPOSITION_ROOTS.md
  - RELATIONSHIP_MODEL.md
  - EVENT_MODEL.md
  - QUERY_MODEL.md
related_engines:
  - all
related_commits:
  - "35"
---

# العربية

## كتالوج الحزم

### 0. منهجية

كل جدول أدناه مبني من بيانات حقيقية: `node -pe "require('./package.json')..."` لكل `packages/*/package.json` (39 ملفًا)، وفحص وجود مجلدات (`relationship-management/`, `queries/`, `events/`) عبر كل `packages/*/src`، وفحص أسماء الدوال المُصدَّرة عبر `grep` مباشر على `runtime.ts` أو ملف التركيب المكافئ. لا صف اختُرع.

### 1. مصفوفة الحزم (39/39)

| الحزمة | اسم npm | الطبقة / العصر | الغرض (سطر واحد) |
| --- | --- | --- | --- |
| shared-kernel | `@lateen-os/shared-kernel` | الأساس / عصر 1 | كتل بناء DDD الأساسية لكل حزمة |
| ai-provider-hub | `@lateen-os/ai-provider-hub` | تجريد LLM / عصر 1 | تجريد مزوّدي نماذج اللغة القانوني |
| decision-engine | `@lateen-os/decision-engine` | مكدّس الاستدلال / عصر 1 | طبقة القرار القانونية |
| intelligence-engine | `@lateen-os/intelligence-engine` | مكدّس الاستدلال / عصر 1 | الاكتشاف والتحليل والتنبؤ |
| ai-runtime | `@lateen-os/ai-runtime` | مكدّس الاستدلال / عصر 1 | نظام تشغيل وكلاء الذكاء الاصطناعي |
| ai-brain | `@lateen-os/ai-brain` | مكدّس الاستدلال / عصر 1 | طبقة الاستدلال المؤسسي المركزية |
| ceo-engine | `@lateen-os/ceo-engine` | مكدّس الاستدلال / عصر 1 | تفويض المهمات لوكلاء تنفيذيين |
| workflow-engine | `@lateen-os/workflow-engine` | التنسيق / عصر 1 | طبقة تنسيق سير العمل القانونية |
| multi-agent | `@lateen-os/multi-agent` | التنسيق / عصر 1 | تنسيق فوق فريق العمل الذكي |
| ai-workforce | `@lateen-os/ai-workforce` | التنسيق / عصر 1 | الطبقة التنظيمية للموظفين الرقميين |
| business-dna | `@lateen-os/business-dna` | بنية تحتية نطاقية / عصر 1 | النموذج النطاقي القانوني |
| institutional-memory | `@lateen-os/institutional-memory` | بنية تحتية نطاقية / عصر 1 | الذاكرة المؤسسية طويلة الأمد |
| domain-graph | `@lateen-os/domain-graph` | بنية تحتية نطاقية / عصر 1 | العلاقات الدلالية بين كيانات Business DNA |
| capability-engine | `@lateen-os/capability-engine` | بنية تحتية نطاقية / عصر 1 | نمذجة قدرات الشركة بمعزل عن آلة بعينها |
| crm-engine | `@lateen-os/crm-engine` | محرك أعمال / عصر 1 | إدارة العملاء والفرص وجهات الاتصال |
| sales-engine | `@lateen-os/sales-engine` | محرك أعمال / عصر 1 | دورة حياة فرص البيع وخط الأنابيب |
| marketing-engine | `@lateen-os/marketing-engine` | محرك أعمال / عصر 1 | الحملات والجماهير وتوليد العملاء المحتملين |
| communication-hub | `@lateen-os/communication-hub` | محرك أعمال / عصر 1 | المحادثات والقنوات والإشعارات |
| finance-engine | `@lateen-os/finance-engine` | محرك أعمال / عصر 2 | المالية: دفتر الأستاذ، الذمم، الخزينة، الضرائب |
| hr-engine | `@lateen-os/hr-engine` | محرك أعمال / عصر 2 | الموارد البشرية: الهيكل، الموظفون، الرواتب |
| inventory-engine | `@lateen-os/inventory-engine` | محرك أعمال / عصر 2 | المخزون: الكتالوج والمستودعات والتقييم |
| project-management-engine | `@lateen-os/project-management-engine` | محرك أعمال / عصر 2 | إدارة المشاريع والمحافظ والموارد |
| customer-success-engine | `@lateen-os/customer-success-engine` | محرك أعمال / عصر 2 | نجاح العملاء وصحتهم وخطط التجديد |
| document-management-engine | `@lateen-os/document-management-engine` | محرك أعمال / عصر 2 | دورة حياة المستندات وضبط الإصدارات |
| ai-security-engine | `@lateen-os/ai-security-engine` | طبقة الثقة / عصر 1 | الهوية والمصادقة والأسرار وأمن النماذج |
| ai-governance-engine | `@lateen-os/ai-governance-engine` | طبقة الثقة / عصر 1 | سياسات الحوكمة والموافقة البشرية |
| ai-compliance-engine | `@lateen-os/ai-compliance-engine` | طبقة الثقة / عصر 1 | أطر الامتثال وعناصر التحكم والتدقيق |
| analytics-engine | `@lateen-os/analytics-engine` | أفقي/تشغيلي / عصر 1 | مؤشرات الأداء ولوحات المعلومات التنفيذية |
| observability-engine | `@lateen-os/observability-engine` | أفقي/تشغيلي / عصر 1 | التسجيل والمقاييس والتتبع والتنبيه |
| api-gateway | `@lateen-os/api-gateway` | سطح المنصة / عصر 2 | سجلات API والمصادقة وتحديد المعدل |
| admin-console | `@lateen-os/admin-console` | سطح المنصة / عصر 2 | إدارة الهوية وإعدادات النظام والتدقيق |
| marketplace | `@lateen-os/marketplace-engine` | سطح المنصة / عصر 2 | سجل الإضافات والحزم وصندوق الحماية |
| sdk | `@lateen-os/sdk` | سطح المطوّر / عصر 1 | الواجهة الرسمية لمطوّري Lateen OS |
| kernel | `@lateen-os/kernel` | سطح المطوّر / عصر 1 | الطبقة التشغيلية للمنصة |
| extension-system | `@lateen-os/extension-system` | سطح المطوّر / عصر 1 | اكتشاف الإضافات والتحقق منها وتحميلها |
| connector-base | `@lateen-os/connector-base` | سطح المطوّر / عصر 1 | تنفيذ موفّر الموصلات الأساسي |
| integration-contracts | `@lateen-os/integration-contracts` | سطح المطوّر / عصر 1 | عقود موفّري التكامل المشتركة |
| typescript-config | `@lateen-os/typescript-config` | سطح المطوّر / عصر 1 | إعدادات TypeScript المشتركة (بلا كود تشغيلي) |
| integration-tests | `@lateen-os/integration-tests` | سطح المطوّر / عصر 1 | جناح اختبارات تكامل شامل عبر `createLateen()` |

### 2. مصفوفة الاعتماديات (اعتماديات `@lateen-os/*` الحقيقية فقط، من `package.json`)

| الحزمة | اعتماديات `@lateen-os/*` |
| --- | --- |
| shared-kernel | (لا شيء) |
| ai-provider-hub | shared-kernel |
| decision-engine | business-dna, capability-engine, domain-graph, institutional-memory, shared-kernel |
| intelligence-engine | business-dna, capability-engine, decision-engine, domain-graph, institutional-memory, shared-kernel |
| ai-runtime | ai-provider-hub, business-dna, capability-engine, decision-engine, domain-graph, institutional-memory, intelligence-engine, shared-kernel |
| ai-brain | ai-runtime, ai-workforce, business-dna, decision-engine, domain-graph, institutional-memory, multi-agent, shared-kernel, workflow-engine |
| ceo-engine | shared-kernel |
| workflow-engine | ai-runtime, ai-workforce, business-dna, decision-engine, shared-kernel |
| multi-agent | ai-brain, ai-runtime, ai-workforce, business-dna, decision-engine, institutional-memory, shared-kernel, workflow-engine |
| ai-workforce | ai-runtime, business-dna, decision-engine, institutional-memory, intelligence-engine, shared-kernel |
| business-dna | shared-kernel |
| institutional-memory | business-dna, domain-graph, shared-kernel |
| domain-graph | business-dna, capability-engine, shared-kernel |
| capability-engine | business-dna, shared-kernel |
| crm-engine | business-dna, domain-graph, institutional-memory, shared-kernel |
| sales-engine | business-dna, crm-engine, institutional-memory, shared-kernel, workflow-engine |
| marketing-engine | business-dna, crm-engine, domain-graph, institutional-memory, sales-engine, shared-kernel, workflow-engine |
| communication-hub | ai-workforce, business-dna, crm-engine, institutional-memory, marketing-engine, sales-engine, shared-kernel, workflow-engine |
| finance-engine | analytics-engine, business-dna, communication-hub, crm-engine, institutional-memory, sales-engine, shared-kernel, workflow-engine |
| hr-engine | ai-workforce, analytics-engine, business-dna, communication-hub, finance-engine, institutional-memory, shared-kernel, workflow-engine |
| inventory-engine | analytics-engine, business-dna, communication-hub, finance-engine, institutional-memory, sales-engine, shared-kernel, workflow-engine |
| project-management-engine | analytics-engine, business-dna, communication-hub, crm-engine, finance-engine, hr-engine, institutional-memory, inventory-engine, shared-kernel, workflow-engine |
| customer-success-engine | analytics-engine, business-dna, communication-hub, crm-engine, institutional-memory, project-management-engine, sales-engine, shared-kernel |
| document-management-engine | analytics-engine, business-dna, communication-hub, crm-engine, customer-success-engine, institutional-memory, project-management-engine, shared-kernel, workflow-engine |
| ai-security-engine | ai-brain, ai-provider-hub, ai-runtime, business-dna, communication-hub, shared-kernel, workflow-engine |
| ai-governance-engine | ai-brain, ai-runtime, ai-security-engine, business-dna, communication-hub, shared-kernel, workflow-engine |
| ai-compliance-engine | ai-governance-engine, ai-security-engine, business-dna, communication-hub, shared-kernel, workflow-engine |
| analytics-engine | ai-compliance-engine, ai-governance-engine, ai-security-engine, ai-workforce, business-dna, communication-hub, crm-engine, decision-engine, domain-graph, institutional-memory, intelligence-engine, marketing-engine, sales-engine, shared-kernel, workflow-engine |
| observability-engine | ai-compliance-engine, ai-governance-engine, ai-runtime, ai-security-engine, analytics-engine, communication-hub, shared-kernel, workflow-engine |
| api-gateway | ai-compliance-engine, ai-governance-engine, ai-runtime, ai-security-engine, analytics-engine, business-dna, communication-hub, crm-engine, customer-success-engine, finance-engine, hr-engine, inventory-engine, marketing-engine, observability-engine, project-management-engine, sales-engine, shared-kernel, workflow-engine |
| admin-console | ai-compliance-engine, ai-governance-engine, ai-security-engine, analytics-engine, api-gateway, business-dna, communication-hub, institutional-memory, observability-engine, shared-kernel |
| marketplace | admin-console, ai-runtime, analytics-engine, api-gateway, business-dna, communication-hub, institutional-memory, observability-engine, shared-kernel, workflow-engine |
| sdk | ai-brain, ai-provider-hub, ai-runtime, ai-workforce, business-dna, ceo-engine, decision-engine, intelligence-engine, multi-agent, shared-kernel, workflow-engine |
| kernel | extension-system |
| extension-system | sdk, shared-kernel |
| connector-base | integration-contracts, sdk |
| integration-contracts | (لا شيء) |
| typescript-config | (لا شيء) |
| integration-tests | sdk |

### 3. مصفوفة وقت التشغيل (جذر التركيب الفعلي أو "لا/غير قابل للتطبيق" مع السبب)

| الحزمة | جذر التركيب الفعلي |
| --- | --- |
| shared-kernel | لا يوجد — مكتبة أوليات (`createEventBus`, `createInMemoryRepository`, إلخ)، لا خدمة واحدة تُركَّب |
| ai-provider-hub | `createAiProviderHub()` (`hub.impl.ts`) — **تصحيح**: تقارير الشهادة تذكره خطأً كـ`createProviderHub()`، انظر [COMPOSITION_ROOTS](./COMPOSITION_ROOTS.md) §4 |
| decision-engine | لا يوجد كائن Runtime موحّد — انحراف مُصرَّح به؛ مصانع مستوى-وحدة (`createDecisionQueries`, `createDecisionRepository`, إلخ) |
| intelligence-engine | لا يوجد كائن Runtime موحّد — انحراف مُصرَّح به؛ مصانع مستوى-وحدة (`createForecaster`, `createCompetitorRepository`، إلخ) |
| ai-runtime | لا يوجد كائن Runtime موحّد — انحراف مُصرَّح به؛ مصانع مستوى-وحدة (`createConversationRuntimeService`, `createOrchestrator`، إلخ) |
| ai-brain | `createBrain()` (الواجهة الأساسية) و`createBrainSystem()` (المُجمِّع الكامل مع `queries`) — تسمية مختلفة عن `createXRuntime` |
| ceo-engine | `createCEOEngine()` (`ceo.ts`) — تسمية مختلفة |
| workflow-engine | `createWorkflowRuntime()` |
| multi-agent | `createMultiAgentRuntime()` |
| ai-workforce | `createWorkforceRuntime()` |
| business-dna | `createBusinessDnaRuntime()` |
| institutional-memory | `createInstitutionalMemoryRuntime()` |
| domain-graph | `createDomainGraphRuntime()` |
| capability-engine | لا يوجد — بلا حالة/متعاونين مُحقنين ليُركَّبوا (بنيويًا صحيح) |
| crm-engine | `createCrmRuntime()` |
| sales-engine | `createSalesRuntime()` |
| marketing-engine | `createMarketingRuntime()` |
| communication-hub | `createCommunicationRuntime()` |
| finance-engine | `createFinanceRuntime()` |
| hr-engine | `createHrRuntime()` |
| inventory-engine | `createInventoryRuntime()` |
| project-management-engine | `createProjectRuntime()` |
| customer-success-engine | `createCustomerSuccessRuntime()` |
| document-management-engine | `createDocumentManagementRuntime()` |
| ai-security-engine | `createSecurityRuntime()` |
| ai-governance-engine | `createGovernanceRuntime()` |
| ai-compliance-engine | `createComplianceRuntime()` |
| analytics-engine | `createAnalyticsRuntime()` |
| observability-engine | `createObservabilityRuntime()` |
| api-gateway | `createApiGatewayRuntime()` |
| admin-console | `createAdminConsoleRuntime()` |
| marketplace | `createMarketplaceRuntime()` |
| sdk | `createLateenSDK()` (مُجمِّع SDK عميل، لا خدمة Runtime) |
| kernel | لا يوجد — أوليات مستوى-بناء/نوع (بنيويًا صحيح) |
| extension-system | `createExtensionSystem()` — تسمية مختلفة |
| connector-base | لا يوجد — `createConnectorProvider()` مصنع موفّر واحد، لا Runtime مُجمِّع |
| integration-contracts | لا ينطبق — عقود أنواع فقط، بلا كود تشغيلي |
| typescript-config | لا ينطبق — `tsconfig.json` فقط، بلا كود مصدري |
| integration-tests | لا ينطبق — جناح اختبار يتحقق من `sdk`'s `createLateen()`، ليس محركًا قابلًا للتركيب بذاته |

### 4. مصفوفة العلاقات (`relationship-management/` — الوجود والسيبلينجز)

انظر الجدول الكامل في [RELATIONSHIP_MODEL](./RELATIONSHIP_MODEL.md) §4 (18 حزمة تملكه). الحزم الـ21 المتبقية: 9 تتكامل مع سيبلينجز حقيقيين مباشرة من داخل ملفات النطاق الفرعي (`ai-brain`, `ai-runtime`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `workflow-engine`, `multi-agent`, `institutional-memory`, `domain-graph`) — دون طبقة مركزية؛ و5 لا تحتاج تكامل سيبلينج أصلًا (`shared-kernel`, `sdk`, `ai-provider-hub`, `ceo-engine`, `business-dna`)؛ والباقي (`capability-engine`, `kernel`, `connector-base`, `integration-contracts`, `typescript-config`, `integration-tests`, `crm-engine`... لا، `crm-engine` مُدرَج ضمن الـ18) هي حزم بنية تحتية/عقود لا تتطلب تكاملًا نطاقيًا.

### 5. مصفوفة الأحداث (وجود `events/` وعدد تقريبي للأحداث المُعلَنة)

| الحزمة | events/ | العدد التقريبي |
| --- | --- | --- |
| admin-console | نعم | 10 |
| ai-brain | نعم | 5 |
| ai-compliance-engine | نعم | 10 |
| ai-governance-engine | نعم | 8 |
| ai-provider-hub | نعم (نمط ثوابت UPPER_CASE) | 7 |
| ai-runtime | نعم | 10 |
| ai-security-engine | نعم | 7 |
| ai-workforce | نعم | 10 |
| analytics-engine | نعم | 7 |
| api-gateway | نعم | 10 |
| business-dna | نعم | 10 |
| ceo-engine | لا | — |
| communication-hub | نعم | 10 |
| connector-base | لا | — |
| crm-engine | نعم | 9 |
| customer-success-engine | نعم | 9 |
| decision-engine | لا | — |
| document-management-engine | نعم | 9 |
| domain-graph | نعم | 8 |
| extension-system | نعم | 5 |
| finance-engine | نعم | 10 |
| hr-engine | نعم | 10 |
| institutional-memory | نعم | 5 |
| integration-contracts | لا | — |
| integration-tests | لا (بلا `src/`) | — |
| intelligence-engine | لا | — |
| inventory-engine | نعم | 6 |
| kernel | نعم | 12 |
| marketing-engine | نعم | 9 |
| marketplace | نعم | 10 |
| multi-agent | نعم | 12 |
| observability-engine | نعم | 7 |
| project-management-engine | نعم | 10 |
| sales-engine | نعم | 9 |
| sdk | نعم (ناقل أحداث عام لمستوى SDK) | — |
| shared-kernel | نعم (`createEventBus` العام فقط، لا خريطة أحداث نطاقية) | — |
| typescript-config | لا (بلا `src/`) | — |
| workflow-engine | نعم | 7 |

الأعداد أعلاه هي عد فعلي لأسماء أحداث فريدة بصيغة `noun.verb` داخل ملفات `events/*.ts` لكل حزمة (`grep` مباشر) — تقريبية حيث تختلف الاتفاقية التركيبية (مثل `ai-provider-hub`'s نمط الثوابت).

### 6. مصفوفة الاستعلامات (وجود `queries/`)

| الحزمة | queries/ |
| --- | --- |
| admin-console, ai-brain, ai-compliance-engine, ai-governance-engine, ai-provider-hub, ai-runtime, ai-security-engine, ai-workforce, analytics-engine, api-gateway, business-dna, **capability-engine**, communication-hub, crm-engine, customer-success-engine, decision-engine, document-management-engine, domain-graph, extension-system, finance-engine, hr-engine, institutional-memory, intelligence-engine, inventory-engine, marketing-engine, marketplace, multi-agent, observability-engine, project-management-engine, sales-engine, workflow-engine | نعم (31 حزمة) |
| ceo-engine, connector-base, integration-contracts, kernel, sdk, shared-kernel | لا (6 حزم بلا حالة نطاقية قابلة للاستعلام) |
| integration-tests, typescript-config | لا ينطبق (بلا `src/`) |

**`capability-engine` مُبرَز بخط عريض عمدًا** — انظر ملاحظة التحقّق في [QUERY_MODEL](./QUERY_MODEL.md) §3: يملك فعليًا `queries/capability-queries.ts` حقيقيًا، خلافًا لما ورد في `RUNTIME_AUDIT.md`.

### 7. مصفوفة المستودعات (Repository) — صفر تسرّب، عبر كل الحزم الـ39

لا حزمة من الـ39 تُصدّر مستودعًا (`*Repository`/`*Repo`) كجزء من سطحها العام (`XRuntime` أو ما يعادله). هذا محقَّق بثلاث طرق مستقلة ومتّسقة: (1) فحص كل واجهة Runtime سطرًا-بسطر (`RUNTIME_AUDIT.md`)، (2) فحص كل استيراد عبر الحزم بحثًا عن أي `*/repository*` (لا نتيجة سوى الاستخدام العام لـ`createInMemoryRepository` من `shared-kernel`، 216 ملفًا، جميعها هذا النمط الواحد — `DEPENDENCY_AUDIT.md`)، (3) عيّنة تحقّق مباشرة في هذا التقرير على `finance-engine` (20 مستودعًا، صفر منها في `FinanceRuntime` المُرجَع). **نتيجة نظيفة، صفر استثناءات، مطابقة لما ورد في الشهادة الأصلية.**

---

# English

## Package Catalog

### 0. Method

Every table below is built from real data: `node -pe "require('./package.json')..."` against every `packages/*/package.json` (39 files), folder-presence checks (`relationship-management/`, `queries/`, `events/`) across every `packages/*/src`, and exported-function-name checks via direct `grep` on `runtime.ts` or the equivalent composition file. No row was invented.

### 1. Package Matrix (39/39)

| Package | npm name | Layer / Era | Purpose (one line) |
| --- | --- | --- | --- |
| shared-kernel | `@lateen-os/shared-kernel` | Foundation / Era 1 | Foundational DDD building blocks for every package |
| ai-provider-hub | `@lateen-os/ai-provider-hub` | LLM abstraction / Era 1 | Canonical LLM provider abstraction |
| decision-engine | `@lateen-os/decision-engine` | Reasoning stack / Era 1 | Canonical decision layer |
| intelligence-engine | `@lateen-os/intelligence-engine` | Reasoning stack / Era 1 | Discovery, analysis, forecasting |
| ai-runtime | `@lateen-os/ai-runtime` | Reasoning stack / Era 1 | Operating system for AI agents |
| ai-brain | `@lateen-os/ai-brain` | Reasoning stack / Era 1 | Central enterprise reasoning layer |
| ceo-engine | `@lateen-os/ceo-engine` | Reasoning stack / Era 1 | Mission delegation to specialized executive agents |
| workflow-engine | `@lateen-os/workflow-engine` | Coordination / Era 1 | Canonical workflow orchestration layer |
| multi-agent | `@lateen-os/multi-agent` | Coordination / Era 1 | Coordination above AI Workforce |
| ai-workforce | `@lateen-os/ai-workforce` | Coordination / Era 1 | Organizational layer for digital employees |
| business-dna | `@lateen-os/business-dna` | Domain infrastructure / Era 1 | Canonical domain model |
| institutional-memory | `@lateen-os/institutional-memory` | Domain infrastructure / Era 1 | Long-term organizational knowledge |
| domain-graph | `@lateen-os/domain-graph` | Domain infrastructure / Era 1 | Semantic relationships between Business DNA entities |
| capability-engine | `@lateen-os/capability-engine` | Domain infrastructure / Era 1 | Models company capabilities independent of a machine |
| crm-engine | `@lateen-os/crm-engine` | Business engine / Era 1 | Customer, opportunity, and contact management |
| sales-engine | `@lateen-os/sales-engine` | Business engine / Era 1 | Sales opportunity lifecycle and pipeline |
| marketing-engine | `@lateen-os/marketing-engine` | Business engine / Era 1 | Campaigns, audiences, lead generation |
| communication-hub | `@lateen-os/communication-hub` | Business engine / Era 1 | Conversations, channels, notifications |
| finance-engine | `@lateen-os/finance-engine` | Business engine / Era 2 | Finance: general ledger, AR/AP, treasury, tax |
| hr-engine | `@lateen-os/hr-engine` | Business engine / Era 2 | HR: org structure, employees, payroll prep |
| inventory-engine | `@lateen-os/inventory-engine` | Business engine / Era 2 | Inventory: catalog, warehouses, valuation |
| project-management-engine | `@lateen-os/project-management-engine` | Business engine / Era 2 | Project/portfolio/resource management |
| customer-success-engine | `@lateen-os/customer-success-engine` | Business engine / Era 2 | Customer health and success plans |
| document-management-engine | `@lateen-os/document-management-engine` | Business engine / Era 2 | Document lifecycle and version control |
| ai-security-engine | `@lateen-os/ai-security-engine` | Trust layer / Era 1 | Identity, auth, secrets, model security |
| ai-governance-engine | `@lateen-os/ai-governance-engine` | Trust layer / Era 1 | Governance policies and human approval |
| ai-compliance-engine | `@lateen-os/ai-compliance-engine` | Trust layer / Era 1 | Compliance frameworks, controls, audits |
| analytics-engine | `@lateen-os/analytics-engine` | Horizontal/operational / Era 1 | KPIs and executive dashboards |
| observability-engine | `@lateen-os/observability-engine` | Horizontal/operational / Era 1 | Logging, metrics, tracing, alerting |
| api-gateway | `@lateen-os/api-gateway` | Platform surface / Era 2 | API registries, auth, rate limiting |
| admin-console | `@lateen-os/admin-console` | Platform surface / Era 2 | Identity administration, settings, audit |
| marketplace | `@lateen-os/marketplace-engine` | Platform surface / Era 2 | Extension/package registries, sandbox |
| sdk | `@lateen-os/sdk` | Developer surface / Era 1 | Official Lateen OS developer interface |
| kernel | `@lateen-os/kernel` | Developer surface / Era 1 | Platform operating layer |
| extension-system | `@lateen-os/extension-system` | Developer surface / Era 1 | Discover, validate, load extensions |
| connector-base | `@lateen-os/connector-base` | Developer surface / Era 1 | Base connector provider implementation |
| integration-contracts | `@lateen-os/integration-contracts` | Developer surface / Era 1 | Shared connector-extension contracts |
| typescript-config | `@lateen-os/typescript-config` | Developer surface / Era 1 | Shared TypeScript config, no runtime code |
| integration-tests | `@lateen-os/integration-tests` | Developer surface / Era 1 | End-to-end suite over `createLateen()` |

### 2. Dependency Matrix (real `@lateen-os/*` dependencies only, from `package.json`)

| Package | `@lateen-os/*` dependencies |
| --- | --- |
| shared-kernel | (none) |
| ai-provider-hub | shared-kernel |
| decision-engine | business-dna, capability-engine, domain-graph, institutional-memory, shared-kernel |
| intelligence-engine | business-dna, capability-engine, decision-engine, domain-graph, institutional-memory, shared-kernel |
| ai-runtime | ai-provider-hub, business-dna, capability-engine, decision-engine, domain-graph, institutional-memory, intelligence-engine, shared-kernel |
| ai-brain | ai-runtime, ai-workforce, business-dna, decision-engine, domain-graph, institutional-memory, multi-agent, shared-kernel, workflow-engine |
| ceo-engine | shared-kernel |
| workflow-engine | ai-runtime, ai-workforce, business-dna, decision-engine, shared-kernel |
| multi-agent | ai-brain, ai-runtime, ai-workforce, business-dna, decision-engine, institutional-memory, shared-kernel, workflow-engine |
| ai-workforce | ai-runtime, business-dna, decision-engine, institutional-memory, intelligence-engine, shared-kernel |
| business-dna | shared-kernel |
| institutional-memory | business-dna, domain-graph, shared-kernel |
| domain-graph | business-dna, capability-engine, shared-kernel |
| capability-engine | business-dna, shared-kernel |
| crm-engine | business-dna, domain-graph, institutional-memory, shared-kernel |
| sales-engine | business-dna, crm-engine, institutional-memory, shared-kernel, workflow-engine |
| marketing-engine | business-dna, crm-engine, domain-graph, institutional-memory, sales-engine, shared-kernel, workflow-engine |
| communication-hub | ai-workforce, business-dna, crm-engine, institutional-memory, marketing-engine, sales-engine, shared-kernel, workflow-engine |
| finance-engine | analytics-engine, business-dna, communication-hub, crm-engine, institutional-memory, sales-engine, shared-kernel, workflow-engine |
| hr-engine | ai-workforce, analytics-engine, business-dna, communication-hub, finance-engine, institutional-memory, shared-kernel, workflow-engine |
| inventory-engine | analytics-engine, business-dna, communication-hub, finance-engine, institutional-memory, sales-engine, shared-kernel, workflow-engine |
| project-management-engine | analytics-engine, business-dna, communication-hub, crm-engine, finance-engine, hr-engine, institutional-memory, inventory-engine, shared-kernel, workflow-engine |
| customer-success-engine | analytics-engine, business-dna, communication-hub, crm-engine, institutional-memory, project-management-engine, sales-engine, shared-kernel |
| document-management-engine | analytics-engine, business-dna, communication-hub, crm-engine, customer-success-engine, institutional-memory, project-management-engine, shared-kernel, workflow-engine |
| ai-security-engine | ai-brain, ai-provider-hub, ai-runtime, business-dna, communication-hub, shared-kernel, workflow-engine |
| ai-governance-engine | ai-brain, ai-runtime, ai-security-engine, business-dna, communication-hub, shared-kernel, workflow-engine |
| ai-compliance-engine | ai-governance-engine, ai-security-engine, business-dna, communication-hub, shared-kernel, workflow-engine |
| analytics-engine | ai-compliance-engine, ai-governance-engine, ai-security-engine, ai-workforce, business-dna, communication-hub, crm-engine, decision-engine, domain-graph, institutional-memory, intelligence-engine, marketing-engine, sales-engine, shared-kernel, workflow-engine |
| observability-engine | ai-compliance-engine, ai-governance-engine, ai-runtime, ai-security-engine, analytics-engine, communication-hub, shared-kernel, workflow-engine |
| api-gateway | ai-compliance-engine, ai-governance-engine, ai-runtime, ai-security-engine, analytics-engine, business-dna, communication-hub, crm-engine, customer-success-engine, finance-engine, hr-engine, inventory-engine, marketing-engine, observability-engine, project-management-engine, sales-engine, shared-kernel, workflow-engine |
| admin-console | ai-compliance-engine, ai-governance-engine, ai-security-engine, analytics-engine, api-gateway, business-dna, communication-hub, institutional-memory, observability-engine, shared-kernel |
| marketplace | admin-console, ai-runtime, analytics-engine, api-gateway, business-dna, communication-hub, institutional-memory, observability-engine, shared-kernel, workflow-engine |
| sdk | ai-brain, ai-provider-hub, ai-runtime, ai-workforce, business-dna, ceo-engine, decision-engine, intelligence-engine, multi-agent, shared-kernel, workflow-engine |
| kernel | extension-system |
| extension-system | sdk, shared-kernel |
| connector-base | integration-contracts, sdk |
| integration-contracts | (none) |
| typescript-config | (none) |
| integration-tests | sdk |

### 3. Runtime Matrix (real composition-root factory, or "none / N/A" with the real reason)

| Package | Real Composition Root |
| --- | --- |
| shared-kernel | None — a primitives library (`createEventBus`, `createInMemoryRepository`, etc.), no single service to compose |
| ai-provider-hub | `createAiProviderHub()` (`hub.impl.ts`) — **correction**: certification reports misname this `createProviderHub()`, see [COMPOSITION_ROOTS](./COMPOSITION_ROOTS.md) §4 |
| decision-engine | No unified runtime object — sanctioned deviation; module-level factories (`createDecisionQueries`, `createDecisionRepository`, etc.) |
| intelligence-engine | No unified runtime object — sanctioned deviation; module-level factories (`createForecaster`, `createCompetitorRepository`, etc.) |
| ai-runtime | No unified runtime object — sanctioned deviation; module-level factories (`createConversationRuntimeService`, `createOrchestrator`, etc.) |
| ai-brain | `createBrain()` (core facade) and `createBrainSystem()` (fuller aggregator with `queries`) — differently named than `createXRuntime` |
| ceo-engine | `createCEOEngine()` (`ceo.ts`) — differently named |
| workflow-engine | `createWorkflowRuntime()` |
| multi-agent | `createMultiAgentRuntime()` |
| ai-workforce | `createWorkforceRuntime()` |
| business-dna | `createBusinessDnaRuntime()` |
| institutional-memory | `createInstitutionalMemoryRuntime()` |
| domain-graph | `createDomainGraphRuntime()` |
| capability-engine | None — no injected collaborators/state to compose (structurally correct) |
| crm-engine | `createCrmRuntime()` |
| sales-engine | `createSalesRuntime()` |
| marketing-engine | `createMarketingRuntime()` |
| communication-hub | `createCommunicationRuntime()` |
| finance-engine | `createFinanceRuntime()` |
| hr-engine | `createHrRuntime()` |
| inventory-engine | `createInventoryRuntime()` |
| project-management-engine | `createProjectRuntime()` |
| customer-success-engine | `createCustomerSuccessRuntime()` |
| document-management-engine | `createDocumentManagementRuntime()` |
| ai-security-engine | `createSecurityRuntime()` |
| ai-governance-engine | `createGovernanceRuntime()` |
| ai-compliance-engine | `createComplianceRuntime()` |
| analytics-engine | `createAnalyticsRuntime()` |
| observability-engine | `createObservabilityRuntime()` |
| api-gateway | `createApiGatewayRuntime()` |
| admin-console | `createAdminConsoleRuntime()` |
| marketplace | `createMarketplaceRuntime()` |
| sdk | `createLateenSDK()` (client SDK aggregator, not a service runtime) |
| kernel | None — build/type-level primitives (structurally correct) |
| extension-system | `createExtensionSystem()` — differently named |
| connector-base | None — `createConnectorProvider()` is a single provider factory, not an aggregated runtime |
| integration-contracts | N/A — type contracts only, no runtime code |
| typescript-config | N/A — `tsconfig.json` only, no source code |
| integration-tests | N/A — a test harness verifying `sdk`'s `createLateen()`, not a composable engine itself |

### 4. Relationship Matrix (`relationship-management/` presence and siblings)

See the full table in [RELATIONSHIP_MODEL](./RELATIONSHIP_MODEL.md) §4 (18 packages have it). Of the remaining 21: 9 integrate with real siblings directly inside subdomain files without a centralized layer (`ai-brain`, `ai-runtime`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `workflow-engine`, `multi-agent`, `institutional-memory`, `domain-graph`); 5 need no sibling integration at all (`shared-kernel`, `sdk`, `ai-provider-hub`, `ceo-engine`, `business-dna`); the rest (`capability-engine`, `kernel`, `connector-base`, `integration-contracts`, `typescript-config`, `integration-tests`) are infrastructure/contract-only packages requiring no domain integration.

### 5. Event Matrix (`events/` presence and a rough count of declared events)

| Package | events/ | Approx. Count |
| --- | --- | --- |
| admin-console | Yes | 10 |
| ai-brain | Yes | 5 |
| ai-compliance-engine | Yes | 10 |
| ai-governance-engine | Yes | 8 |
| ai-provider-hub | Yes (UPPER_CASE constant-map style) | 7 |
| ai-runtime | Yes | 10 |
| ai-security-engine | Yes | 7 |
| ai-workforce | Yes | 10 |
| analytics-engine | Yes | 7 |
| api-gateway | Yes | 10 |
| business-dna | Yes | 10 |
| ceo-engine | No | — |
| communication-hub | Yes | 10 |
| connector-base | No | — |
| crm-engine | Yes | 9 |
| customer-success-engine | Yes | 9 |
| decision-engine | No | — |
| document-management-engine | Yes | 9 |
| domain-graph | Yes | 8 |
| extension-system | Yes | 5 |
| finance-engine | Yes | 10 |
| hr-engine | Yes | 10 |
| institutional-memory | Yes | 5 |
| integration-contracts | No | — |
| integration-tests | No (no `src/`) | — |
| intelligence-engine | No | — |
| inventory-engine | Yes | 6 |
| kernel | Yes | 12 |
| marketing-engine | Yes | 9 |
| marketplace | Yes | 10 |
| multi-agent | Yes | 12 |
| observability-engine | Yes | 7 |
| project-management-engine | Yes | 10 |
| sales-engine | Yes | 9 |
| sdk | Yes (SDK-level generic event bus) | — |
| shared-kernel | Yes (`createEventBus` generic factory only, no domain event map) | — |
| typescript-config | No (no `src/`) | — |
| workflow-engine | Yes | 7 |

Counts above are a real count of unique `noun.verb`-shaped event names inside each package's `events/*.ts` (direct `grep`) — approximate where the construction convention differs (e.g. `ai-provider-hub`'s constant-map style).

### 6. Query Matrix (`queries/` presence)

| Packages | queries/ |
| --- | --- |
| admin-console, ai-brain, ai-compliance-engine, ai-governance-engine, ai-provider-hub, ai-runtime, ai-security-engine, ai-workforce, analytics-engine, api-gateway, business-dna, **capability-engine**, communication-hub, crm-engine, customer-success-engine, decision-engine, document-management-engine, domain-graph, extension-system, finance-engine, hr-engine, institutional-memory, intelligence-engine, inventory-engine, marketing-engine, marketplace, multi-agent, observability-engine, project-management-engine, sales-engine, workflow-engine | Yes (31 packages) |
| ceo-engine, connector-base, integration-contracts, kernel, sdk, shared-kernel | No (6 packages with no queryable domain state) |
| integration-tests, typescript-config | N/A (no `src/`) |

**`capability-engine` is deliberately bolded** — see the verification note in [QUERY_MODEL](./QUERY_MODEL.md) §3: it genuinely has a real `queries/capability-queries.ts`, contrary to what `RUNTIME_AUDIT.md` states.

### 7. Repository Matrix — Zero Leakage, Across All 39 Packages

No package among the 39 exports a repository (`*Repository`/`*Repo`) as part of its public surface (`XRuntime` or equivalent). Verified three independent ways: (1) every Runtime interface inspected line-by-line (`RUNTIME_AUDIT.md`), (2) every cross-package import scanned for `*/repository*` (the only hit is the shared use of `createInMemoryRepository` from `shared-kernel`, 216 files, all the same one pattern — `DEPENDENCY_AUDIT.md`), (3) a direct spot-check in this report against `finance-engine` (20 repositories, zero of them present in the returned `FinanceRuntime`). **A clean result, zero exceptions, consistent with the original certification.**

---

## Related Documents

- [../AI_PROJECT_CONTEXT.md](../AI_PROJECT_CONTEXT.md)
- [../certification/ARCHITECTURE_AUDIT.md](../certification/ARCHITECTURE_AUDIT.md)
- [../certification/DEPENDENCY_AUDIT.md](../certification/DEPENDENCY_AUDIT.md)
- [../certification/RUNTIME_AUDIT.md](../certification/RUNTIME_AUDIT.md)
- [../certification/INTEGRATION_AUDIT.md](../certification/INTEGRATION_AUDIT.md)
- [PACKAGE_MAP.md](./PACKAGE_MAP.md)
- [DEPENDENCY_MODEL.md](./DEPENDENCY_MODEL.md)
- [COMPOSITION_ROOTS.md](./COMPOSITION_ROOTS.md)
- [RELATIONSHIP_MODEL.md](./RELATIONSHIP_MODEL.md)
- [EVENT_MODEL.md](./EVENT_MODEL.md)
- [QUERY_MODEL.md](./QUERY_MODEL.md)

## Related Engines

All 39 `packages/*` engines.

## Related Commits

Commit 35 — Enterprise Platform Certification & Stabilization, and the subsequent documentation sprint.
