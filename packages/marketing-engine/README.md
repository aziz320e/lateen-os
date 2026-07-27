# @lateen-os/marketing-engine

Marketing Engine — campaigns, audiences, lead generation, content, calendar, attribution, and metrics for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Marketing Engine is the canonical demand-generation layer: it owns the Campaign Lifecycle, the Audience Engine, Lead Generation and Lead Scoring, the Content Library, the Marketing Calendar, Attribution, and Marketing Metrics — and is the one package that integrates CRM Engine, Sales Engine, Business DNA, Institutional Memory, and Domain Graph on behalf of the marketing domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` lifecycle/service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, no AI/LLM anywhere in this package
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createMarketingRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Campaign Lifecycle + Campaign Types | `campaign` | Guarded `create` / `update` / `schedule` / `launch` / `pause` / `resume` / `complete` / `archive` over 9 deterministic campaign types (`email`, `social`, `sms`, `whatsapp`, `webinar`, `event`, `paid_ads`, `organic`, `referral`) |
| Audience Engine | `audience` | Static and dynamic audiences, deterministic segmentation filters, resolved through the CRM Engine's public query API only |
| Lead Generation | `lead-generation` | Captures leads from `inbound` / `outbound` / `referral` / `event` / `manual_import` channels |
| Lead Scoring | `lead-scoring` | Deterministic 0-100 scoring across engagement, source, profile completeness, activity count, and recency — no AI model |
| Content Library | `content` | Manages templates, campaign assets, landing pages, and media references |
| Marketing Calendar | `calendar` | Deterministic schedules, recurring campaigns, and launch windows |
| Attribution | `attribution` | Deterministic first-touch, last-touch, and linear attribution across recorded touchpoints |
| Marketing Metrics | `metrics` | Deterministic impressions, clicks, opens, conversions, cost, CPL, CAC, and ROI |
| Workflow Integration | `workflow-integration` | Generates deterministic Workflow Engine requests for campaign approval, asset review, publishing, and follow-up |
| Relationship Layer | `relationship-management` | The **only** integration point with CRM Engine, Sales Engine, Business DNA, Institutional Memory, and Domain Graph — see below |
| Query Layer | `queries` | Real, read-only `MarketingQueries` port — `findCampaigns` / `findAudiences` / `findAssets` / `findContent` / `findLeads` / `findMetrics` / `findCalendar` / `searchMarketing` |
| Event Bus | `events` | Typed `MarketingEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with CRM Engine, Sales Engine, Business DNA, Institutional Memory, Domain Graph, and Workflow Engine

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages:

- **CRM Engine** — behavioral integration, via `audience` (dynamic segmentation against real customers, `Pick<CrmRuntime, 'queries'>`) and `relationship-management` (`syncLeadToCrm()`, `getCustomerContext()`, `Pick<CrmRuntime, 'leads' | 'customers'>`).
- **Sales Engine** — behavioral integration, via `relationship-management`. `getOpportunityContext()` fetches a real Sales Engine opportunity. Optional — injected as `Pick<SalesRuntime, 'opportunities'>`.
- **Business DNA** — structural integration (`shared/identifiers.ts` reuses `OrganizationId` / `CustomerId` / `EmployeeId`) and behavioral, via `relationship-management`'s `getBusinessProfileContext()`. Optional — injected as `Pick<BusinessDnaRuntime, 'businessProfile'>`.
- **Institutional Memory** — behavioral integration, via `relationship-management`. `logCampaignToMemory()` records a campaign as a real Institutional Memory `'observation'` knowledge entry. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.
- **Domain Graph** — behavioral integration, via `relationship-management`. `syncCampaignToGraph()` registers or updates a real Domain Graph `'campaign'` entity. Optional — injected as `Pick<DomainGraphRuntime, 'entities' | 'relationships'>`.
- **Workflow Engine** — behavioral integration, via `workflow-integration`. `generateRequest()` composes the real `defineWorkflow()` + `startWorkflow()` composition-root operations to back every marketing workflow request with a genuine, deterministic single-step workflow instance. Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.

Every optional collaborator degrades to a documented no-op (`null`, an empty list, or no workflow linkage) when not injected, so the Marketing Engine is fully usable — and fully tested — completely offline.

## Event bus

`MarketingEventMap` declares the 9 required events, each genuinely published by the real service that causes it:

`campaign.created`, `campaign.launched`, `campaign.paused`, `campaign.completed`, `lead.generated`, `lead.scored`, `content.created`, `workflow.requested`, `metrics.updated`.

## Usage

```typescript
import { createMarketingRuntime } from '@lateen-os/marketing-engine';

const runtime = createMarketingRuntime();

const campaign = await runtime.campaigns.create('org-1', { name: 'Spring Launch', campaignType: 'email' });
await runtime.campaigns.schedule('org-1', campaign.id, { scheduledAt: '2026-03-01T00:00:00.000Z' });
await runtime.campaigns.launch('org-1', campaign.id);

const lead = await runtime.leadGeneration.generateLead('org-1', {
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  source: 'inbound',
  campaignId: campaign.id,
  engagementScore: 70,
  profileCompletenessPct: 80,
  activityCount: 3,
  lastActivityAt: new Date().toISOString(),
});
await runtime.leadScoring.scoreLead('org-1', lead.id);

await runtime.attribution.recordTouchpoint('org-1', lead.id, campaign.id);
const credits = await runtime.attribution.computeAttributionForLead('org-1', lead.id, 'linear');

await runtime.metrics.recordMetrics('org-1', campaign.id, { impressions: 10000, clicks: 500, conversions: 25, cost: '1000.00', revenue: '5000.00' });

const request = await runtime.workflows.generateRequest('org-1', { requestType: 'campaign_approval', campaignId: campaign.id });
await runtime.workflows.completeRequest('org-1', request.id, { approved: true });

const { matches } = await runtime.queries.searchMarketing({ organizationId: 'org-1', keyword: 'Spring' });
```

Wiring in the real CRM Engine / Sales Engine / Business DNA / Institutional Memory / Domain Graph / Workflow Engine collaborators:

```typescript
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createDomainGraphRuntime } from '@lateen-os/domain-graph';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';

const crm = createCrmRuntime();
const sales = createSalesRuntime();
const businessDna = createBusinessDnaRuntime();
const institutionalMemory = createInstitutionalMemoryRuntime();
const domainGraph = createDomainGraphRuntime();
const workflow = createWorkflowRuntime();

const runtime = createMarketingRuntime({ crm, sales, businessDna, institutionalMemory, domainGraph, workflow });

const crmLead = await runtime.relationships.syncLeadToCrm('org-1', lead);
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('lead.scored', (payload) => {
  console.log(`Lead ${payload.leadId} scored ${payload.score}`);
});
```

## Structure

```
src/
├── shared/                  # IDs (reusing Business DNA's), primitives, id.ts/errors.ts helpers
├── campaign/                 # Campaign Lifecycle + deterministic Campaign Types
├── audience/                 # Audience Engine, composed with the CRM Engine
├── lead-generation/          # Lead Generation (inbound/outbound/referral/event/manual import)
├── lead-scoring/              # Deterministic Lead Scoring engine
├── content/                   # Content Library
├── calendar/                  # Marketing Calendar
├── attribution/                # Attribution engine
├── metrics/                    # Marketing Metrics
├── workflow-integration/        # Workflow Integration, composed with the Workflow Engine
├── relationship-management/     # CRM Engine / Sales Engine / Business DNA / Institutional Memory / Domain Graph integration
├── queries/                     # Real MarketingQueries read layer
├── events/                      # Typed MarketingEventMap
├── runtime.ts                   # createMarketingRuntime() composition root
└── index.ts
```

See [MARKETING_MODEL.md](./MARKETING_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId` / `CustomerId` / `EmployeeId`; optional Relationship Layer collaborator
- `@lateen-os/crm-engine` — optional Audience Engine + Relationship Layer collaborator
- `@lateen-os/sales-engine` — optional Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator
- `@lateen-os/domain-graph` — optional Relationship Layer collaborator
- `@lateen-os/workflow-engine` — optional Workflow Integration collaborator

## Verification

```bash
pnpm --filter @lateen-os/marketing-engine build
pnpm --filter @lateen-os/marketing-engine typecheck
pnpm --filter @lateen-os/marketing-engine test
pnpm --filter @lateen-os/marketing-engine lint
```
