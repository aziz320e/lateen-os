# Known Limitations — v1.0.0-rc.2

Honest, as-measured limitations discovered while preparing this RC. Nothing below was fabricated or assumed — each item was directly reproduced in this session's sandbox. Items carried forward from rc.1 (`release/CHANGELOG.md`) are marked accordingly.

## Build / CI

- **Two independent Turbo cyclic workspace dependencies exist:**
  - `@lateen-os/kernel` ↔ `@lateen-os/sdk` ↔ `@lateen-os/extension-system` (documented since rc.1)
  - `@lateen-os/ai-brain` ↔ `@lateen-os/multi-agent` (found in rc.2 — each package declares the other as a `workspace:*` dependency)

  Turbo refuses to compute a build order across a graph containing a cycle. Since `apps/backend` depends on `ai-brain`, **any Turbo invocation that includes `apps/backend` fails immediately** — this includes the existing, unfiltered root `pnpm build` / `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm test:coverage`. Confirmed via `turbo run build --dry-run` both unfiltered and with `--filter=@lateen-os/backend`. `turbo run build --filter=@lateen-os/erp-web` alone succeeds (exit 0) since `erp-web` has no `@lateen-os/*` package dependencies.

  **Neither cycle was introduced or touched in this RC.** Fixing either requires editing packages outside this RC's scope (`ai-brain`, `multi-agent`, `kernel`, `sdk`, `extension-system`), which is explicitly out of scope per this RC's "no architectural redesign, never modify unrelated packages" constraint. **Recommended P0 for immediate follow-up** — this blocks the platform's own documented CI pipeline (`.github/workflows/ci.yml`'s `pnpm build` step), not just this RC's two new apps.

  All validation performed in this session (both Phase 4's REST API work and this RC's hardening pass) was run via direct per-app invocation (`cd apps/backend && pnpm build`, etc.), which bypasses Turbo's cross-repo graph and is unaffected by either cycle.

## Test Coverage Tooling

- `@vitest/coverage-v8@3.2.7`'s statement/line coverage percentages report `0%` for every file in both `apps/backend` and `apps/erp-web`, while branch/function percentages report plausible non-zero values and all tests pass (48/48 backend, 18/18 erp-web). The HTML/lcov/text report infrastructure itself is real and correctly wired (scripts, dependencies, `vitest.config.ts` `coverage` blocks, CI step) — the specific statement/line numbers are unreliable in this sandbox. Confirmed this is not a version mismatch (`vitest` and `@vitest/coverage-v8` both resolve to the same `3.2.7`) and reproduces identically in both apps, suggesting an environment-specific quirk in this sandbox's coverage instrumentation rather than a config error. Worth re-verifying in a standard Linux CI runner before relying on the exact percentages.

## Sandbox Constraints (this session had neither a Docker daemon nor a live PostgreSQL instance)

- `deployment/docker/docker-compose.apps.yml` (new in rc.2) was validated for YAML syntax only (`js-yaml` parse). No `docker build` / `docker compose up` was run against it — there is no Docker daemon in this sandbox (`docker --version` → command not found).
- `apps/backend`'s database-dependent code paths were exercised against an unreachable Postgres (`MigrationRunnerService`/`PrismaService` degrade gracefully and non-fatally, per `tests/database.test.ts`) rather than a live instance. Startup-time and latency benchmarks in `benchmarks/` reflect this — see the caveats noted in `benchmarks/startup-benchmark.md`.

## Scope of This RC's Hardening

Real ESLint, Husky/lint-staged staged-file rules, coverage reporting, Docker Compose, and the new CI steps were wired for **`apps/backend` and `apps/erp-web` only** (2 of 86 workspace packages). The remaining 84 packages/apps/services/extensions still use the pre-existing no-op `lint` stub (`node -e "process.exit(0)"`) or `next lint` without ESLint installed, have no `test:coverage` script, and are not part of `docker-compose.apps.yml`. This was a deliberate scope decision (this RC's stated goal is production readiness for the platform's two newest apps, not a platform-wide lint/CI rollout) — extending the same pattern to the rest of the platform is recommended for v1.1 (added to `release/ROADMAP.md`).

## Dependency Audit

`pnpm audit` (repo-wide, all 86 packages) reports **57 vulnerabilities**: 5 low, 27 moderate, 24 high, 1 critical. The single critical finding (`tar` <=7.5.18, via `apps/backend`'s `bcrypt` → `@mapbox/node-pre-gyp` → `tar`, GHSA-23hp-3jrh-7fpw) is in `bcrypt`'s native-binary build tooling, not a runtime code path. None of these were introduced by this RC's changes; the vast majority are in transitive dependencies of the 84 packages outside this RC's scope. The new `.github/workflows/ci.yml` audit step surfaces these in every CI run as **informational, non-blocking** output (`pnpm audit || true`) rather than gating the build — gating on pre-existing, out-of-scope debt would make CI red for reasons unrelated to whatever change triggered the run. Triaging and patching this backlog is recommended for v1.1.

## Deployment Path

`apps/backend` and `apps/erp-web` are not yet wired into the platform's Helm chart (`deployment/helm/lateen-os/`) or Kubernetes manifests (`deployment/kubernetes/base/`) — both of which assume the platform's original 12 services / 13 apps. Docker Compose (`deployment/docker/docker-compose.apps.yml`) is the only validated deployment path for these two apps in this RC.

## Carried Forward from rc.1

- Payment gateway (Cloud Control Plane): stub only.
- AI execution: contract/stub in design-time apps (AI Studio, Automation Studio).
- Architecture v1.0 is locked per `release/FREEZE.md`; nothing in this RC changes that.
