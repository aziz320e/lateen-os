# @lateen-os/kernel — Lateen Kernel

The **operating layer** of Lateen OS. Manages platform bootstrap, configuration, service lifecycle, health monitoring, plugin loading, and graceful shutdown.

Does **not** execute business logic. Does **not** replace Kubernetes — it manages the Lateen platform on a single machine or dev environment.

## Technology

- TypeScript / Node.js 20+
- Commander (CLI)
- Zod (configuration validation)
- Pino (structured logging)
- OpenTelemetry (kernel telemetry)

## CLI

```bash
pnpm --filter @lateen-os/kernel build
pnpm exec lateen --help
```

| Command | Description |
| ------- | ----------- |
| `lateen start` | Bootstrap + start infrastructure and services |
| `lateen stop` | Graceful shutdown |
| `lateen restart` | Restart platform |
| `lateen status` | Process list + health report |
| `lateen doctor` | Diagnostics (ports, config, dependencies) |
| `lateen logs` | Infrastructure logs (delegates to scripts) |
| `lateen backup` | Platform backup |
| `lateen restore` | Restore from backup |
| `lateen update` | `pnpm install` for workspace |
| `lateen version` | Kernel + manifest version |
| `lateen recover` | Crash recovery |
| `lateen plugins list` | Plugin registry |
| `lateen services list` | Backend service registry |
| `lateen apps list` | Application registry |
| `lateen config` | Resolved kernel configuration |

## Modules

| Module | Responsibility |
| ------ | -------------- |
| `bootstrap` | Platform bootstrap, logging, telemetry |
| `configuration` | Zod config schema + env file loading |
| `lifecycle` | Start/stop/restart, process manager, graceful shutdown |
| `dependency` | Dependency graph + startup order |
| `registry` | Services, applications, plugins |
| `plugins` | Plugin loading |
| `health` | Liveness, readiness, dependency probes |
| `monitor` | Periodic health monitoring |
| `diagnostics` | Doctor — port conflicts, config errors |
| `environment` | Environment validation |
| `workspace` | Monorepo root resolution |
| `events` | Kernel event bus |
| `cli` | Commander CLI |

## Service registry

| Service | Port |
| ------- | ---- |
| Business DNA | 4001 |
| Product Discovery | 4002 |
| Identity | 4003 |
| Integration Hub | 4004 |
| Mission Scheduler | 4005 |

Applications: AI Product Manager (3000), Business DNA Studio (3001), CEO Cockpit (3002), Customer Portal (3003), Lateen Assistant (3004).

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CLI.md](./CLI.md)
- [BOOTSTRAP.md](./BOOTSTRAP.md)

## Build & test

```bash
pnpm --filter @lateen-os/kernel build
pnpm --filter @lateen-os/kernel test
pnpm --filter @lateen-os/kernel typecheck
```
