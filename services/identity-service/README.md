# Identity Service

Enterprise identity and security platform for Lateen OS — multi-tenant authentication, authorization, and audit.

## Purpose

The Identity Service is the production-ready security layer for Lateen OS. It manages organization identity, users, service accounts, API keys, sessions, and devices while integrating with Business DNA roles/permissions and Decision Engine policies.

## Stack

- **NestJS** + **Fastify** adapter
- **Prisma** + **PostgreSQL**
- **Redis** — sessions, rate limiting
- **Keycloak** — OIDC/OAuth2 adapter (optional)
- **NATS** — domain events
- **OpenTelemetry** — tracing and metrics
- **Zod** — config validation
- **Pino** — structured logging

## Quick start

```bash
# Create database
createdb lateen_identity

# Migrate and seed
pnpm --filter @lateen-os/identity-service db:push
pnpm --filter @lateen-os/identity-service db:seed

# Start service
pnpm --filter @lateen-os/identity-service dev
```

Open http://localhost:4003/health

Default seeded credentials: `admin` / `Admin123!` (org `00000000-0000-4000-8000-000000000001`)

## API Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/v1/auth/login` | Username/password login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke session |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/auth/api-keys` | List API keys |
| POST | `/api/v1/auth/api-keys` | Create API key |
| DELETE | `/api/v1/auth/api-keys/:id` | Revoke API key |
| GET | `/api/v1/auth/service-accounts` | List service accounts |
| POST | `/api/v1/auth/service-accounts` | Create service account |
| GET | `/health` | Health check |
| GET | `/metrics` | Metrics stub |
| GET | `/api/v1/security/rotation-contracts` | Secret rotation contracts |

## Integration

| Platform | Integration |
| -------- | ----------- |
| Business DNA | Roles, permissions, policies via HTTP client |
| Decision Engine | Policy evaluation for sensitive actions |
| Keycloak | OIDC/OAuth2 when `KEYCLOAK_ENABLED=true` |

## Documentation

- [API.md](./API.md)
- [SECURITY.md](./SECURITY.md)
- [AUTHENTICATION.md](./AUTHENTICATION.md)
- [AUTHORIZATION.md](./AUTHORIZATION.md)

## Verification

```bash
pnpm --filter @lateen-os/identity-service build
pnpm --filter @lateen-os/identity-service test
pnpm --filter @lateen-os/identity-service typecheck
```
