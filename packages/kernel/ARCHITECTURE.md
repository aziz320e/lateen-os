# Lateen Kernel — Architecture

Architecture v1.0 (locked). Platform operating layer — no business logic.

## Position in Lateen OS

```
┌─────────────────────────────────────────────┐
│  lateen CLI (@lateen-os/kernel)             │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│  Bootstrap → Config → Registry → Lifecycle  │
│  Health → Diagnostics → Monitor → Events    │
└────────────┬───────────────┬────────────────┘
             │               │
    ┌────────▼────────┐  ┌───▼──────────────┐
    │ Docker Compose  │  │ pnpm dev processes│
    │ (infrastructure)│  │ (services + apps) │
    └─────────────────┘  └──────────────────┘
```

Kubernetes (Epic 18) handles **production cluster** deployment. The Kernel handles **local/platform lifecycle** on a developer or operator machine.

## Bootstrap sequence

1. Resolve workspace root (`pnpm-workspace.yaml`)
2. Load kernel config (Zod + env file)
3. Initialize Pino logger + OpenTelemetry
4. Validate environment variables
5. Build dependency graph → startup order
6. Load enabled plugins
7. Emit `kernel.bootstrapped`

See [BOOTSTRAP.md](./BOOTSTRAP.md) for details.

## Registry model

### Service registry

Backend services with ports, packages, health paths, and dependency edges.

### Application registry

Next.js frontends with ports and package names.

### Plugin registry

Platform extension categories:

- Applications, Services, Packages
- AI Workers, Connectors, Workflows, Missions

Plugins are **path references** — the kernel verifies paths exist; it does not load business code dynamically.

## Lifecycle

| Phase | Handler |
| ----- | ------- |
| Start infra | `docker compose up -d` in `infrastructure/docker` |
| Start services | `pnpm --filter <package> dev` in dependency order |
| Stop | SIGTERM to managed PIDs + `docker compose down` |
| Recovery | Stop orphaned processes → restart infra → restart services |

Process state persisted in `.lateen/processes.json`.

## Health model

| Probe | Target |
| ----- | ------ |
| Liveness | Backend `/health` endpoints |
| Readiness | Frontend `/` responses |
| Dependency | OTel collector, NATS monitoring |

## Diagnostics (`lateen doctor`)

| Check | Code |
| ----- | ---- |
| Missing env vars | `MISSING_ENV` |
| Invalid env format | `INVALID_ENV` |
| Port conflicts in manifest | `PORT_CONFLICT` |
| Port already in use | `PORT_IN_USE` |
| Dependency cycle | `DEPENDENCY_CYCLE` |
| Missing plugin path | `PLUGIN_PATH_MISSING` |
| Placeholder DB credentials | `DATABASE_CONFIG` |

## Events

Kernel emits lifecycle events via `KernelEventBus`:

- `kernel.bootstrapping`, `kernel.bootstrapped`
- `kernel.starting`, `kernel.started`
- `kernel.stopping`, `kernel.shutdown`
- `kernel.health.checked`, `kernel.diagnostics.completed`
- `kernel.recovery.started`, `kernel.recovery.completed`
- `kernel.plugin.loaded`

## Non-goals

- Business domain logic
- LLM inference
- Replacing Kubernetes or Helm
- Database migrations or ORM
