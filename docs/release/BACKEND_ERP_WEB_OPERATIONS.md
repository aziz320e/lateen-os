# Operations Guide — apps/backend + apps/erp-web (v1.0.0 RC)

Scoped operations guide for the two applications delivered in this release: the **Platform Backend Host** (`apps/backend`, NestJS + Fastify REST API over the engine layer) and **ERP Web** (`apps/erp-web`, Next.js). It covers what's specific to these two apps and their Docker Compose deployment path — it does not replace the platform-wide guides below, which remain authoritative for the other 84 packages and the Helm/Kubernetes deployment path.

**Cross-references (do not duplicate here):**

- Platform-wide operations: `docs/release/OPERATIONS_GUIDE.md`, `deployment/docs/OPERATIONS-GUIDE.md`
- Incident response process and severity levels: `deployment/docs/INCIDENT-RESPONSE.md`, runbooks in `deployment/docs/runbooks/`
- Backup/DR process and retention policy: `deployment/docs/BACKUP-DR.md`
- Deployment guide (Helm/Kubernetes path): `docs/release/DEPLOYMENT_GUIDE.md`
- Performance baselines: `benchmarks/` (this release's numbers were appended to `build-benchmark.md`, `startup-benchmark.md`, `api-latency-benchmark.md`, `memory-benchmark.md`, `bundle-size-report.md`)
- Security posture: `security/` (see `release/KNOWN_LIMITATIONS.md` for what's specific to these two apps)

## 1. Deployment

Neither app is yet wired into the platform's Helm chart (`deployment/helm/lateen-os/`) or Kubernetes manifests (`deployment/kubernetes/base/`) — that integration is out of scope for this release (see Known Limitations). The supported deployment path today is Docker Compose:

```bash
# Requires JWT_ACCESS_SECRET / JWT_REFRESH_SECRET in the environment —
# the backend refuses to start with dev-default secrets when NODE_ENV=production.
export JWT_ACCESS_SECRET=$(openssl rand -hex 32)
export JWT_REFRESH_SECRET=$(openssl rand -hex 32)
docker compose -f deployment/docker/docker-compose.apps.yml up --build
```

This brings up `postgres` (16-alpine), `backend` (port 4013), and `erp-web` (port 3013), reusing the platform's existing `deployment/docker/Dockerfile.backend` / `Dockerfile.frontend` multi-stage images — no new Dockerfiles were introduced. Both images are registered in `deployment/docker/images.json` alongside the platform's other 25 images.

For local development without Docker, see each app's own `pnpm dev` script and `apps/backend/.env.example`.

## 2. Health, Readiness, and Liveness

Both apps reuse existing endpoints — no new health-check routes were added:

| App            | Liveness                                    | Readiness                                                                                                 |
| -------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `apps/backend` | `GET /version` — fast, no dependency checks | `GET /health` — aggregates all 27 hosted engine runtimes, database connectivity, and observability status |
| `apps/erp-web` | `GET /`                                     | `GET /` (Next.js has no separate readiness signal; the homepage requires the same runtime to be up)       |

The `Dockerfile.backend`/`Dockerfile.frontend` `HEALTHCHECK` directives and the compose file's `healthcheck:` blocks both point at these same endpoints, so container orchestration, this compose file, and manual `curl` checks all agree.

## 3. Logs

Both apps log structured JSON to stdout (backend via `nestjs-pino`/`pino-http`; erp-web via Next.js's own request logging), consistent with the platform-wide convention documented in `deployment/docs/OPERATIONS-GUIDE.md`. Under Docker Compose: `docker compose -f deployment/docker/docker-compose.apps.yml logs -f backend` / `... logs -f erp-web`.

## 4. Backup & Restore (Postgres)

The backend's database (`lateen_os_backend`, see `apps/backend/.env.example`) is a standard Prisma-managed Postgres schema — the platform-wide backup mechanism in `deployment/docs/BACKUP-DR.md` (pg_dump-based) applies unchanged once this database is added to that CronJob's target list. Until then, for the Docker Compose path:

```bash
# Backup
docker compose -f deployment/docker/docker-compose.apps.yml exec postgres \
  pg_dump -U lateen -Fc lateen_os_backend > lateen_os_backend.dump

# Restore
docker compose -f deployment/docker/docker-compose.apps.yml exec -T postgres \
  pg_restore -U lateen -d lateen_os_backend -c < lateen_os_backend.dump
```

`apps/backend`'s `MigrationRunnerService` and `DatabaseBootstrapService` are already designed to run in a degraded, non-fatal state when Postgres is unreachable at startup (verified in this session's test suite — `tests/database.test.ts`), so a restore in progress does not crash the host; API routes touching the database will report their real degraded state until the restore completes.

## 5. Incident Response

Follow the platform-wide process in `deployment/docs/INCIDENT-RESPONSE.md` (severity levels, roles, communication template). App-specific triage starting points:

- **Backend down / failing health checks**: check `GET /health` for which of the 27 engine runtimes or the database connection is reporting unhealthy; check container logs for the `MigrationRunnerService`/`PrismaService` warnings described above.
- **erp-web returning errors**: check that `API_BASE_URL` (set to `http://backend:4013` in the compose file) resolves and the backend is healthy — erp-web has no independent data store and fails closed when the backend is unreachable.
- **Auth failures**: verify `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` are set consistently across restarts (rotating them invalidates all existing sessions) and that `COOKIE_SECURE=true` matches the deployment's TLS termination point.

## 6. Disaster Recovery

Both apps are stateless (all state lives in Postgres). Recovery is: restore the Postgres backup per §4, then redeploy both containers from their existing images — no app-specific DR steps beyond the platform-wide process in `deployment/docs/BACKUP-DR.md`.

## 7. Production Checklist

- [ ] `NODE_ENV=production`
- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` set to distinct, high-entropy values (not the dev defaults — the backend fails fast at startup if they are, see `apps/backend/src/config/index.ts`)
- [ ] `CORS_ORIGIN` set to the real erp-web origin (not `*`)
- [ ] `COOKIE_SECURE=true` (requires TLS termination in front of the backend)
- [ ] `DATABASE_URL` points at a reachable, backed-up Postgres instance
- [ ] Container healthchecks (`/health`, `/`) wired into the orchestrator's readiness gate
- [ ] Logs shipped to the platform's existing log aggregation (see `deployment/docs/OPERATIONS-GUIDE.md`)
- [ ] `pnpm audit` findings triaged (see `release/KNOWN_LIMITATIONS.md` — several pre-existing transitive vulnerabilities are tracked there, none introduced by these two apps' own direct dependencies)
