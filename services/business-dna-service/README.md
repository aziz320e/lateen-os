# @lateen-os/business-dna-service

Business DNA Service — **System of Record** for Lateen OS Layer 1.

## Purpose

First real backend service of Lateen OS. Owns CRUD, validation, PostgreSQL persistence, domain event publishing, and REST APIs for all Business DNA aggregates.

## Stack

- **Fastify** — REST API `/api/v1`
- **Prisma** — PostgreSQL ORM
- **Zod** — request/response validation
- **NATS** — domain event publishing
- **OpenTelemetry** — traces and metrics
- **Pino** — structured logging

## Quick start

```bash
# Start platform infrastructure
./infrastructure/scripts/start.ps1

# Migrate and seed
pnpm --filter @lateen-os/business-dna-service db:migrate
pnpm --filter @lateen-os/business-dna-service db:seed

# Run service
pnpm --filter @lateen-os/business-dna-service dev
```

API docs: http://localhost:4001/docs

## Authentication (development)

Bearer token format: `dev:<organizationId>:<subject>`

Or use anonymous access with `X-Organization-Id` header (development mode).

Keycloak integration is contract-only — see `src/infrastructure/auth/keycloak-auth.ts`.

## Documentation

- [API.md](./API.md)
- [DATABASE.md](./DATABASE.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

## Verification

```bash
pnpm --filter @lateen-os/business-dna-service build
pnpm --filter @lateen-os/business-dna-service test
pnpm --filter @lateen-os/business-dna-service typecheck
```
