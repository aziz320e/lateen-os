# @lateen-os/business-dna

Business DNA Engine — canonical domain model for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 Locked** and the [Business DNA schema](../../domains/business-dna/schema/).

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine where the module has real behavior
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, no AI/LLM anywhere in this package
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createBusinessDnaRuntime()` for the composition root

## Real runtime vs. contracts-only

The Organization root, Business Profile, Vision & Mission, Business DNA (ICP/personas/positioning/etc.), Market Model, Competitor Registry, Product Catalog, Policy Engine, query layer, and event bus are **real, deterministic, in-memory implementations**:

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Organization Lifecycle | `organization` | Guarded state machine — `create` / `update` / `archive` / `restore` / `activate` / `suspend`, backed by a real in-memory `OrganizationRepository` (tenant-scoped to itself) |
| Business Profile | `business-profile` | Singleton-per-organization company metadata, industry, legal entity, and market/product/service references |
| Vision & Mission Engine | `vision-mission` | Vision, mission, values, and a guarded strategic-objective state machine |
| Business DNA Engine | `dna` | ICPs, personas, buyer journey, positioning, value proposition, tone of voice, brand rules, competitive advantages |
| Market Model | `market` | Operating markets, with deterministic derived views over countries/regions/languages/currencies |
| Competitor Registry | `competitor` | Add/update/archive plus deterministic strengths/weaknesses/price comparison and market-share ranking |
| Product Catalog | `product` | Product creation, deterministic pricing/margin calculation, guarded lifecycle transitions, priced bundles |
| Policy Engine | `policy` | Business/approval/communication/sales (plus compliance/financial/operational/security/hr) policies with a guarded lifecycle |
| Query Layer | `queries` | Real, read-only `BusinessDnaQueries` port — `findOrganizations` / `findBusinessProfile` / `findProducts` / `findCompetitors` / `findPolicies` / `findMarkets` |
| Event Bus | `events` | Typed `BusinessDnaEventMap`; every declared event is genuinely published by the service that triggers it |

The remaining 18 aggregates (`branch`, `department`, `employee`, `customer`, `supplier`, `service`, `machine`, `project`, `quotation`, `order`, `invoice`, `workflow`, `kpi`, `asset`, `agent`, `role`, `permission`) remain **contracts only** — types and repository ports with no runtime behavior yet.

## Event bus

`BusinessDnaEventMap` declares the 8 required events plus 3 Organization Lifecycle extensions, each genuinely published by the real service that causes it:

`organization.created`, `organization.updated`, `organization.archived`, `business-profile.updated`, `product.created`, `product.updated`, `competitor.registered`, `policy.updated` — plus `organization.activated`, `organization.suspended`, `organization.restored`.

## Usage

```typescript
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';

const runtime = createBusinessDnaRuntime();

const org = await runtime.organization.create({
  code: 'acme',
  name: 'Acme Signage Co.',
  legalName: 'Acme Signage Company LLC',
  registrationNumber: 'REG-001',
  taxId: 'TAX-001',
  domain: 'acme.com',
  defaultCurrency: 'SAR',
  defaultLocale: 'en-SA',
  timezone: 'Asia/Riyadh',
});
await runtime.organization.activate(org.id);

await runtime.businessProfile.upsert(org.id, {
  displayName: 'Acme Signage',
  legalEntity: {
    legalName: org.legalName,
    entityType: 'llc',
    registrationNumber: org.registrationNumber,
    taxId: org.taxId,
    countryOfIncorporation: 'SA',
  },
});

const product = await runtime.products.createProduct(org.id, {
  code: 'SIGN-001',
  name: 'Illuminated Channel Letters',
  category: 'signage',
  productionType: 'fabrication',
  unitOfMeasure: 'sqm',
  currency: 'SAR',
  basePrice: '500.00',
  costPrice: '300.00',
});

const competitor = await runtime.competitors.add(org.id, { name: 'Riyadh Signs Co.', priceIndex: '1.15' });

const { organizations } = await runtime.queries.findOrganizations({ code: 'acme' });
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('product.created', (payload) => {
  console.log(`Product ${payload.productId} created in ${payload.organizationId}`);
});
```

## Modules

| Module | Focus |
| ------ | ----- |
| `organization` | Organization aggregate root — real lifecycle state machine |
| `business-profile` | Company metadata, industry, legal entity, market/product/service references — real service |
| `vision-mission` | Vision, mission, values, strategic objectives — real engine |
| `dna` | ICP, personas, buyer journey, positioning, value proposition, tone of voice, brand rules, competitive advantages — real engine |
| `market` | Countries, regions, languages, currencies, operating markets — real engine |
| `competitor` | Competitor registry with deterministic comparison helpers |
| `product` | Product catalog with pricing, bundles, and lifecycle — real service |
| `policy` | Business rules and compliance requirements — real engine |
| `branch`, `department`, `employee`, `customer`, `supplier`, `service`, `machine`, `project`, `quotation`, `order`, `invoice`, `workflow`, `kpi`, `asset`, `agent`, `role`, `permission` | Contracts only |
| `queries` | Real `BusinessDnaQueries` read port |
| `events` | Typed `BusinessDnaEventMap` over shared-kernel's event bus |

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [BUSINESS_DNA_MODEL.md](./BUSINESS_DNA_MODEL.md)

## Verification

```bash
pnpm --filter @lateen-os/business-dna build
pnpm --filter @lateen-os/business-dna typecheck
pnpm --filter @lateen-os/business-dna test
pnpm --filter @lateen-os/business-dna lint
```
