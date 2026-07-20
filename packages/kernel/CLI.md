# Lateen Kernel — CLI Reference

Install and build the kernel package, then use the `lateen` command.

```bash
pnpm --filter @lateen-os/kernel build
pnpm exec lateen --help
```

## Global options

| Option | Description |
| ------ | ----------- |
| `-V, --version` | Show kernel version |
| `-h, --help` | Show command help |

## Commands

### `lateen start`

Bootstrap the kernel and start platform components.

```bash
lateen start                  # infra + all backend services
lateen start --apps           # also start frontends
lateen start --infra-only     # Docker Compose infrastructure only
lateen start --services-only  # services only (skip docker)
```

### `lateen stop`

Gracefully stop managed service processes and Docker Compose infrastructure.

```bash
lateen stop
```

### `lateen restart`

Stop and restart the full platform.

```bash
lateen restart
```

### `lateen status`

Show environment, managed processes, and health report.

```bash
lateen status
lateen status --json
```

### `lateen doctor`

Run startup diagnostics: environment, ports, dependency graph, plugin paths.

```bash
lateen doctor
lateen doctor --json
```

Exit code `1` when errors are found.

### `lateen logs`

Delegate to `infrastructure/scripts/logs.ps1` or `logs.sh`.

```bash
lateen logs
```

### `lateen backup` / `lateen restore`

Delegate to infrastructure backup/restore scripts.

```bash
lateen backup
lateen restore
```

### `lateen update`

Run `pnpm install` at workspace root.

```bash
lateen update
```

### `lateen recover`

Crash recovery: stop orphaned processes, restart infrastructure and services.

```bash
lateen recover
```

### `lateen version`

Print kernel and platform manifest versions.

```bash
lateen version
```

### `lateen plugins list`

List plugin registry entries.

```bash
lateen plugins list
```

### `lateen services list`

List backend services with ports and packages.

```bash
lateen services list
```

### `lateen apps list`

List frontend applications.

```bash
lateen apps list
```

### `lateen config`

Show resolved kernel configuration.

```bash
lateen config
lateen config --json
```

## Environment variables

| Variable | Description |
| -------- | ----------- |
| `LATEEN_ENV` | Environment name (development/staging/production) |
| `LATEEN_ENV_FILE` | Override env file path |
| `LATEEN_LOG_LEVEL` | Pino log level |
| `LATEEN_TELEMETRY_ENABLED` | Enable/disable OTel (`true`/`false`) |
| `LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP HTTP endpoint |
| `LATEEN_STATE_DIR` | Process state directory (default `.lateen`) |
| `LATEEN_GRACEFUL_SHUTDOWN_MS` | Shutdown timeout |
| `LATEEN_HEALTH_CHECK_TIMEOUT_MS` | Health probe timeout |

## Root workspace usage

Add to root `package.json` (optional):

```json
"scripts": {
  "lateen": "pnpm --filter @lateen-os/kernel exec lateen"
}
```

Then: `pnpm lateen doctor`
