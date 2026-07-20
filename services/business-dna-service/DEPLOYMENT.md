# Deployment

> Business DNA Service deployment guide

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (via Lateen OS infrastructure)
- NATS (via Lateen OS infrastructure)
- OpenTelemetry Collector (optional)

## Environment variables

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT` | `4001` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `DATABASE_URL` | local postgres | PostgreSQL connection |
| `NATS_URL` | `nats://localhost:4222` | NATS server |
| `NATS_SUBJECT_PREFIX` | `lateen.business-dna` | Event subject prefix |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | — | OTel collector URL |
| `OTEL_SERVICE_NAME` | `business-dna-service` | Service name |
| `LOG_LEVEL` | `info` | Pino log level |
| `KEYCLOAK_ENABLED` | `false` | Enable Keycloak auth |
| `KEYCLOAK_ISSUER_URL` | — | Keycloak realm URL |
| `KEYCLOAK_CLIENT_ID` | `business-dna-service` | OAuth client |

## Build

```bash
pnpm install
pnpm --filter @lateen-os/business-dna-service build
```

## Database setup

```bash
pnpm --filter @lateen-os/business-dna-service db:migrate:deploy
pnpm --filter @lateen-os/business-dna-service db:seed
```

## Run

```bash
pnpm --filter @lateen-os/business-dna-service start
```

## Docker (future)

This service is designed to run alongside the Epic 2 Docker Compose stack. A dedicated Dockerfile will be added in a future sprint.

## Health checks

```
GET /health  → 200 { "status": "ok" }
```

## Keycloak integration

When `KEYCLOAK_ENABLED=true`, inject a `KeycloakTokenValidator` implementation. The service ships with:

- `KeycloakAuthProvider` — auth contract
- `KeycloakTokenClaims` — JWT claims shape
- `DevelopmentAuthProvider` — local dev fallback

No Keycloak server is bundled.

## Authorization

Wire `DecisionEngineAuthorizationProvider` with a `DecisionPolicyEvaluator` that connects to `@lateen-os/decision-engine` policies.

Development uses `DevelopmentAuthorizationProvider` (permissive).
