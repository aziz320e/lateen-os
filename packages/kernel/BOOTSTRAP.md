# Lateen Kernel — Bootstrap

How the kernel initializes the Lateen OS platform.

## Entry points

| Entry | Path |
| ----- | ---- |
| CLI | `lateen start` → `bootstrapPlatform()` |
| Library | `import { bootstrapPlatform } from '@lateen-os/kernel'` |

## Bootstrap pipeline

```
1. resolveWorkspace()
      └─► Find pnpm-workspace.yaml + turbo.json

2. loadKernelConfig()
      └─► Zod parse: environment, paths, telemetry, timeouts
      └─► Read infrastructure/environments/.env.development

3. createKernelLogger()
      └─► Pino JSON logger (service: lateen-kernel)

4. initKernelTelemetry()
      └─► OpenTelemetry NodeSDK → OTLP HTTP exporter

5. validateEnvironment()
      └─► Required: LATEEN_DATABASE_URL, LATEEN_REDIS_URL, LATEEN_NATS_URL
      └─► Verify service paths exist

6. buildDependencyGraph()
      └─► Topological sort → startupOrder[]

7. loadPlugins()
      └─► Verify plugin paths, emit kernel.plugin.loaded

8. emit kernel.bootstrapped
```

## Dependency startup order

Services start in topological order based on `dependencies` and `infrastructureDependencies`:

```
business-dna-service
  → product-discovery
  → identity-service
  → integration-hub
  → mission-scheduler
```

Infrastructure (PostgreSQL, Redis, NATS, etc.) is started via Docker Compose **before** application services when using `lateen start`.

## Configuration sources

Priority (highest first):

1. Process environment variables
2. `LATEEN_ENV_FILE` pointed env file
3. `infrastructure/environments/.env.development`
4. Zod schema defaults

## Process management

After bootstrap, `LifecycleManager`:

1. Runs `docker compose up -d` (unless `--services-only`)
2. Spawns `pnpm --filter <package> dev` for each service in startup order
3. Tracks PIDs in `<workspace>/.lateen/processes.json`

## Graceful shutdown

On `lateen stop`:

1. Emit `kernel.stopping`
2. SIGTERM all managed PIDs
3. Wait (up to `gracefulShutdownMs`)
4. Shutdown OpenTelemetry SDK
5. `docker compose down`
6. Emit `kernel.shutdown`

## Crash recovery

`lateen recover`:

1. Emit `kernel.recovery.started`
2. Stop all tracked processes (clean stale PIDs)
3. Restart infrastructure
4. Restart backend services in dependency order
5. Emit `kernel.recovery.completed`

## Failure modes

| Failure | Behavior |
| ------- | -------- |
| Missing workspace root | Throw — cannot bootstrap |
| Invalid config (Zod) | Throw with validation details |
| Missing env vars | `doctor` reports errors; start may proceed with warnings |
| Docker unavailable | `start` fails on infra step |
| Port in use | `doctor` warns; service may fail to bind |

## Example — programmatic bootstrap

```typescript
import { bootstrapPlatform, createLifecycleManager } from '@lateen-os/kernel';

const ctx = await bootstrapPlatform();
const lifecycle = createLifecycleManager(ctx);

await lifecycle.startInfrastructure();
lifecycle.startServices();
```

## Relationship to Kubernetes

| Concern | Kernel (local) | Kubernetes (prod) |
| ------- | -------------- | ----------------- |
| Start/stop | `lateen start/stop` | Helm / kubectl |
| Health | HTTP probes via kernel | K8s probes |
| Config | `.env.development` | ConfigMaps / Secrets |
| Process mgmt | `.lateen/processes.json` | Deployments / StatefulSets |

Use the kernel for **development and operator workflows**. Use Kubernetes (Epic 18) for **production deployment**.
