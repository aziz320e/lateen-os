# Lateen OS Enterprise — Changelog

All notable changes for **Lateen OS Enterprise v1.0.0-rc.2**.

## [Unreleased] — Post-rc.2 Hardening

Security and correctness fixes to `apps/backend` found and closed after rc.2 shipped. No new business features; no packages outside `apps/backend`, `packages/finance-engine`, `packages/inventory-engine`, `packages/project-management-engine`, and `packages/shared-kernel` were touched.

### Fixed

- **Refresh-token cross-tenant privilege escalation** — `POST /auth/refresh` trusted a client-supplied `organizationId` instead of deriving tenant from the stored session; a caller could mint an access token for an organization they were not a member of. Fixed in `apps/backend/src/auth/auth.controller.ts` / `auth.service.ts`. Regression tests added in `apps/backend/tests/auth.test.ts` covering normal refresh, rotation reuse, an expired refresh token, a garbage token, and the escalation scenario itself (a token from one organization can never yield an access token for another).
- **Administration → Organizations routes had no authorization check** — any authenticated caller, regardless of role, could read/mutate any organization. Fixed by wiring the existing `PermissionsGuard`/`@RequirePermission()` decorators (no new permission codes introduced).
- **Inventory and Projects APIs had zero authorization enforcement** — both controllers applied only `JwtAuthGuard`; any authenticated caller, regardless of permissions, could read and write all inventory and project data (verified: a token with an empty permission set could create a warehouse and a project). Fixed by wiring the existing `PermissionsGuard`/`@RequirePermission()` decorators domain-wide (Inventory 60/60 routes, Projects 70/70 routes), and extending the existing permission taxonomy with `inventory:read`/`inventory:write` and `projects:read`/`projects:write` (`apps/backend/src/database/seed-runner.service.ts`) — the smallest extension consistent with the existing CRM/Finance model, no new authorization mechanism introduced.
- **RBAC guards and permission decorators wired to zero routes** (original post-rc.2 finding) — the guards, decorators, and policy evaluation engine existed but were not applied to any controller. Wired domain-wide for CRM (38/38 routes), Finance (61/61 routes), Inventory (60/60 routes), and Projects (70/70 routes), and for the Administration → Organizations sub-resource specifically (6/49 Administration routes — the rest of Administration remains authenticated-only, not RBAC-checked). 6 domains (Sales, HR, Customer Success, Documents, Analytics, Marketplace) do not yet have a seeded permission taxonomy and are tracked as follow-up work, not RBAC-enforced in this hardening pass.
- **RBAC wiring had no regression coverage** — the permission-guard wiring above (CRM, Finance, Administration → Organizations, Inventory, Projects) had no automated test proving it; a future change could silently remove a guard with nothing to catch it. Added `apps/backend/tests/rbac-regression.test.ts`, which binds the real `PermissionsGuard`/`JwtAuthGuard` to each controller's actual, compiled route handler (via `Reflector` and Nest's own `GUARDS_METADATA`) and proves the full 401/403/200 matrix for all five domains. Verified to actually catch a regression: temporarily removing the guard from one route makes the corresponding test fail.
- **Unauthenticated diagnostic endpoints leaking internal error detail** — `/platform`, `/engines`, and `/database/*` required no authentication and returned raw internal error detail. Fixed via the existing `JwtAuthGuard`.
- **`/auth/login`, `/auth/refresh`, `/auth/me`, and `/auth/logout` returned a bare 500 when Postgres was unreachable** — an unhandled `PrismaClientInitializationError` reached the client as an undifferentiated `Internal Server Error`, indistinguishable from an actual application bug. `AuthService` now catches any non-`HttpException` error at each of its four Postgres-touching entry points and reports `ServiceUnavailableException` (503) instead, matching the existing `DatabaseHealthService` convention of treating "database unreachable" as a distinct, expected condition rather than a crash. Genuine auth failures (e.g. wrong password) are unaffected and still report 401. Regression tests added in `apps/backend/tests/auth.test.ts`.
- **Finance engine monetary arithmetic used floating-point** — `packages/finance-engine`'s decimal helper (`shared/decimal.ts`) used `Number.parseFloat`/`.toFixed`, which can lose precision on repeated arithmetic. Rewritten to exact whole-cent integer arithmetic; regression tests reproducing the original rounding error and proving the fix are in `packages/finance-engine/tests/`.
- **Unguarded read-compute-save races in Accounts Receivable, Accounts Payable, Inventory, and Projects** — concurrent requests against the same entity (e.g. two simultaneous stock reservations) could interleave and silently lose an update, since `createInMemoryRepository` has no optimistic/pessimistic locking. Fixed by serializing same-key operations through a new `createKeyMutex` primitive (`packages/shared-kernel/src/concurrency/`), applied in the four affected engines. Deterministic regression tests reproducing the original interleaving and proving serialization are in each engine's test suite.
- **Turbo cyclic workspace dependencies** (both the rc.1 `kernel`↔`sdk`↔`extension-system` cycle and the rc.2 `ai-brain`↔`multi-agent` cycle) are resolved — see `release/KNOWN_LIMITATIONS.md`. Unfiltered root `pnpm build`/`test`/`lint`/`typecheck` are no longer blocked.
- **Deployment configuration drift** — `apps/backend/.env.example`'s `DATABASE_URL` documented no credentials at all, while both `docker/docker-compose.yml` and `deployment/docker/docker-compose.apps.yml` provision Postgres with `lateen`/`lateen`; following the documented local setup verbatim failed DB auth. Corrected `.env.example` to match. Also corrected `deployment/docker/Dockerfile.backend` and `Dockerfile.frontend`, which defaulted to `NODE_VERSION=22-alpine` while `.nvmrc`/root `package.json` (`engines.node`) pin `20` — production images were running an untested major Node version. `turbo prune --docker` (both Dockerfiles) was verified still valid against the installed `turbo@2.10.5` — no change needed there.

## [1.0.0-rc.2] — 2026-07-30

### Release Candidate

Second Release Candidate. Adds a real, production-facing REST API and its first consuming application on top of rc.1's platform — plus a further production-hardening pass scoped to those two new apps. No changes to the Epic 1–35 platform surface documented under rc.1 below; those packages were not touched.

### New (this RC)

- **`apps/backend`** — Platform Backend Host: a NestJS + Fastify runtime hosting all 27 pre-existing engine packages behind a single process, with:
  - A versioned REST API (`/api/v1/...`) across CRM, Sales, Finance, Inventory, Projects, HR, Customer Success, Documents, Analytics, Administration, and Marketplace domains, backed by Prisma/PostgreSQL persistence
  - JWT-based authentication and authorization (access + refresh token rotation, RBAC guards, permission decorators)
  - OpenAPI/Swagger documentation at `api/docs`
  - Aggregate `GET /health` (readiness — all 27 engine runtimes + DB + observability) and `GET /version` (liveness)
- **`apps/erp-web`** — ERP Web: the platform's first Next.js application, consuming `apps/backend` exclusively through its REST API (CRM, Sales, Finance, Inventory, Projects, HR, Customer Success, Documents, Analytics modules)
- Enterprise demo environment (`apps/backend/scripts/demo-seed.ts`, `demo-validate.ts`) — seeds and validates a realistic, cross-domain business scenario end to end
- Production hardening for both apps: `@fastify/helmet` + `@fastify/rate-limit`, fail-fast startup validation of JWT secrets/CORS/cookie config in production (`apps/backend/src/config/index.ts`), `apps/backend/.env.example`
- Real ESLint (flat config) for both apps via a new shared `packages/eslint-config` package — replaces their previous no-op `lint` stubs
- Husky + lint-staged wired at the repo root (`.husky/pre-commit`)
- Coverage reporting (`@vitest/coverage-v8`, `test:coverage`) for both apps
- `deployment/docker/docker-compose.apps.yml` — Docker Compose stack for `backend` + `erp-web` + `postgres`, reusing the existing `Dockerfile.backend`/`Dockerfile.frontend`; both images registered in `deployment/docker/images.json` (ports 4013/3013, continuing the platform's existing port sequence)
- `.github/workflows/ci.yml` extended with coverage, dependency/security audit (informational), documentation validation, and build-artifact upload steps
- `docs/release/BACKEND_ERP_WEB_OPERATIONS.md` — deployment/health/logs/backup/incident/DR/production-checklist guide scoped to the two new apps, cross-referencing the platform-wide guides
- Measured (not estimated) build time, startup time, REST latency, memory, and bundle-size figures for both apps appended to `benchmarks/`

### Known Issues (new this RC)

- ~~A second, independent Turbo cyclic workspace dependency was found: `@lateen-os/ai-brain` ↔ `@lateen-os/multi-agent`~~ — **RESOLVED**, see `[Unreleased]` above and `release/KNOWN_LIMITATIONS.md`.
- `apps/backend` and `apps/erp-web` are not yet wired into the platform's Helm chart or Kubernetes manifests — Docker Compose is the only validated deployment path for these two apps today.

## [1.0.0-rc.1] — 2026-07-20

### Release Candidate

First Release Candidate for Lateen OS Enterprise v1.0. No new business features in this release — production hardening and validation only.

### Platform (Epics 1–34)

- **Epic 27** Enterprise API Gateway — `services/api-gateway`, `apps/admin-gateway`
- **Epic 28** AI Provider Hub — `packages/ai-provider-hub`
- **Epic 29** Enterprise Knowledge Platform — `services/knowledge-platform`
- **Epic 30** Enterprise Search — `services/search-platform`, `apps/search-center`
- **Epic 31** AI Studio — `apps/ai-studio`
- **Epic 32** Automation Studio — `apps/automation-studio`
- **Epic 33** Enterprise Analytics — `services/analytics-platform`, `apps/analytics-center`
- **Epic 34** Lateen Cloud Platform — `services/cloud-control-plane`, `apps/cloud-console`

### RC Additions (Epic 35)

- Release artifacts under `release/`
- Quality validation under `quality/`
- Security review under `security/`
- Performance benchmarks under `benchmarks/`
- Release documentation under `docs/release/`
- Phased validation script `release/scripts/validate.mjs`

### Known Issues

- ~~Turbo cyclic dependency: `@lateen-os/kernel` ↔ `@lateen-os/sdk` ↔ `@lateen-os/extension-system`~~ — **RESOLVED**, see `[Unreleased]` above and `release/KNOWN_LIMITATIONS.md`.
- Payment gateway: stub only (Cloud Control Plane)
- AI execution: contract/stub in design-time apps (AI Studio, Automation Studio)

### Architecture

- Architecture v1.0 locked — see `release/FREEZE.md`

[1.0.0-rc.1]: https://github.com/lateen-os/lateen-os/releases/tag/v1.0.0-rc.1
