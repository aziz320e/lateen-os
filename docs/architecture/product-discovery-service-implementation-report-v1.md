# Product Discovery Service — Architecture Report (Epic 4)

> **Date:** 2026-07-18  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked)

## Executive summary

Epic 4 transforms `@lateen-os/product-discovery-service` from **contracts-only** (Epic 1) into a **working executable service** that discovers manufacturable business opportunities. The service orchestrates the seven-stage discovery workflow, persists results to PostgreSQL, caches with Redis, publishes events to NATS, and exposes REST APIs — using deterministic mock signal adapters and stub platform clients (no external HTTP integrations yet).

**No new domain models were created** — all Epic 1 domain types and ports are reused.

## Deliverables

| Item | Status |
| ---- | ------ |
| Executable service with Clean + Hexagonal architecture | Done |
| Prisma schema (7 models) | Done |
| Repository ports + Prisma implementations | Done |
| 7 workflow stage implementations | Done |
| 8 mock signal adapters | Done |
| Business DNA HTTP integration | Done |
| Capability derivation from Business DNA | Done |
| Decision Engine stub (submit + references) | Done |
| Intelligence Engine stub (RecommendationCandidates) | Done |
| Redis caching | Done |
| NATS events (5 types) | Done |
| REST API (4 endpoints) | Done |
| OpenAPI / Swagger | Done |
| Unit, workflow, API, repository tests | Done |
| README, API, WORKFLOW, ARCHITECTURE docs | Done |
| `pnpm build` | Passed |
| `pnpm test` (7 tests) | Passed |
| `pnpm typecheck` | Passed |

## Workflow pipeline

1. **Collect Signals** — 8 mock adapters (Google Trends, TikTok, Instagram, Alibaba, Etsy, Amazon, Temu, Noon)
2. **Normalize Signals** — group by product concept, merge demand scores
3. **Rank Signals** — composite scoring with tier assignment
4. **Match Capabilities** — Business DNA products/machines → derived capabilities
5. **Estimate Profit** — deterministic margin/volume formulas
6. **Submit to Decision Engine** — RecommendationCandidate → Decision reference
7. **Produce Recommendation** — `DiscoveryRecommendation` output

Each stage is independently testable and tracked in `WorkflowExecution`.

## API surface

| Endpoint | Purpose |
| -------- | ------- |
| POST `/api/v1/discovery/run` | Start discovery |
| GET `/api/v1/discovery/runs` | List runs |
| GET `/api/v1/discovery/runs/:id` | Get run |
| GET `/api/v1/discovery/recommendations` | List recommendations |

## Events published

| Event | NATS subject suffix |
| ----- | ------------------- |
| DiscoveryStarted | `DiscoveryStarted` |
| SignalsCollected | `SignalsCollected` |
| CapabilitiesMatched | `CapabilitiesMatched` |
| DecisionRequested | `DecisionRequested` |
| RecommendationCreated | `RecommendationCreated` |

Prefix: `lateen.product_discovery`

## Platform consumption

| Package / Service | Usage |
| ----------------- | ----- |
| `@lateen-os/business-dna` | Domain types (OrganizationId, Product, Machine, etc.) |
| `@lateen-os/capability-engine` | Capability types for derivation |
| `@lateen-os/decision-engine` | Decision, Recommendation types |
| `@lateen-os/intelligence-engine` | ProductOpportunity, RecommendationCandidate |
| `@lateen-os/shared-kernel` | DomainEvent, Identifier |
| Business DNA Service (HTTP) | Products, machines, projects, customers |
| Redis | Signal + capability + Business DNA response cache |
| NATS | Event publishing |
| PostgreSQL | Discovery persistence |

## Business DNA enhancement

Added **list endpoints** to Business DNA Service for Epic 4 integration:

```
GET /api/v1/organizations/:organizationId/products
GET /api/v1/organizations/:organizationId/machines
GET /api/v1/organizations/:organizationId/projects
GET /api/v1/organizations/:organizationId/customers
```

## Architectural boundaries

- **No external signal APIs** — mock adapters only
- **No new domain models** — Epic 1 types reused
- **Stub Decision/Intelligence engines** — in-memory, no HTTP service
- **Isolated Prisma client** — `@prisma/product-discovery-client` avoids schema collision with Business DNA

## Verification

```bash
pnpm --filter @lateen-os/product-discovery-service build
pnpm --filter @lateen-os/product-discovery-service test
pnpm typecheck
```

## References

- [Product Discovery README](../../services/product-discovery/README.md)
- [Epic 1 Report](./product-discovery-service-report-v1.md)
- [Business DNA Service Report](./business-dna-service-report-v1.md)
- [Architecture v1.0](./lateen-os-v1.md)
