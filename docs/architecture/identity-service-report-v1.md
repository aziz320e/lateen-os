# Identity Service — Architecture Report (Epic 10)

> **Date:** 2026-07-19  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked)

## Executive summary

Epic 10 introduces `@lateen-os/identity-service`, the **enterprise identity and security platform** for Lateen OS. This service makes the platform production-ready for multi-tenant organizations with authentication (username/password, JWT, OIDC/OAuth2 via Keycloak), authorization integrated with Business DNA and Decision Engine, session management, rate limiting, account lockout, audit logging, and NATS domain events.

**No domain packages were modified** — the service reuses `@lateen-os/business-dna` and `@lateen-os/decision-engine` types/contracts via HTTP integration.

## Deliverables

| Item | Status |
| ---- | ------ |
| `services/identity-service` | Done |
| NestJS + Fastify application | Done |
| Prisma schema (9 models) | Done |
| Organization Identity, User, Service Account, API Key, Session, Refresh Token, Device | Done |
| Username/password + JWT + refresh + remember me | Done |
| Keycloak OIDC/OAuth2 adapter | Done |
| Business DNA roles/permissions integration | Done |
| Decision Engine policy evaluation | Done |
| Password policies, rate limiting, lockout, IP restrictions | Done |
| Audit logging | Done |
| Secret rotation contracts | Done |
| NATS events (6 event types) | Done |
| OpenTelemetry + Pino | Done |
| API endpoints (all required routes) | Done |
| Unit + API tests | Done |
| README, API, SECURITY, AUTHENTICATION, AUTHORIZATION docs | Done |
| `pnpm build` | Passed |
| `pnpm test` | Passed |
| `pnpm typecheck` | Passed |

## Goal

Implement the enterprise identity and security platform that makes Lateen OS production-ready for multi-tenant organizations.

## Service structure

```
services/identity-service/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── main.ts                    # NestJS + Fastify bootstrap
│   ├── app.module.ts
│   ├── application/               # Auth, ApiKey, ServiceAccount, Permission
│   ├── domain/                    # Types + port interfaces
│   ├── infrastructure/
│   │   ├── auth/                  # JWT, Keycloak, password, policies
│   │   ├── authorization/         # Business DNA + Decision Engine
│   │   ├── audit/
│   │   ├── cache/                 # Redis sessions + rate limiter
│   │   └── observability/         # OpenTelemetry
│   ├── repositories/
│   ├── events/                    # NATS publisher
│   ├── database/
│   ├── config/
│   └── api/
│       ├── auth/                  # AuthController
│       └── health/                # HealthController
├── tests/
│   ├── unit/
│   └── api/
├── README.md
├── API.md
├── SECURITY.md
├── AUTHENTICATION.md
└── AUTHORIZATION.md
```

## Architecture layers

| Layer | Responsibility |
| ----- | -------------- |
| **API** | NestJS controllers on Fastify — REST endpoints |
| **Application** | AuthService, ApiKeyService, ServiceAccountService, PermissionService |
| **Domain** | Port interfaces, event types, auth context |
| **Infrastructure** | JWT, Keycloak, Redis, Prisma audit, OTel, Pino |
| **Repositories** | Prisma data access |

## Persistence model

| Model | Purpose |
| ----- | ------- |
| OrganizationIdentity | Tenant root linked to Business DNA org ID |
| User | Human identity with credentials and roles |
| ServiceAccount | M2M client credentials |
| ApiKey | Programmatic access keys |
| Session | Active login sessions |
| RefreshToken | Rotating refresh token chain |
| Device | Registered devices |
| AuditLog | Security audit trail |
| PermissionGrant | Explicit permission grants/revokes |

## API surface

| Method | Path |
| ------ | ---- |
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/logout` |
| POST | `/api/v1/auth/refresh` |
| GET | `/api/v1/auth/me` |
| GET/POST/DELETE | `/api/v1/auth/api-keys` |
| GET/POST | `/api/v1/auth/service-accounts` |
| GET | `/health`, `/metrics` |
| GET | `/api/v1/security/rotation-contracts` |

## Events

| Event | NATS Subject |
| ----- | ------------ |
| UserLoggedIn | `lateen.identity.UserLoggedIn` |
| UserLoggedOut | `lateen.identity.UserLoggedOut` |
| SessionExpired | `lateen.identity.SessionExpired` |
| ApiKeyCreated | `lateen.identity.ApiKeyCreated` |
| PermissionGranted | `lateen.identity.PermissionGranted` |
| PermissionRevoked | `lateen.identity.PermissionRevoked` |

## Platform dependencies

| Package/Service | Usage |
| --------------- | ----- |
| `@lateen-os/business-dna` | OrganizationId types |
| `@lateen-os/decision-engine` | Policy evaluation contracts |
| Business DNA Service (:4001) | Roles and policies HTTP fetch |
| Redis | Rate limiting, session cache |
| Keycloak | OIDC/OAuth2 (optional) |
| NATS | Domain event publishing |

## Port assignment

| Service | Port |
| ------- | ---- |
| Identity Service | **4003** |
| Business DNA Service | 4001 |
| Product Discovery | 4002 |

## Verification

```bash
pnpm --filter @lateen-os/identity-service build
pnpm --filter @lateen-os/identity-service test
pnpm --filter @lateen-os/identity-service typecheck
```

| Check | Result |
| ----- | ------ |
| build | Passed |
| test | Passed |
| typecheck | Passed |

## Architectural boundaries

- Identity Service owns credentials, sessions, and tokens
- Business DNA owns business entity definitions (roles, policies as data)
- Decision Engine evaluates policies — Identity invokes at authorization time
- Domain packages remain unchanged

## Next steps

- Wire Keycloak in docker-compose
- Migrate apps from dev Bearer tokens to Identity Service JWT
- Add OAuth2 authorization code flow UI redirect endpoints
- Prometheus metrics exporter beyond stub endpoint
