# @lateen-os/sales-engine

Sales Engine — sales opportunity lifecycle, pipeline, quotes, pricing, forecasting, commissions, activities, and tasks for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Sales Engine is the canonical revenue-conversion layer: it owns the Sales Opportunity Lifecycle and deterministic Sales Pipeline, the Quote Engine, Product Pricing, Sales Forecasting, the Commission Engine, the Sales Activities timeline, and Sales Tasks — and is the one package that integrates CRM Engine, Business DNA, and Institutional Memory on behalf of the sales domain, exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` lifecycle/service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, no AI/LLM anywhere in this package
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createSalesRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Sales Opportunity Lifecycle + Pipeline | `opportunity` | Guarded `create` / `qualify` / `propose` / `negotiate` / `closeWon` / `closeLost` / `reopen` / `archive`, built on a deterministic 8-stage pipeline: `new → discovery → qualified → proposal → negotiation → verbal_commit → won/lost` |
| Quote Engine | `quote` | `create` / `update` / `archive`, deterministic totals/tax/discount calculation, immutable version history |
| Product Pricing | `pricing` | Composes with the Business DNA Product Catalog for list price and bundle price; computes negotiated and volume pricing deterministically |
| Sales Forecast | `forecast` | Deterministic weighted pipeline, stage win-probability, expected revenue, and monthly forecast — no AI model |
| Commission Engine | `commission` | Fixed, percentage, and tiered commission plans, plus a pure calculator |
| Sales Activities | `activity` | Logs meetings, calls, emails, demos, and follow-ups in deterministic chronological order |
| Sales Tasks | `task` | Generates deterministic Workflow Engine requests for proposal approval, contract review, and follow-up reminders |
| Relationship Layer | `relationship-management` | The **only** integration point with CRM Engine, Business DNA, and Institutional Memory — see below |
| Performance Metrics | `metrics` | Deterministic win rate, loss rate, average deal size, average sales cycle, and pipeline value |
| Query Layer | `queries` | Real, read-only `SalesQueries` port — `findOpportunities` / `findQuotes` / `findForecasts` / `findPipeline` / `findActivities` / `findTasks` / `searchSales` |
| Event Bus | `events` | Typed `SalesEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with CRM Engine, Business DNA, Institutional Memory, and Workflow Engine

Per the architecture rules, this package integrates with sibling packages **only through their public APIs** — never a repository, never a modification to those packages:

- **CRM Engine** — behavioral integration, via `relationship-management`. `getCustomerContext()` / `getContactContext()` / `getAccountContext()` fetch real CRM Engine records. Structural integration too: `shared/identifiers.ts` reuses CRM Engine's `ContactId` / `AccountId` directly. Optional — injected as `Pick<CrmRuntime, 'customers' | 'contacts' | 'accounts'>`.
- **Business DNA** — behavioral integration, via `pricing` (Product Catalog: list price, bundle price) and `relationship-management` (`getBusinessProfileContext()`). Structural integration too: `shared/identifiers.ts` reuses `OrganizationId` / `CustomerId` / `EmployeeId` / `ProductId` / `ProductBundleId` directly. Optional — injected as `Pick<BusinessDnaRuntime, 'products' | 'businessProfile'>`.
- **Institutional Memory** — behavioral integration, via `relationship-management`. `logActivityToMemory()` records a significant sales activity as a real Institutional Memory `'observation'` knowledge entry. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.
- **Workflow Engine** — behavioral integration, via `task`. `generateTask()` composes the real `defineWorkflow()` + `startWorkflow()` composition-root operations to back every sales task with a genuine, deterministic single-step workflow instance. Optional — injected as `Pick<WorkflowRuntime, 'defineWorkflow' | 'startWorkflow'>`.

Every optional collaborator degrades to a documented no-op (`null`, or no workflow linkage) when not injected, so the Sales Engine is fully usable — and fully tested — completely offline.

Decision Engine and Intelligence Engine are permitted integration targets per the architecture but are not used by any capability in this commit — no capability here calls for an automated decision or an AI-driven insight, and integrating with either without a real use would be unused surface area.

## Event bus

`SalesEventMap` declares the 9 required events, each genuinely published by the real service that causes it:

`opportunity.created`, `opportunity.qualified`, `proposal.created`, `proposal.approved`, `negotiation.started`, `deal.won`, `deal.lost`, `quote.created`, `forecast.updated`.

## Usage

```typescript
import { createSalesRuntime } from '@lateen-os/sales-engine';

const runtime = createSalesRuntime();

const opportunity = await runtime.opportunities.create('org-1', {
  name: 'Acme Corp — Annual Contract',
  amount: '50000.00',
  currency: 'USD',
  expectedCloseDate: '2026-09-01T00:00:00.000Z',
});
await runtime.opportunities.qualify('org-1', opportunity.id);
await runtime.opportunities.propose('org-1', opportunity.id);
await runtime.opportunities.negotiate('org-1', opportunity.id);
await runtime.opportunities.closeWon('org-1', opportunity.id);

const quote = await runtime.quotes.createQuote('org-1', {
  title: 'Acme Corp — Signage Package',
  opportunityId: opportunity.id,
  currency: 'USD',
  lineItems: [{ description: 'Illuminated sign', quantity: '2', unitPrice: '1500.00' }],
  taxRatePct: '15',
});

const task = await runtime.tasks.generateTask('org-1', {
  taskType: 'proposal_approval',
  opportunityId: opportunity.id,
});
await runtime.tasks.completeTask('org-1', task.id, { approved: true });

const forecast = await runtime.forecast.generateForecast('org-1');
const metrics = await runtime.metrics.getMetrics('org-1');
const { matches } = await runtime.queries.searchSales({ organizationId: 'org-1', keyword: 'Acme' });
```

Wiring in the real CRM Engine / Business DNA / Institutional Memory / Workflow Engine collaborators:

```typescript
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';

const crm = createCrmRuntime();
const businessDna = createBusinessDnaRuntime();
const institutionalMemory = createInstitutionalMemoryRuntime();
const workflow = createWorkflowRuntime();

const runtime = createSalesRuntime({ crm, businessDna, institutionalMemory, workflow });

const customer = await crm.customers.get('org-1', someCustomerId);
const context = await runtime.relationships.getCustomerContext('org-1', someCustomerId);
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('deal.won', (payload) => {
  console.log(`Opportunity ${payload.opportunityId} won${payload.amount ? ` for ${payload.amount}` : ''}`);
});
```

## Structure

```
src/
├── shared/                  # IDs (reusing Business DNA's and CRM Engine's), primitives, id.ts/errors.ts helpers
├── opportunity/              # Sales Opportunity Lifecycle + deterministic Sales Pipeline
├── quote/                    # Quote Engine — totals, tax, discount, version history
├── pricing/                  # Product Pricing, composed with the Business DNA Product Catalog
├── forecast/                  # Sales Forecast — weighted pipeline, monthly forecast
├── commission/                # Commission Engine — fixed / percentage / tiered
├── activity/                  # Sales Activities timeline
├── task/                      # Sales Tasks, composed with the Workflow Engine
├── relationship-management/   # CRM Engine / Business DNA / Institutional Memory integration
├── metrics/                   # Performance Metrics — win rate, loss rate, deal size, cycle, pipeline value
├── queries/                   # Real SalesQueries read layer
├── events/                    # Typed SalesEventMap
├── runtime.ts                 # createSalesRuntime() composition root
└── index.ts
```

See [SALES_MODEL.md](./SALES_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId` / `CustomerId` / `EmployeeId` / `ProductId` / `ProductBundleId`; optional Product Pricing + Relationship Layer collaborator
- `@lateen-os/crm-engine` — `AccountId` / `ContactId`; optional Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator
- `@lateen-os/workflow-engine` — optional Sales Tasks collaborator

## Verification

```bash
pnpm --filter @lateen-os/sales-engine build
pnpm --filter @lateen-os/sales-engine typecheck
pnpm --filter @lateen-os/sales-engine test
pnpm --filter @lateen-os/sales-engine lint
```
