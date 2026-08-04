# Lateen OS Platform Backend Host (`apps/backend`)

A NestJS + Fastify application that hosts the platform's 27 pre-existing engine packages (CRM, Finance, Inventory, Projects, HR, Customer Success, Documents, Analytics, Administration, Marketplace, Sales, and more) behind a single process and a versioned REST API. Added in rc.2 (2026-07-30), on top of the pre-existing `packages/*`/`services/*` platform.

## Quick facts

|             |                                                                                                                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package     | `@lateen-os/backend`                                                                                                                                                                                      |
| Port        | `4013` (`config.PORT`)                                                                                                                                                                                    |
| Entry point | `src/main.ts`                                                                                                                                                                                             |
| Persistence | Prisma + PostgreSQL — 17 data models (auth/session/RBAC/tenant tables only; business-domain data lives in-memory via `RuntimeRegistryService`)                                                            |
| API docs    | OpenAPI/Swagger at `/api/docs`                                                                                                                                                                            |
| Dev         | `pnpm --filter @lateen-os/backend dev` (real `tsc --watch` + `node --watch` via `scripts/dev.js` — `tsx watch` does not implement `emitDecoratorMetadata`, which NestJS's constructor injection requires) |

## Architecture

`RuntimeRegistryService` hosts all 27 engine packages in-memory, in-process — there is no per-domain database for business data. Prisma/PostgreSQL is used only for authentication, sessions, and RBAC/tenant tables. Each domain under `src/api/v1/<domain>/` is a thin NestJS controller that calls into its corresponding engine package's public runtime API.

## Authentication & Authorization

- **Auth model**: JWT access tokens + opaque refresh tokens with rotation, issued via `packages/api-gateway`'s `AuthenticationEngine` (not routed through `services/api-gateway`, which is a separate HTTP service — see `services/api-gateway/README.md`'s scope note).
- **Refresh token tenant derivation**: `POST /auth/refresh` derives `organizationId` from the stored session (`refreshToken.session.user.organizationId`), never from caller input — see `src/auth/auth.service.ts`.
- **RBAC enforcement**: `RolesGuard`/`PermissionsGuard`/`@Roles()`/`@RequirePermission()` decorators, backed by a real policy-evaluation engine, are wired **domain-wide for CRM (38/38 routes), Finance (61/61 routes), Inventory (60/60 routes), and Projects (70/70 routes)**, and for the **Administration → Organizations sub-resource only (6/49 Administration routes)**. All four fully-wired domains, plus Administration → Organizations, are covered by a dedicated regression suite (`apps/backend/tests/rbac-regression.test.ts`). The remaining 6 domains (Sales, HR, Customer Success, Documents, Analytics, Marketplace) and the rest of Administration are authenticated (`JwtAuthGuard`) but **not yet authorization-checked** — tracked in `release/KNOWN_LIMITATIONS.md`'s "Authorization Coverage" section and `release/ROADMAP.md`.
- **Diagnostic endpoints**: `/platform`, `/engines`, and `/database/*` require authentication via `JwtAuthGuard`.

## Health & Version

- `GET /health` — readiness: aggregates all 27 hosted engine statuses plus observability component health checks; returns `healthy`/`degraded`/`unhealthy`.
- `GET /version` — liveness: package name, version, Node.js version.

See `docs/release/BACKEND_ERP_WEB_OPERATIONS.md` for the full deployment/health/logs/backup/incident/DR guide, and `release/CHANGELOG.md`'s `[Unreleased]` section for the current, up-to-date list of fixes applied to this app since rc.2 shipped.
