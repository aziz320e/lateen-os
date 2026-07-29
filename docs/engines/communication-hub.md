---
title: Communication Hub Engine
title_ar: محرك مركز الاتصالات
version: 1.0.0
status: active
package: "@lateen-os/communication-hub"
last_updated: 2026-07-29
related_documents:
  - ../AI_PROJECT_CONTEXT.md
  - ../certification/ARCHITECTURE_AUDIT.md
  - ../certification/INTEGRATION_AUDIT.md
related_packages:
  - crm-engine
  - sales-engine
  - marketing-engine
  - business-dna
  - institutional-memory
  - workflow-engine
  - ai-workforce
  - customer-success-engine
  - document-management-engine
---

# العربية

## الغرض

`@lateen-os/communication-hub` هو محرك الاتصالات الموحّد في Lateen OS: المحادثات، المشاركون، الرسائل، القنوات، المرفقات، الخط الزمني للاتصالات، القوالب، الإشعارات، الجدولة، والتكامل مع سير العمل. تنفيذ حقيقي وحتمي وبدون اتصال (offline)، ويُعدّ نقطة التكامل المركزية التي تصل الاتصالات بمحركات الأعمال الأخرى (CRM، المبيعات، التسويق) عبر طبقة العلاقات (Relationship Layer).

## المسؤوليات

- دورة حياة المحادثة (`Conversation`)، إدارة المشاركين، دورة حياة الرسالة، مركّبة مع سجل القنوات (Channel Registry).
- إدارة المرفقات، محرك القوالب (بما فيه استخراج المتغيرات وعرض القالب).
- خدمة الإشعارات، خدمة الجدولة (بما فيها حساب التكرار التالي `computeNextOccurrence`).
- خدمة تكامل سير العمل (`WorkflowIntegrationService`) وخدمة الخط الزمني (`TimelineService`).
- **طبقة العلاقات (Relationship Layer)**: نقطة التكامل الوحيدة مع CRM Engine، Sales Engine، Marketing Engine، Business DNA، Institutional Memory، Workflow Engine، وAI Workforce.
- طبقة استعلامات CQRS وناقل أحداث نطاق مكتوب النوع.

## خارج نطاق المسؤولية

- لا تخزين دائم يتجاوز المستودعات داخل الذاكرة.
- لا منطق أعمال خاص بـ CRM أو المبيعات أو التسويق — هذه الحزمة تستهلك تلك المحركات عبر شرائح `Pick<>` ضيقة فقط، ولا تعيد تنفيذ منطقها.
- لا استدلال ذكاء اصطناعي داخل الحزمة نفسها (استخدام `aiWorkforce` مقتصر على `Pick<WorkforceRuntime, 'lifecycle'>`).
- لا UI/API/HTTP.

## وقت التشغيل العام

جذر التركيب هو `createCommunicationRuntime(deps: CommunicationRuntimeDeps = {})` في `src/runtime.ts`، ويُعيد `CommunicationRuntime` بالحقول: `conversations`، `participants`، `messages`، `attachments`، `templates`، `notifications`، `scheduling`، `workflows`، `relationships`، `timeline`، `queries`، `events`. جميع المستودعات تُبنى داخل `runtime.ts` فقط.

## الاستعلامات العامة

`CommunicationQueries` تحتوي: `findConversations`، `findMessages`، `findParticipants`، `findTemplates`، `findTimeline`، `findNotifications`، `findScheduledMessages`، `searchCommunication`.

## الأحداث المكتوبة النوع

`COMMUNICATION_EVENT_NAMES`: `conversation.created`، `conversation.closed`، `participant.joined`، `participant.left`، `message.created`، `message.sent`، `message.delivered`، `message.read`، `notification.created`، `notification.sent`.

## الاعتماديات

حسب `package.json`: `@lateen-os/ai-workforce`، `@lateen-os/business-dna`، `@lateen-os/crm-engine`، `@lateen-os/institutional-memory`، `@lateen-os/marketing-engine`، `@lateen-os/sales-engine`، `@lateen-os/shared-kernel`، `@lateen-os/workflow-engine`.

## الحزم المعتمِدة

بحث فعلي في `package.json` عبر المستودع: `admin-console`، `ai-compliance-engine`، `ai-governance-engine`، `ai-security-engine`، `analytics-engine`، `api-gateway`، `customer-success-engine`، `document-management-engine`، `finance-engine`، `hr-engine`، `inventory-engine`، `marketplace`، `observability-engine`، `project-management-engine`.

## نقاط التكامل

مجلد `relationship-management/` حقيقي وموجود، ويحقن سبعة معاونين اختياريين، كل منهم مُنمَّط كشريحة `Pick<>` ضيقة: `crm?: Pick<CrmRuntime, 'customers'>`، `sales?: Pick<SalesRuntime, 'opportunities'>`، `marketing?: Pick<MarketingRuntime, 'campaigns'>`، `businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>`، `institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>`، `workflow?: Pick<WorkflowRuntime, 'queries'>`، `aiWorkforce?: Pick<WorkforceRuntime, 'lifecycle'>`. كل معاون غير محقون يتدهور إلى `null`/`[]`.

## ملاحظات معمارية

- خدمة الخط الزمني (`TimelineService`) تستهلك أيضًا معاونين اختياريين (`crm`, `sales`, `marketing`, `workflow`) بشكل منفصل عن `relationship-management/`، عبر `TimelineDeps` الخاصة بها — تجميع مزدوج للمعاونين لغرضين مختلفين (العلاقات مقابل الخط الزمني الموحّد) داخل نفس جذر التركيب.
- الحزمة من الحزم الـ 18 التي تمتلك مجلد `relationship-management/` حقيقيًا، وفق `INTEGRATION_AUDIT.md`.

## قرارات التصميم

- سجل القنوات (`ChannelRegistry`) قابل للحقن (`ChannelSendFunctions`) لفصل منطق الإرسال الفعلي عن دورة حياة الرسالة.
- كل معاون في `RelationshipManagementDeps` مُنمَّط كشريحة ضيقة من سطح تشغيل الشقيق، وليس كامل نوع الـ Runtime.

## نقاط التوسعة

أي حزمة تريد التكامل مع الاتصالات يجب أن تستهلك `createCommunicationRuntime()` العام وتحقن نفسها كمعاون في `RelationshipManagementDeps` أو `TimelineDeps` الخاصة بمستهلِكها الخاص، لا العكس — لا يجوز تعديل `communication-hub` لإضافة حزمة شقيقة جديدة دون إعادة التحقق من كامل السطح العام.

## المحركات ذات الصلة

- [CRM Engine](./crm-engine.md)
- [Business DNA](./business-dna.md)
- [Customer Success Engine](./customer-success-engine.md)
- [Document Management Engine](./document-management-engine.md)

---

# English

## Purpose

`@lateen-os/communication-hub` is Lateen OS's unified communications engine: conversations, participants, messages, channels, attachments, the communication timeline, templates, notifications, scheduling, and workflow integration. A real, deterministic, offline implementation, and the central integration point connecting communications to the other business engines (CRM, Sales, Marketing) via its Relationship Layer.

## Responsibilities

- Conversation lifecycle, participant management, message lifecycle, composed with the Channel Registry.
- Attachment management, the Template Engine (including variable extraction and template rendering).
- The Notification Service, the Scheduling Service (including `computeNextOccurrence`).
- The Workflow Integration Service and the Timeline Service.
- **The Relationship Layer**: the sole integration point with CRM Engine, Sales Engine, Marketing Engine, Business DNA, Institutional Memory, Workflow Engine, and AI Workforce.
- A CQRS query layer and a typed domain event bus.

## Non-responsibilities

- No persistence beyond in-memory repositories.
- No CRM, Sales, or Marketing business logic — this package only consumes those engines through narrow `Pick<>` slices, never reimplementing their logic.
- No AI inference inside the package itself (its use of `aiWorkforce` is limited to `Pick<WorkforceRuntime, 'lifecycle'>`).
- No UI/API/HTTP.

## Public Runtime

The composition root is `createCommunicationRuntime(deps: CommunicationRuntimeDeps = {})` in `src/runtime.ts`, returning a `CommunicationRuntime` with: `conversations`, `participants`, `messages`, `attachments`, `templates`, `notifications`, `scheduling`, `workflows`, `relationships`, `timeline`, `queries`, `events`. All repositories are constructed only inside `runtime.ts`.

## Public Queries

`CommunicationQueries` includes: `findConversations`, `findMessages`, `findParticipants`, `findTemplates`, `findTimeline`, `findNotifications`, `findScheduledMessages`, `searchCommunication`.

## Typed Events

`COMMUNICATION_EVENT_NAMES`: `conversation.created`, `conversation.closed`, `participant.joined`, `participant.left`, `message.created`, `message.sent`, `message.delivered`, `message.read`, `notification.created`, `notification.sent`.

## Dependencies

Per `package.json`: `@lateen-os/ai-workforce`, `@lateen-os/business-dna`, `@lateen-os/crm-engine`, `@lateen-os/institutional-memory`, `@lateen-os/marketing-engine`, `@lateen-os/sales-engine`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine`.

## Dependents

Verified by grepping `package.json` across the workspace: `admin-console`, `ai-compliance-engine`, `ai-governance-engine`, `ai-security-engine`, `analytics-engine`, `api-gateway`, `customer-success-engine`, `document-management-engine`, `finance-engine`, `hr-engine`, `inventory-engine`, `marketplace`, `observability-engine`, `project-management-engine`.

## Integration Points

A real `relationship-management/` folder exists, injecting seven optional collaborators, each typed as a narrow `Pick<>` slice: `crm?: Pick<CrmRuntime, 'customers'>`, `sales?: Pick<SalesRuntime, 'opportunities'>`, `marketing?: Pick<MarketingRuntime, 'campaigns'>`, `businessDna?: Pick<BusinessDnaRuntime, 'businessProfile'>`, `institutionalMemory?: Pick<InstitutionalMemoryRuntime, 'lifecycle'>`, `workflow?: Pick<WorkflowRuntime, 'queries'>`, `aiWorkforce?: Pick<WorkforceRuntime, 'lifecycle'>`. Every non-injected collaborator degrades to `null`/`[]`.

## Architecture Notes

- The Timeline Service also consumes optional collaborators (`crm`, `sales`, `marketing`, `workflow`) separately from `relationship-management/`, through its own `TimelineDeps` — a duplicated collaborator-wiring pattern for two distinct purposes (relationship integration vs. the unified timeline) inside the same composition root.
- This package is one of the 18 packages that genuinely has a `relationship-management/` folder, per `INTEGRATION_AUDIT.md`.

## Design Decisions

- The Channel Registry (`ChannelRegistry`) is injectable (`ChannelSendFunctions`) to decouple real send logic from the message lifecycle.
- Every collaborator in `RelationshipManagementDeps` is typed as a narrow slice of the sibling's runtime surface, never the whole Runtime type.

## Extension Points

Any package that wants to integrate with communications should consume the public `createCommunicationRuntime()` and inject itself as a collaborator into its own consumer's `RelationshipManagementDeps` or `TimelineDeps` — never the reverse. `communication-hub` must not be modified to add a new sibling without re-verifying its whole public surface.

## Related Engines

- [CRM Engine](./crm-engine.md)
- [Business DNA](./business-dna.md)
- [Customer Success Engine](./customer-success-engine.md)
- [Document Management Engine](./document-management-engine.md)
