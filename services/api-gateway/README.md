# Lateen OS Enterprise API Gateway

Unified entry point for every Lateen OS application and service. The gateway orchestrates downstream services — it does not contain business logic.

## Quick Start

```bash
pnpm install
pnpm --filter @lateen-os/api-gateway-service dev
```

Gateway listens on **http://localhost:4008**.

Admin console: **http://localhost:3007** (`pnpm --filter @lateen-os/admin-gateway dev`)

## CLI

```bash
lateen gateway start --dev
lateen gateway status
lateen gateway routes
```

## Gateway Routes

| Prefix | Downstream Service |
| ------ | ------------------ |
| `/api/auth` | Identity |
| `/api/business-dna` | Business DNA |
| `/api/discovery` | Product Discovery |
| `/api/workflows` | Integration Hub (jobs) |
| `/api/missions` | Mission Scheduler |
| `/api/search` | Marketplace |
| `/api/marketplace` | Marketplace |
| `/api/connectors` | Integration Hub |
| `/api/provisioning` | Provisioning |
| `/api/platform` | Gateway (platform info) |
| `/api/runtime`, `/api/workforce`, `/api/memory` | Planned (503) |

## Management Endpoints

- `GET /health` — Gateway health
- `GET /health/live` — Liveness probe
- `GET /health/ready` — Readiness with dependency checks
- `GET /health/dependencies` — Downstream health aggregation
- `GET /gateway/routes` — Route registry
- `GET /gateway/status` — Status and metrics
- `GET /openapi.json` — OpenAPI specification
- `GET /metrics` — Prometheus metrics

## Technology

NestJS · Fastify · OpenTelemetry · Redis · NATS · Pino · Zod · OpenAPI

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
- [SECURITY.md](./SECURITY.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)

## Verification

```bash
pnpm --filter @lateen-os/api-gateway-service build
pnpm --filter @lateen-os/api-gateway-service typecheck
pnpm --filter @lateen-os/api-gateway-service test
pnpm --filter @lateen-os/admin-gateway build
pnpm --filter @lateen-os/admin-gateway typecheck
pnpm --filter @lateen-os/admin-gateway test
```
