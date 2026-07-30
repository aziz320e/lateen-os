# Lateen OS Enterprise — Changelog

All notable changes for **Lateen OS Enterprise v1.0.0-rc.2**.

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

- A second, independent Turbo cyclic workspace dependency was found: `@lateen-os/ai-brain` ↔ `@lateen-os/multi-agent` (in addition to rc.1's kernel↔sdk↔extension-system cycle below). Any Turbo invocation that includes `apps/backend` (which depends on `ai-brain`) fails immediately — including the existing unfiltered root `pnpm build`/`test`/`lint`/`typecheck`. `apps/erp-web` alone is unaffected. See `release/KNOWN_LIMITATIONS.md`.
- Neither cycle was introduced or touched in this RC; fixing either is out of scope (touches packages outside this RC's changes) and is recommended as a P0 for v1.1.
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

- Turbo cyclic dependency: `@lateen-os/kernel` ↔ `@lateen-os/sdk` ↔ `@lateen-os/extension-system` — use phased validation script
- Payment gateway: stub only (Cloud Control Plane)
- AI execution: contract/stub in design-time apps (AI Studio, Automation Studio)

### Architecture

- Architecture v1.0 locked — see `release/FREEZE.md`

[1.0.0-rc.1]: https://github.com/lateen-os/lateen-os/releases/tag/v1.0.0-rc.1
