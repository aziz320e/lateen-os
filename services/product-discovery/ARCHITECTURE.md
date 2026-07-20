# Product Discovery Service Architecture

## Layers

```
src/
├── api/                 # Fastify REST + OpenAPI
├── application/         # ProductDiscoveryServiceImpl
├── domain/              # Existing domain types + event port
├── ports/               # Inbound/outbound contracts (Epic 1)
├── workflows/           # Stage interfaces + implementations
├── adapters/            # Signal adapter contracts + mock implementations
├── repositories/        # Prisma persistence ports + adapters
├── infrastructure/      # HTTP clients, Redis, OTel, platform adapters
├── events/              # NATS publisher
├── database/            # Prisma client module
├── config/              # Environment config
└── main.ts              # Composition root
```

## Hexagonal boundaries

| Direction | Components |
| --------- | ---------- |
| Inbound | `ProductDiscoveryService`, REST API |
| Outbound | Business DNA HTTP, Capability derivation, Decision/Intelligence/AI Runtime adapters, NATS, Redis |
| Domain | Existing Epic 1 types — **no new domain models** |

## Persistence

| Prisma model | Domain mapping |
| ------------ | -------------- |
| DiscoveryRun | `ProductDiscoveryRun` |
| Signal | `MarketSignal` / `NormalizedSignal` |
| Opportunity | `RankedOpportunity` |
| CapabilityMatchRecord | `CapabilityMatch` |
| ProfitEstimateRecord | `ProfitEstimate` |
| RecommendationRecord | `DiscoveryRecommendation` |
| WorkflowExecution | Stage execution audit |

Prisma client: `@prisma/product-discovery-client` (isolated from Business DNA)

## External integrations

| Integration | Status |
| ----------- | ------ |
| Business DNA Service | REST client — full catalog (`loadCatalog`), trace propagation |
| Signal sources (8) | Mock adapters — deterministic, no HTTP |
| Decision Engine | In-process adapter — Redis-backed, NATS `DecisionRequested` |
| Intelligence Engine | In-process adapter — Redis-backed opportunities/candidates |
| Domain Graph | No-op stub |
| Institutional Memory | No-op stub |
| AI Runtime | In-process adapter — DiscoveryRun registered as executable task |

## Observability

- Structured logging via Fastify/Pino
- OpenTelemetry when `OTEL_EXPORTER_OTLP_ENDPOINT` is set (OTLP traces + metrics)
- `/health`, `/platform/health`, and `/metrics` endpoints

## Default ports

| Service | Port |
| ------- | ---- |
| Product Discovery | 4002 |
| Business DNA | 4001 |
