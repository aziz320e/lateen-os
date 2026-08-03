# Production Readiness Checklist — v1.0.0-rc.2

## Architecture

- [x] Architecture v1.0 locked (`release/FREEZE.md`)
- [x] Platform manifest complete (12 services, 13 apps)
- [x] No API breaking changes in RC

## Build & Test

- [x] Phased validation script (`release/scripts/validate.mjs`)
- [x] Full `pnpm build` via turbo — previously blocked by two cyclic dependencies (kernel/sdk/extension-system from rc.1, ai-brain/multi-agent found in rc.2), both now resolved (see `release/KNOWN_LIMITATIONS.md`)
- [x] Per-package build/typecheck/test via phased script (132/132 after kernel test fix)

## Security

- [x] Dependency audit documented (`security/dependency-audit.md`)
- [x] Secrets audit documented (`security/secrets-audit.md`)
- [x] OWASP checklist (`security/owasp-checklist.md`)
- [x] Tenant isolation validation (`security/tenant-isolation.md`)

  > Note: `security/*.md` above document the rc.1 `services/*` microservices topology (identity-service, api-gateway) and predate `apps/backend`. They were not updated for rc.2/rc.3, per `release/RC_REPORT_v1.0.0-rc.2.md`'s "Unchanged (pre-existing platform-wide audits)" note. `apps/backend`'s own security posture — including six findings found and fixed post-rc.2 (refresh-token tenant trust; Administration → Organizations routes had no authorization check; Inventory and Projects had zero authorization enforcement — verified live, a zero-permission token could create a warehouse and a project; RBAC guards wired for CRM/Finance/Inventory/Projects domain-wide plus Administration → Organizations only; the RBAC wiring itself had no regression test coverage until this pass; unauthenticated diagnostic endpoints; database-unavailable auth errors returned an undifferentiated 500 instead of 503) — is tracked in `release/CHANGELOG.md`'s `[Unreleased]` section, not in these files. 6 remaining `apps/backend` domains (Sales, HR, Customer Success, Documents, Analytics, Marketplace) and most of Administration remain authenticated-only (not RBAC-checked) — see `release/KNOWN_LIMITATIONS.md`'s "Authorization Coverage" section.

## Deployment

- [x] Docker images manifest (`deployment/docker/images.json`)
- [x] Helm chart (`deployment/helm/lateen-os/`)
- [x] Terraform (`deployment/terraform/`)
- [x] CI/CD workflows (`.github/workflows/`)

## Observability

- [x] OpenTelemetry on all services
- [x] Pino structured logging
- [x] Health endpoints on all backend services
- [x] Prometheus/Grafana dashboards

## Documentation

- [x] Administrator Guide
- [x] Developer Guide
- [x] SDK Guide
- [x] Deployment Guide
- [x] Operations Guide
- [x] Release Notes
- [x] Migration Guide

## Reliability

- [x] Health check inventory
- [x] Backup/DR checklist
- [x] Disaster recovery checklist
- [x] Failure recovery checklist

## Release Artifacts

- [x] CHANGELOG.md
- [x] RELEASE_NOTES.md
- [x] VERSION (1.0.0-rc.2)
- [x] SBOM.json
- [x] NOTICE
- [x] KNOWN_LIMITATIONS.md (new in rc.2)

## rc.2 — apps/backend + apps/erp-web

- [x] Security headers + rate limiting (`@fastify/helmet`, `@fastify/rate-limit`)
- [x] Fail-fast production config validation (JWT secrets, CORS, cookie security)
- [x] `.env.example` documenting all runtime config
- [x] Real ESLint (0 errors both apps; see `packages/eslint-config`)
- [x] Husky + lint-staged wired at repo root
- [x] Coverage reporting wired (`test:coverage`); exact stmt/line % unreliable in this sandbox — see `release/KNOWN_LIMITATIONS.md`
- [x] Docker Compose stack (`deployment/docker/docker-compose.apps.yml`); YAML-validated, not live-built (no Docker daemon in this sandbox)
- [x] CI extended: coverage, dependency/security audit, doc validation, artifact upload
- [x] Scoped operations guide (`docs/release/BACKEND_ERP_WEB_OPERATIONS.md`)
- [x] Measured (not estimated) build/startup/latency/memory/bundle-size benchmarks
- [x] Full `pnpm build`/`test`/`lint`/`typecheck` via root Turbo — previously blocked by the `ai-brain`↔`multi-agent` cycle (and rc.1's kernel/sdk/extension-system cycle); both are now resolved, see `release/KNOWN_LIMITATIONS.md`
- [x] Finance-engine decimal-precision rewrite (exact integer-cent arithmetic, replacing floating-point) and read-compute-save race fix (`createKeyMutex`) in Accounts Receivable/Payable, Inventory, and Projects — post-rc.2, see `release/CHANGELOG.md`'s `[Unreleased]` section
- [x] Inventory and Projects RBAC wired (60/60 and 70/70 routes) and covered by a dedicated 401/403/200 regression suite (`tests/rbac-regression.test.ts`) alongside CRM, Finance, and Administration → Organizations — post-rc.2, see `release/CHANGELOG.md`'s `[Unreleased]` section
- [x] `apps/backend/.env.example` and both Dockerfiles' `NODE_VERSION` brought back in sync with `docker-compose.apps.yml`/`docker-compose.yml` and `.nvmrc` respectively — post-rc.2, see `release/CHANGELOG.md`'s `[Unreleased]` section
- [ ] Not yet wired into Helm chart / Kubernetes manifests (Docker Compose only)

**RC Status:** Ready for stakeholder review with documented known issues.
