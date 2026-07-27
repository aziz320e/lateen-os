# @lateen-os/crm-engine

CRM Engine — customer, lead, contact, account, and opportunity management for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The CRM Engine is the canonical customer-relationship layer: it owns Leads, Customers, Contacts, Accounts, Opportunities (the deal pipeline), and their Activity Timeline, and is the one package that integrates Business DNA, Institutional Memory, and Domain Graph on behalf of the sales/customer domain — exclusively through each package's public API.

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` lifecycle/service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, no AI/LLM anywhere in this package
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createCrmRuntime()` for the composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Customer Lifecycle | `customer` | Guarded `create` / `update` / `archive` / `restore`, plus deterministic `mergeDuplicates()` |
| Lead Management | `lead` | Guarded `create` / `qualify` / `convert` / `reject` / `reopen`; `convert()` composes the real `CustomerLifecycle` rather than duplicating customer-creation logic |
| Contact Management | `contact` | `create` / `update` / `archive` / `restore` |
| Account Management | `account` | `create` / `update` / `archive` / `restore` |
| Opportunity Management + Deal Pipeline | `opportunity` | Guarded, deterministic pipeline: `new → qualified → proposal → negotiation → won/lost` |
| Activity Timeline | `activity` | Logs calls, meetings, emails, notes, and tasks against any CRM record, returned in deterministic chronological order |
| Duplicate Detection | `duplicate-detection` | Deterministic matching by email, phone, company, and normalized name — pure functions, no fuzzy-matching library |
| Relationship Management | `relationship-management` | The **only** integration point with Business DNA, Institutional Memory, and Domain Graph — see below |
| Query Layer | `queries` | Real, read-only `CrmQueries` port — `findCustomers` / `findLeads` / `findContacts` / `findAccounts` / `findDeals` / `findActivities` / `findOpportunities` / `searchCRM` |
| Event Bus | `events` | Typed `CrmEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with Business DNA, Institutional Memory, and Domain Graph

Per the architecture rules, this package integrates with those three packages **only through their public APIs** — never a repository, never a modification to those packages:

- **Business DNA** — structural integration. `shared/identifiers.ts` reuses `OrganizationId`, `CustomerId`, and `EmployeeId` directly from `@lateen-os/business-dna` rather than redefining them.
- **Domain Graph** — behavioral integration, via `relationship-management`. `syncCustomerToGraph()` / `syncLeadToGraph()` / `syncContactToGraph()` register or update real Domain Graph entities (reusing its existing `'customer'` / `'lead'` / `'contact'` node types), and `linkEntities()` creates real Domain Graph relationships. Optional — injected as `Pick<DomainGraphRuntime, 'entities' | 'relationships'>`.
- **Institutional Memory** — behavioral integration, via `relationship-management`. `logActivityToMemory()` records a significant activity as a real Institutional Memory `'observation'` knowledge entry. Optional — injected as `Pick<InstitutionalMemoryRuntime, 'lifecycle'>`.

Both Domain Graph and Institutional Memory collaborators are optional: every `relationship-management` method degrades to a documented no-op (`null`) when its collaborator isn't injected, so the CRM Engine is fully usable — and fully tested — completely offline.

## Event bus

`CrmEventMap` declares the 9 required events, each genuinely published by the real service that causes it:

`lead.created`, `lead.qualified`, `lead.converted`, `customer.created`, `customer.updated`, `opportunity.created`, `opportunity.won`, `opportunity.lost`, `activity.logged`.

## Usage

```typescript
import { createCrmRuntime } from '@lateen-os/crm-engine';

const runtime = createCrmRuntime();

const lead = await runtime.leads.create('org-1', { name: 'Jordan Lee', email: 'jordan@example.com', company: 'Acme Corp' });
await runtime.leads.qualify('org-1', lead.id);
const { customer } = await runtime.leads.convert('org-1', lead.id);

const opportunity = await runtime.opportunities.create('org-1', {
  name: 'Acme Corp — Annual Contract',
  customerId: customer.id,
  amount: '50000.00',
  currency: 'USD',
});
await runtime.opportunities.advanceStage('org-1', opportunity.id, 'qualified');
await runtime.opportunities.win('org-1', opportunity.id);

await runtime.activities.log('org-1', {
  activityType: 'call',
  subject: 'Kickoff call',
  relatedTo: { entityType: 'customer', entityId: customer.id },
});

const { matches } = await runtime.queries.searchCRM({ organizationId: 'org-1', keyword: 'Acme' });
```

Wiring in the real Domain Graph / Institutional Memory collaborators:

```typescript
import { createDomainGraphRuntime } from '@lateen-os/domain-graph';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';

const domainGraph = createDomainGraphRuntime();
const institutionalMemory = createInstitutionalMemoryRuntime();
const runtime = createCrmRuntime({ domainGraph, institutionalMemory });

const graph = await domainGraph.graphs.create('org-1', { name: 'Primary Graph' });
await runtime.relationships.syncCustomerToGraph('org-1', graph.id, customer);
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('opportunity.won', (payload) => {
  console.log(`Opportunity ${payload.opportunityId} won${payload.amount ? ` for ${payload.amount}` : ''}`);
});
```

## Structure

```
src/
├── shared/                  # IDs (reusing Business DNA's), primitives, id.ts/errors.ts helpers
├── customer/                # Customer Lifecycle
├── lead/                    # Lead Management (composes CustomerLifecycle for convert())
├── contact/                 # Contact Management
├── account/                 # Account Management
├── opportunity/              # Opportunity Management + Deal Pipeline
├── activity/                 # Activity Timeline
├── duplicate-detection/       # Deterministic duplicate matching
├── relationship-management/   # Business DNA / Domain Graph / Institutional Memory integration
├── queries/                  # Real CrmQueries read layer
├── events/                   # Typed CrmEventMap
├── runtime.ts                # createCrmRuntime() composition root
└── index.ts
```

See [CRM_MODEL.md](./CRM_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna` — `OrganizationId` / `CustomerId` / `EmployeeId`
- `@lateen-os/domain-graph` — optional Relationship Management collaborator
- `@lateen-os/institutional-memory` — optional Relationship Management collaborator

## Verification

```bash
pnpm --filter @lateen-os/crm-engine build
pnpm --filter @lateen-os/crm-engine typecheck
pnpm --filter @lateen-os/crm-engine test
pnpm --filter @lateen-os/crm-engine lint
```
