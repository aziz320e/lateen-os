# Business DNA Service — Architecture Report (Epic 3)

> **Date:** 2026-07-18  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked) — First Real Backend Service

## Executive summary

Epic 3 introduces `@lateen-os/business-dna-service`, the **System of Record** for Business DNA (Layer 1). This is the first real backend service of Lateen OS: it owns CRUD operations, Zod validation, PostgreSQL persistence via Prisma, NATS domain event publishing, REST APIs at `/api/v1`, Keycloak-ready authentication contracts, Decision Engine authorization, and OpenTelemetry observability.

**The `@lateen-os/business-dna` package was not modified** — the service consumes repository interfaces and domain types from that package.

## Deliverables

| Item | Status |
| ---- | ------ |
| `services/business-dna-service` | Done |
| Clean + Hexagonal structure | Done |
| Prisma schema (20 models) | Done |
| Initial migration SQL | Done |
| Seed support | Done |
| 20 Prisma repository implementations | Done |
| Generic CRUD application layer + events | Done |
| REST API `/api/v1` (CRUD all entities) | Done |
| OpenAPI / Swagger (`/docs`) | Done |
| Zod request/response schemas | Done |
| NATS event publisher (no consumers) | Done |
| Keycloak-ready auth abstraction | Done |
| Decision Engine authorization | Done |
| OpenTelemetry + structured logging | Done |
| Health + metrics endpoints | Done |
| Unit + API tests | Done |
| README, API, DATABASE, DEPLOYMENT docs | Done |
| `pnpm build` | Passed |
| `pnpm test` | Passed |
| `pnpm typecheck` | Passed |

## Goal

Implement the first executable backend service that persists and exposes all Business DNA aggregates as the authoritative system of record for Lateen OS Layer 1.

## Service structure

```
services/business-dna-service/
├── prisma/
│   ├── schema.prisma          # 20 models
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── application/           # EntityCrudService, event orchestration
│   ├── domain/                # Ports (Auth, Authorization, EventPublisher)
│   ├── infrastructure/        # Auth, OTel, logging
│   ├── api/                   # Fastify server, routes, middleware
│   ├── repositories/          # Prisma implementations + mappers
│   ├── database/              # Prisma client module
│   ├── events/                # NATS + NoOp publishers
│   ├── validation/            # Zod schemas
│   ├── config/                # Environment config
│   └── main.ts
├── tests/
│   ├── unit/
│   └── api/
├── README.md
├── API.md
├── DATABASE.md
└── DEPLOYMENT.md
```

## Architecture layers

| Layer | Responsibility |
| ----- | -------------- |
| **API** | Fastify REST, Swagger, auth middleware, Zod validation |
| **Application** | `EntityCrudService` — CRUD + domain event publishing |
| **Domain** | Port interfaces (no framework dependencies) |
| **Infrastructure** | Keycloak auth contract, Decision Engine authz, OTel, Pino |
| **Repositories** | Prisma adapters implementing `@lateen-os/business-dna` ports |

## Persistence model

| Model | Scope | Notes |
| ----- | ----- | ----- |
| Organization | Root tenant | No `organizationId` FK |
| Branch, Department, Employee, Role, Permission | Tenant-scoped | Standard columns + JSON `data` |
| Customer, Supplier, Product, Service, Machine | Tenant-scoped | JSON enrichment |
| Project, Quotation, Order, Invoice | Tenant-scoped | Commercial docs with `lineItems` JSON |
| Workflow, Policy, KPI, Asset, Agent | Tenant-scoped | JSON enrichment |

**Pattern:** Core query/filter fields are first-class columns; extended domain fields live in JSON `data` columns to avoid schema churn while preserving full domain fidelity.

## Repository coverage

All 20 repository interfaces from `@lateen-os/business-dna` are implemented:

Organization, Branch, Department, Employee, Role, Permission, Customer, Supplier, Product, Service, Machine, Project, Quotation, Order, Invoice, Workflow, Policy, KPI, Asset, Agent — including custom find methods (`findByCode`, `findByOrganization`, `findByStatus`, etc.).

## API surface

| Pattern | Example |
| ------- | ------- |
| Organization CRUD | `GET/POST /api/v1/organizations`, `GET/PUT/DELETE /api/v1/organizations/:id` |
| Tenant-scoped CRUD | `GET/POST /api/v1/organizations/:organizationId/branches`, `.../branches/:id` |

All 19 tenant-scoped aggregates follow the same nested route pattern under `/api/v1/organizations/:organizationId/{resource}`.

OpenAPI documentation: `http://localhost:4001/docs`

## Events

Domain events publish to NATS on create/update/delete:

```
{NATS_SUBJECT_PREFIX}.{entity}_{action}
```

Example: `lateen.business_dna.branch_created`

Consumers are **not** implemented in Epic 3 (publish-only).

## Authentication & authorization

| Concern | Implementation |
| ------- | -------------- |
| Authentication | `AuthProvider` port; `KeycloakAuthProvider` contract + `DevelopmentAuthProvider` |
| Dev token | `Authorization: Bearer dev:<orgId>:<subject>` |
| Anonymous dev | `X-Organization-Id` header |
| Authorization | `AuthorizationProvider` via Decision Engine policies + dev fallback |

Keycloak server is **not** deployed — contracts and middleware only.

## Observability

| Component | Endpoint / mechanism |
| --------- | -------------------- |
| Health | `GET /health` |
| Metrics note | `GET /metrics` (OTel collector for full metrics) |
| Traces | OpenTelemetry OTLP exporter |
| Logs | Pino structured JSON |

## Platform dependencies

| Package | Usage |
| ------- | ----- |
| `@lateen-os/business-dna` | Domain types + repository interfaces |
| `@lateen-os/decision-engine` | Authorization policy evaluation |
| `@lateen-os/shared-kernel` | Entity, Identifier primitives |

## Verification

```bash
pnpm --filter @lateen-os/business-dna-service build
pnpm --filter @lateen-os/business-dna-service test
pnpm typecheck
```

| Check | Result |
| ----- | ------ |
| Build | Passed |
| Tests (4) | Passed |
| Monorepo typecheck | Passed |

## Architectural boundaries

- **System of Record** — owns persistence and CRUD for Business DNA
- **Does not modify** `@lateen-os/business-dna` package
- **Publish-only events** — no NATS consumers in Epic 3
- **Contract-only Keycloak** — no identity server deployment
- **No list endpoints yet** — CRUD by ID; list queries via repository methods reserved for future API expansion

## Next steps (post Epic 3)

| Sprint | Focus |
| ------ | ----- |
| Sprint 11 | NATS event consumers (domain graph, institutional memory) |
| Sprint 12 | List/search API endpoints |
| Sprint 13 | Repository integration tests against PostgreSQL |
| Sprint 14 | Keycloak server integration |

## References

- [Business DNA Service README](../../services/business-dna-service/README.md)
- [API documentation](../../services/business-dna-service/API.md)
- [Database documentation](../../services/business-dna-service/DATABASE.md)
- [Architecture v1.0](./lateen-os-v1.md)
- [Platform Infrastructure Report](./platform-infrastructure-report-v1.md)
