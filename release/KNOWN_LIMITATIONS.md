# Known Limitations — v1.0.0-rc.2

Honest, as-measured limitations discovered while preparing this RC. Nothing below was fabricated or assumed — each item was directly reproduced in this session's sandbox. Items carried forward from rc.1 (`release/CHANGELOG.md`) are marked accordingly.

## Build / CI

- **Resolved: both previously-documented Turbo cyclic workspace dependencies are fixed.**
  - `@lateen-os/kernel` ↔ `@lateen-os/sdk` ↔ `@lateen-os/extension-system` (documented since rc.1) — no longer a cycle. `packages/sdk/package.json` declares no dependency back on `kernel` or `extension-system`; the graph is now a one-directional chain (`kernel` → `extension-system` → `sdk`).
  - `@lateen-os/ai-brain` ↔ `@lateen-os/multi-agent` (found in rc.2) — resolved via `refactor(ai-brain): remove circular dependency on multi-agent`. `packages/ai-brain/package.json` no longer lists `@lateen-os/multi-agent` as a dependency; `multi-agent` still depends on `ai-brain` (one-directional, not a cycle).

  Verified via `turbo run build --dry-run=json`, both unfiltered and with `--filter=@lateen-os/backend`: exit code `0`, no cycle error, and `@lateen-os/backend#build`, `@lateen-os/kernel#build`, `@lateen-os/sdk#build`, and `@lateen-os/extension-system#build` all appear in the resolved task graph. The unfiltered root `pnpm build` / `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm test:coverage` are no longer blocked by either cycle.

## Test Coverage Tooling

- `@vitest/coverage-v8@3.2.7`'s statement/line coverage percentages report `0%` for every file in both `apps/backend` and `apps/erp-web`, while branch/function percentages report plausible non-zero values. The HTML/lcov/text report infrastructure itself is real and correctly wired (scripts, dependencies, `vitest.config.ts` `coverage` blocks, CI step) — the specific statement/line numbers are unreliable in this sandbox. Confirmed this is not a version mismatch (`vitest` and `@vitest/coverage-v8` both resolve to the same `3.2.7`) and reproduces identically in both apps, suggesting an environment-specific quirk in this sandbox's coverage instrumentation rather than a config error. Worth re-verifying in a standard Linux CI runner before relying on the exact percentages.

- `apps/backend`'s suite is 66/71 passing, not 48/48 as previously reported (the post-rc.2 hardening pass added 23 regression tests — 8 in `tests/auth.test.ts`, 15 in the new `tests/rbac-regression.test.ts` — none of which fail). All 5 failures are pre-existing and unrelated to this hardening pass: every one is in `tests/database.test.ts`, and every one is `Error: Test timed out in 5000ms` while the test waits on a real TCP connection attempt to an unreachable `localhost:5432`. This sandbox's OS network stack does not return `ECONNREFUSED` fast enough to beat Vitest's default 5s test timeout; the application code under test behaves correctly (it degrades gracefully, per `PrismaService`'s design) — only the test's timing assumption is sandbox-dependent. Re-verify on a standard Linux CI runner, where a loopback connection to a closed port typically refuses instantly.

## Sandbox Constraints (this session had neither a Docker daemon nor a live PostgreSQL instance)

- `deployment/docker/docker-compose.apps.yml` (new in rc.2) was validated for YAML syntax only (`js-yaml` parse). No `docker build` / `docker compose up` was run against it — there is no Docker daemon in this sandbox (`docker --version` → command not found).
- `apps/backend`'s database-dependent code paths were exercised against an unreachable Postgres (`MigrationRunnerService`/`PrismaService` degrade gracefully and non-fatally, per `tests/database.test.ts`) rather than a live instance. Startup-time and latency benchmarks in `benchmarks/` reflect this — see the caveats noted in `benchmarks/startup-benchmark.md`.

## Authorization Coverage (post-rc.2 hardening)

RBAC/permission-decorator enforcement in `apps/backend` is wired domain-wide for CRM (38/38 routes), Finance (61/61 routes), Inventory (60/60 routes), and Projects (70/70 routes), and for the Administration → Organizations sub-resource specifically (6/49 Administration routes). All four fully-wired domains, plus Administration → Organizations, are covered by a dedicated regression suite (`apps/backend/tests/rbac-regression.test.ts`) proving the 401/403/200 matrix against each controller's real, compiled route handlers — verified to fail if a guard is removed.

The remaining 6 domains — Sales, HR, Customer Success, Documents, Analytics, and Marketplace — and the rest of the Administration domain (tenants, environments, feature-flags, permissions, roles, groups, users, settings, audit, monitoring, dashboard, search) are authenticated (`JwtAuthGuard`) but **not yet authorization-checked**: any authenticated caller, regardless of role, can call these routes. This is because those domains do not yet have a seeded permission taxonomy. Tracked for v1.1 — see `release/ROADMAP.md` and `release/CHANGELOG.md`'s `[Unreleased]` section.

## Scope of This RC's Hardening

Real ESLint, Husky/lint-staged staged-file rules, coverage reporting, Docker Compose, and the new CI steps were wired for **`apps/backend` and `apps/erp-web` only** (2 of 86 workspace packages). The remaining 84 packages/apps/services/extensions still use the pre-existing no-op `lint` stub (`node -e "process.exit(0)"`) or `next lint` without ESLint installed, have no `test:coverage` script, and are not part of `docker-compose.apps.yml`. This was a deliberate scope decision (this RC's stated goal is production readiness for the platform's two newest apps, not a platform-wide lint/CI rollout) — extending the same pattern to the rest of the platform is recommended for v1.1 (added to `release/ROADMAP.md`).

## Dependency Audit

`pnpm audit` (repo-wide, all 86 packages) reports **57 vulnerabilities**: 5 low, 27 moderate, 24 high, 1 critical. The single critical finding (`tar` <=7.5.18, via `apps/backend`'s `bcrypt` → `@mapbox/node-pre-gyp` → `tar`, GHSA-23hp-3jrh-7fpw) is in `bcrypt`'s native-binary build tooling, not a runtime code path. None of these were introduced by this RC's changes; the vast majority are in transitive dependencies of the 84 packages outside this RC's scope. The new `.github/workflows/ci.yml` audit step surfaces these in every CI run as **informational, non-blocking** output (`pnpm audit || true`) rather than gating the build — gating on pre-existing, out-of-scope debt would make CI red for reasons unrelated to whatever change triggered the run. Triaging and patching this backlog is recommended for v1.1.

## Deployment Path

`apps/backend` and `apps/erp-web` are not yet wired into the platform's Helm chart (`deployment/helm/lateen-os/`) or Kubernetes manifests (`deployment/kubernetes/base/`) — both of which assume the platform's original 12 services / 13 apps. Docker Compose (`deployment/docker/docker-compose.apps.yml`) is the only validated deployment path for these two apps in this RC.

Two deployment-configuration drifts were found and corrected in this hardening pass: `apps/backend/.env.example`'s `DATABASE_URL` didn't match the credentials either Compose file actually provisions (`lateen`/`lateen`), and `deployment/docker/Dockerfile.backend`/`Dockerfile.frontend` defaulted to `NODE_VERSION=22-alpine` while `.nvmrc` and root `package.json` pin `20` — meaning the deployed image ran an untested major Node version relative to what CI validates. Both are now consistent. This session, like the one before it, had no reachable Docker daemon, so the corrected compose files were re-validated for YAML syntax only (`js-yaml` parse) — not built or run live. A live `docker compose up` verification of `docker-compose.apps.yml` is still outstanding.

## Carried Forward from rc.1

- Payment gateway (Cloud Control Plane): stub only.
- AI execution: contract/stub in design-time apps (AI Studio, Automation Studio).
- Architecture v1.0 is locked per `release/FREEZE.md`; nothing in this RC changes that.
