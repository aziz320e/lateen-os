# @lateen-os/communication-hub

Communication Hub — conversations, participants, messaging, channels, templates, notifications, and scheduling for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Communication Hub is the canonical cross-domain communication layer: it owns the Conversation Engine, Participants, Messaging, Channels, Attachments, the unified Communication Timeline, Templates, Notifications, and Scheduling — and is the one package that integrates CRM Engine, Sales Engine, Marketing Engine, Business DNA, Institutional Memory, Workflow Engine, and AI Workforce on behalf of the communication domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` lifecycle/service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, no AI/LLM anywhere in this package
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createCommunicationRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Conversation Engine | `conversation` | Guarded `create` / `archive` / `reopen` / `assign` / `transfer` / `close` over 7 deterministic conversation types (`customer`, `internal`, `sales`, `marketing`, `support`, `workflow`, `ai`) |
| Participants | `participant` | Users, AI workers, external contacts, and organizations `join`/`leave` a conversation, with roles (`owner`/`member`/`observer`) and permissions (`read`/`write`/`manage`) |
| Messaging | `message` | Deterministic messages across 8 required types, moving through a guarded 7-state lifecycle (`draft → queued → sent → delivered → read`, plus `failed`/`archived`), composed with Channels for delivery |
| Channels | `channel` | Email, SMS, WhatsApp, Internal Chat, and Webhook providers — every provider deterministically falls back to an observable in-memory simulation when not configured with a real sender |
| Attachments | `attachment` | Metadata only (documents, images, audio, video, generic files) — no real file storage |
| Communication Timeline | `timeline` | A unified, deterministic view combining CRM Engine activities, Sales Engine activities, Marketing Engine leads, Workflow Engine instances, and this package's own Messages |
| Templates | `template` | Email, SMS, WhatsApp, and notification templates with deterministic `{{variable}}` rendering and immutable version history |
| Notifications | `notification` | User, team, workflow, reminder, and escalation notifications |
| Scheduling | `scheduling` | Delayed messages, recurring notifications, and reminders, with deterministic dispatch and rescheduling |
| Workflow Integration | `workflow-integration` | Generates deterministic Workflow Engine requests for approval reminders, follow-up reminders, overdue notifications, and escalation notifications |
| Relationship Layer | `relationship-management` | The **only** integration point with CRM Engine, Sales Engine, Marketing Engine, Business DNA, Institutional Memory, Workflow Engine, and AI Workforce — see below |
| Query Layer | `queries` | Real, read-only `CommunicationQueries` port — `findConversations` / `findMessages` / `findParticipants` / `findTemplates` / `findTimeline` / `findNotifications` / `findScheduledMessages` / `searchCommunication` |
| Event Bus | `events` | Typed `CommunicationEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with CRM Engine, Sales Engine, Marketing Engine, Business DNA, Institutional Memory, Workflow Engine, and AI Workforce

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages:

- **CRM Engine** — behavioral, via `relationship-management` (`getCustomerContext()`) and `timeline` (real activities via `queries.findActivities()`). Optional — injected as `Pick<CrmRuntime, 'customers' | 'queries'>`.
- **Sales Engine** — behavioral, via `relationship-management` (`getOpportunityContext()`) and `timeline` (real activities). Optional — injected as `Pick<SalesRuntime, 'opportunities' | 'queries'>`.
- **Marketing Engine** — behavioral, via `relationship-management` (`getCampaignContext()`) and `timeline` (real generated leads). Optional — injected as `Pick<MarketingRuntime, 'campaigns' | 'queries'>`.
- **Business DNA** — structural (`shared/identifiers.ts` reuses `OrganizationId` / `EmployeeId`) and behavioral, via `relationship-management`'s `getBusinessProfileContext()`. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Institutional Memory** — behavioral, via `relationship-management`. `logConversationToMemory()` records a conversation as a real Institutional Memory `'observation'` knowledge entry. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.
- **Workflow Engine** — behavioral, via `workflow-integration` (`generateRequest()` composes the real `defineWorkflow()` + `startWorkflow()` operations) and `relationship-management`/`timeline` (real running workflow instances via `queries.findRunningWorkflows()`). Optional — injected as `Pick<WorkflowRuntime, 'queries' | 'defineWorkflow' | 'startWorkflow'>`.
- **AI Workforce** — behavioral, via `relationship-management`. `getAiWorkerContext()` fetches a real AI Workforce worker via `lifecycle.get()`. Optional — injected as `Pick<WorkforceRuntime, 'lifecycle'>`.

Every optional collaborator degrades to a documented no-op (`null`, or an empty list) when not injected, so the Communication Hub is fully usable — and fully tested — completely offline. Channels are the one exception: they are an internal, always-present capability of this package, not an optional cross-package integration — only the underlying real sender per channel is optionally configurable (see Channels above).

## Event bus

`CommunicationEventMap` declares the 10 required events, each genuinely published by the real service that causes it:

`conversation.created`, `conversation.closed`, `participant.joined`, `participant.left`, `message.created`, `message.sent`, `message.delivered`, `message.read`, `notification.created`, `notification.sent`.

## Usage

```typescript
import { createCommunicationRuntime } from '@lateen-os/communication-hub';

const runtime = createCommunicationRuntime();

const conversation = await runtime.conversations.create('org-1', { conversationType: 'support', subject: 'Order #1042 delay' });
const customer = await runtime.participants.join('org-1', {
  conversationId: conversation.id,
  participantType: 'external_contact',
  displayName: 'Jordan Lee',
  role: 'member',
});

const message = await runtime.messages.create('org-1', {
  conversationId: conversation.id,
  messageType: 'email',
  senderParticipantId: customer.id,
  recipient: 'jordan@example.com',
  body: 'Thanks for reaching out — we are looking into it.',
});
await runtime.messages.send('org-1', message.id);
await runtime.messages.deliver('org-1', message.id);
await runtime.messages.markRead('org-1', message.id);

const template = await runtime.templates.createTemplate('org-1', {
  templateType: 'email',
  name: 'Delay Notice',
  body: 'Hi {{name}}, your order {{orderId}} is delayed.',
});

const reminder = await runtime.scheduling.scheduleNotification('org-1', {
  notification: { notificationType: 'reminder', title: 'Follow up with Jordan', relatedConversationId: conversation.id },
  scheduledFor: new Date(Date.now() + 86_400_000).toISOString(),
});
await runtime.scheduling.dispatchDue('org-1', new Date(Date.now() + 90_000_000).toISOString());

const request = await runtime.workflows.generateRequest('org-1', { requestType: 'follow_up_reminder', conversationId: conversation.id });

await runtime.conversations.close('org-1', conversation.id);

const { entries } = await runtime.queries.findTimeline({ organizationId: 'org-1' });
```

Wiring in the real CRM Engine / Sales Engine / Marketing Engine / Business DNA / Institutional Memory / Workflow Engine / AI Workforce collaborators:

```typescript
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createMarketingRuntime } from '@lateen-os/marketing-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createWorkforceRuntime } from '@lateen-os/ai-workforce';

const runtime = createCommunicationRuntime({
  crm: createCrmRuntime(),
  sales: createSalesRuntime(),
  marketing: createMarketingRuntime(),
  businessDna: createBusinessDnaRuntime(),
  institutionalMemory: createInstitutionalMemoryRuntime(),
  workflow: createWorkflowRuntime(),
  aiWorkforce: createWorkforceRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('message.delivered', (payload) => {
  console.log(`Message ${payload.messageId} delivered`);
});
```

## Structure

```
src/
├── shared/                  # IDs (reusing Business DNA's/CRM Engine's/AI Workforce's), primitives, id.ts/errors.ts helpers
├── conversation/              # Conversation Engine
├── participant/                # Participants
├── message/                    # Messaging, composed with Channels
├── channel/                     # Email/SMS/WhatsApp/Internal Chat/Webhook providers
├── attachment/                   # Attachments (metadata only)
├── timeline/                      # Communication Timeline
├── template/                       # Templates
├── notification/                    # Notifications
├── scheduling/                        # Scheduling
├── workflow-integration/                # Workflow Integration, composed with the Workflow Engine
├── relationship-management/              # CRM/Sales/Marketing/Business DNA/Institutional Memory/Workflow Engine/AI Workforce integration
├── queries/                                # Real CommunicationQueries read layer
├── events/                                  # Typed CommunicationEventMap
├── runtime.ts                                # createCommunicationRuntime() composition root
└── index.ts
```

See [COMMUNICATION_MODEL.md](./COMMUNICATION_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId` / `EmployeeId`; optional Relationship Layer collaborator
- `@lateen-os/crm-engine` — `AccountId` / `ContactId`; optional Timeline + Relationship Layer collaborator
- `@lateen-os/sales-engine` — optional Timeline + Relationship Layer collaborator
- `@lateen-os/marketing-engine` — optional Timeline + Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator
- `@lateen-os/workflow-engine` — optional Workflow Integration + Timeline + Relationship Layer collaborator
- `@lateen-os/ai-workforce` — `WorkerId`; optional Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/communication-hub build
pnpm --filter @lateen-os/communication-hub typecheck
pnpm --filter @lateen-os/communication-hub test
pnpm --filter @lateen-os/communication-hub lint
```
