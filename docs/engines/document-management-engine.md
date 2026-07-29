---
title: Document Management Engine
title_ar: محرك إدارة المستندات
version: 1.0.0
status: active
package: "@lateen-os/document-management-engine"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
related_packages:
  - business-dna
  - institutional-memory
  - communication-hub
  - project-management-engine
  - crm-engine
  - customer-success-engine
  - workflow-engine
  - analytics-engine
---

# العربية

## الغرض

`@lateen-os/document-management-engine` هو محرك إدارة المستندات في Lateen OS: دورة حياة المستند، المجلدات، التحكم بالإصدارات، البيانات الوصفية (Metadata)، والعلاقات بين المستندات وبقية كيانات المنصة. تنفيذ حقيقي وحتمي وبدون اتصال، من حزم الحقبة الثانية (Era 2)، ويتكامل مع ثماني حزم شقيقة عبر طبقة العلاقات — أعلى عدد معاونين علاقاتيين بين الحزم العشر المشمولة في هذه الدفعة التوثيقية.

## المسؤوليات

- دورة حياة المستند (`DocumentLifecycleEngine`) بحالات انتقال محكومة (`canTransitionDocument`).
- إدارة المجلدات (`FolderManagementEngine`) بمستويات وصول وصلاحيات (`FolderAccessLevel`/`FolderPermission`) وحالات انتقال محكومة (`canTransitionFolder`).
- التحكم بالإصدارات (`VersionControlEngine`)، مركّب مع دورة حياة المستند لتتبع مؤشر الإصدار الحالي، ويوفّر مقارنة إصدارات (`VersionComparison`).
- محرك البيانات الوصفية (`MetadataEngine`) بما فيه فحص انتهاء الصلاحية (`isExpired`).
- محرك العلاقات العام (`RelationshipEngine`) لربط المستند بكيانات أخرى (`LinkEntityInput`) — **ملاحظة**: هذا مفهوم منفصل تمامًا عن طبقة العلاقات مع الحزم الشقيقة (انظر "ملاحظات معمارية").
- طبقة علاقات مع ثماني حزم شقيقة، طبقة استعلامات، وناقل أحداث نطاق مكتوب النوع.

## خارج نطاق المسؤولية

- لا تخزين ملفات فعلي (Blob Storage) — الحزمة تدير البيانات الوصفية ودورة الحياة فقط، لا محتوى الملفات الثنائي.
- لا استدلال ذكاء اصطناعي.
- لا منطق أعمال خاص بأي من الحزم الشقيقة الثماني — التكامل عبر شرائح `Pick<>` ضيقة فقط.
- لا UI/API/HTTP.

## وقت التشغيل العام

جذر التركيب هو `createDocumentManagementRuntime(deps: DocumentManagementRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد `DocumentManagementRuntime` بالحقول: `documents`، `folders`، `versions`، `metadata`، `relationships` (محرك العلاقات العام بين الكيانات)، `relationshipManagement` (طبقة التكامل مع الحزم الشقيقة)، `queries`، `events`.

## الاستعلامات العامة

`DocumentManagementQueries`: `findDocuments`، `findFolders`، `findVersions`، `findMetadata`، `findRelationships`، `searchDocuments`.

## الأحداث المكتوبة النوع

`DOCUMENT_MANAGEMENT_EVENT_NAMES`: `document.created`، `document.updated`، `document.reviewed`، `document.approved`، `document.published`، `document.archived`، `document.restored`، `document.version.created`، `document.expired`، `document.deleted`.

## الاعتماديات

حسب `package.json`: `@lateen-os/analytics-engine`، `@lateen-os/business-dna`، `@lateen-os/communication-hub`، `@lateen-os/crm-engine`، `@lateen-os/customer-success-engine`، `@lateen-os/institutional-memory`، `@lateen-os/project-management-engine`، `@lateen-os/shared-kernel`، `@lateen-os/workflow-engine`.

## الحزم المعتمِدة

بحث فعلي في `package.json` عبر المستودع لم يُظهر أي حزمة تحت `packages/*` تعتمد على `@lateen-os/document-management-engine` حاليًا.

## نقاط التكامل

مجلد `relationship-management/` حقيقي يحقن ثمانية معاونين اختياريين، كل منهم شريحة `Pick<>` ضيقة: `businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>`، `institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>`، `communicationHub?: Pick<CommunicationRuntime, 'notifications'>`، `projects?: Pick<ProjectRuntime, 'projects'>`، `crm?: Pick<CrmRuntime, 'customers'>`، `customerSuccess?: Pick<CustomerSuccessRuntime, 'customers'>`، `workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`، `analytics?: Pick<AnalyticsRuntime, 'metrics'>`.

## ملاحظات معمارية

- **اسمان متشابهان لمفهومين مختلفين**: تحتوي الحزمة على مجلدَين منفصلين — `relationship/` (محرك عام لربط المستند بأي كيان، مُصدَّر كحقل `relationships` في الـ Runtime) و`relationship-management/` (طبقة التكامل مع الحزم الشقيقة، مُصدَّرة كحقل `relationshipManagement`). هذا تمييز حقيقي في التسمية يستحق الانتباه عند القراءة، وليس خطأً في هذا التوثيق.
- ثماني اعتماديات شقيقة حقيقية في `package.json` (`analytics-engine` وحتى `workflow-engine`) — أعلى عدد بين الحزم العشر المشمولة في هذه الدفعة.

## قرارات التصميم

- التحكم بالإصدارات مركّب مباشرة مع دورة حياة المستند (بدلًا من أن يكون نظامًا منفصلًا تمامًا) للحفاظ على مؤشر "الإصدار الحالي" متزامنًا دائمًا.
- محرك العلاقات العام (`relationship/engine.impl.ts`) مصمَّم كآلية ربط عامة (`RelatedEntityType`) بدلًا من حقل مخصص لكل نوع كيان قد يرتبط بمستند.

## نقاط التوسعة

أي حزمة مستقبلية تريد ربط مستندات بكياناتها الخاصة يجب أن تستهلك `createDocumentManagementRuntime()` العام (حقل `relationships` لربط الكيانات العام، أو حقل `queries` للقراءة) — أو، إن احتاجت `document-management-engine` نفسها التكامل معها، تُضاف كمعاون تاسع إلى `RelationshipManagementDeps` في تعديل مخصص لهذه الحزمة، وليس العكس.

## المحركات ذات الصلة

- [Business DNA](./business-dna.md)
- [Communication Hub](./communication-hub.md)
- [CRM Engine](./crm-engine.md)
- [Customer Success Engine](./customer-success-engine.md)

---

# English

## Purpose

`@lateen-os/document-management-engine` is Lateen OS's document management engine: document lifecycle, folders, version control, metadata, and relationships between documents and the rest of the platform's entities. A real, deterministic, offline implementation, an Era-2 package, integrating with eight sibling packages through its Relationship Layer — the highest collaborator count among the ten packages in this documentation batch.

## Responsibilities

- The Document Lifecycle Engine, with governed transitions (`canTransitionDocument`).
- Folder Management, with access levels and permissions (`FolderAccessLevel`/`FolderPermission`) and governed transitions (`canTransitionFolder`).
- Version Control, composed with the Document Lifecycle to track the current-version pointer, providing version comparison (`VersionComparison`).
- The Metadata Engine, including expiry checking (`isExpired`).
- The general Relationship Engine for linking a document to other entities (`LinkEntityInput`) — **note**: this is a completely separate concept from the sibling-package Relationship Layer (see "Architecture Notes").
- A Relationship Layer with eight sibling packages, a query layer, and a typed domain event bus.

## Non-responsibilities

- No actual file/blob storage — the package manages metadata and lifecycle only, not binary file content.
- No AI inference.
- No business logic specific to any of the eight sibling packages — integration happens only through narrow `Pick<>` slices.
- No UI/API/HTTP.

## Public Runtime

The composition root is `createDocumentManagementRuntime(deps: DocumentManagementRuntimeDeps = {})` in `src/runtime.ts`, returning a `DocumentManagementRuntime` with: `documents`, `folders`, `versions`, `metadata`, `relationships` (the general entity-linking engine), `relationshipManagement` (the sibling-integration layer), `queries`, `events`.

## Public Queries

`DocumentManagementQueries`: `findDocuments`, `findFolders`, `findVersions`, `findMetadata`, `findRelationships`, `searchDocuments`.

## Typed Events

`DOCUMENT_MANAGEMENT_EVENT_NAMES`: `document.created`, `document.updated`, `document.reviewed`, `document.approved`, `document.published`, `document.archived`, `document.restored`, `document.version.created`, `document.expired`, `document.deleted`.

## Dependencies

Per `package.json`: `@lateen-os/analytics-engine`, `@lateen-os/business-dna`, `@lateen-os/communication-hub`, `@lateen-os/crm-engine`, `@lateen-os/customer-success-engine`, `@lateen-os/institutional-memory`, `@lateen-os/project-management-engine`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine`.

## Dependents

Grepping `package.json` across the workspace showed no package under `packages/*` currently depending on `@lateen-os/document-management-engine`.

## Integration Points

A real `relationship-management/` folder injects eight optional collaborators, each a narrow `Pick<>` slice: `businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>`, `institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>`, `communicationHub?: Pick<CommunicationRuntime, 'notifications'>`, `projects?: Pick<ProjectRuntime, 'projects'>`, `crm?: Pick<CrmRuntime, 'customers'>`, `customerSuccess?: Pick<CustomerSuccessRuntime, 'customers'>`, `workflow?: Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`, `analytics?: Pick<AnalyticsRuntime, 'metrics'>`.

## Architecture Notes

- **Two similarly-named folders for two different concepts**: the package has two separate folders — `relationship/` (a general engine linking a document to any entity, exported as the `relationships` runtime field) and `relationship-management/` (the sibling-integration layer, exported as the `relationshipManagement` field). This is a real naming distinction worth noting when reading the code, not an error in this documentation.
- Eight real sibling dependencies in `package.json` (`analytics-engine` through `workflow-engine`) — the highest count among the ten packages in this batch.

## Design Decisions

- Version control is composed directly with the document lifecycle (rather than being a fully separate system) to keep the "current version" pointer always in sync.
- The general Relationship Engine (`relationship/engine.impl.ts`) is designed as a generic linking mechanism (`RelatedEntityType`) rather than a dedicated field per entity type that could link to a document.

## Extension Points

Any future package that wants to link documents to its own entities should consume the public `createDocumentManagementRuntime()` (the `relationships` field for generic entity linking, or `queries` for reads) — or, if `document-management-engine` itself needs to integrate with it, it would be added as a ninth collaborator to `RelationshipManagementDeps` in a dedicated change to this package, never the reverse.

## Related Engines

- [Business DNA](./business-dna.md)
- [Communication Hub](./communication-hub.md)
- [CRM Engine](./crm-engine.md)
- [Customer Success Engine](./customer-success-engine.md)
