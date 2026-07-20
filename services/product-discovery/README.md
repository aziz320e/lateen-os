# @lateen-os/product-discovery-service

Product Discovery Platform — discovers **manufacturable business opportunities** by orchestrating the Lateen OS platform.

## Purpose

Turn market signals into ranked, capability-matched, profit-estimated recommendations submitted to the Decision Engine. Epic 4 implements the full executable service on top of Epic 1 contracts.

## Stack

- **Fastify** — REST API `/api/v1/discovery`
- **Prisma + PostgreSQL** — discovery persistence
- **Redis** — signal, capability, and market snapshot caching
- **NATS** — domain event publishing
- **Zod** — request validation
- **OpenTelemetry + Pino** — observability

## Quick start

```bash
# Start platform infrastructure
./infrastructure/scripts/start.ps1

# Start Business DNA service (dependency)
pnpm --filter @lateen-os/business-dna-service db:migrate
pnpm --filter @lateen-os/business-dna-service dev

# Migrate Product Discovery schema
pnpm --filter @lateen-os/product-discovery-service db:push

# Run Product Discovery service
pnpm --filter @lateen-os/product-discovery-service dev
```

API docs: http://localhost:4002/docs

## Run a discovery

```bash
curl -X POST http://localhost:4002/api/v1/discovery/run \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "00000000-0000-4000-8000-000000000001",
    "keywords": ["signage", "vehicle wrap"]
  }'
```

## Architecture

Clean + Hexagonal — see [ARCHITECTURE.md](./ARCHITECTURE.md)

## Documentation

- [API.md](./API.md)
- [WORKFLOW.md](./WORKFLOW.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

## Verification

```bash
pnpm --filter @lateen-os/product-discovery-service build
pnpm --filter @lateen-os/product-discovery-service test
pnpm typecheck
```

## Notes

- Signal adapters return **deterministic mock data** (no external HTTP)
- Capabilities are **derived from Business DNA** products and machines via HTTP API
- Decision Engine, Intelligence Engine, and AI Runtime use **in-process platform adapters** (Redis-backed)
- Unified platform health: `GET /platform/health`
- Platform integration report: [docs/architecture/platform-integration-report-v1.md](../../docs/architecture/platform-integration-report-v1.md)
