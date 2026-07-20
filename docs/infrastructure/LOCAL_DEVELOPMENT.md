# Local Development Guide

> Epic 2 — Platform Infrastructure

## Prerequisites

1. **Docker Desktop** (Windows/macOS) or **Docker Engine + Compose** (Linux)
2. **8 GB RAM** minimum (16 GB recommended)
3. **Ports available:** 3000, 4222, 4317, 4318, 5050, 5432, 6333, 6379, 8222, 8888, 9000, 9001, 9090, 13133

Verify Docker:

```powershell
docker version
docker compose version
```

## First-time setup

### 1. Validate configuration

```powershell
cd C:\Projects\lateen-os
.\infrastructure\scripts\validate.ps1
```

This verifies:
- Docker is running
- All config files exist
- `docker compose config` passes

### 2. Choose environment file

| File | Use case |
| ---- | -------- |
| `.env.development` | Default shared dev settings (committed) |
| `.env.local` | Personal overrides (gitignored) |
| `.env.example` | Template with placeholder secrets |

Copy example if starting fresh:

```powershell
Copy-Item infrastructure\environments\.env.example infrastructure\environments\.env.local
```

### 3. Start the platform

```powershell
.\infrastructure\scripts\start.ps1
```

Or with a custom env file:

```powershell
$env:LATEEN_ENV_FILE = "infrastructure\environments\.env.local"
.\infrastructure\scripts\start.ps1
```

### 4. Verify health

```powershell
.\infrastructure\scripts\health.ps1
```

All nine services should report `[OK]`.

## Daily workflow

| Task | Command |
| ---- | ------- |
| Start | `.\infrastructure\scripts\start.ps1` |
| Stop | `.\infrastructure\scripts\stop.ps1` |
| Restart | `.\infrastructure\scripts\restart.ps1` |
| Logs (all) | `.\infrastructure\scripts\logs.ps1` |
| Logs (follow) | `.\infrastructure\scripts\logs.ps1 -Follow` |
| Logs (service) | `.\infrastructure\scripts\logs.ps1 -Service postgres` |
| Health | `.\infrastructure\scripts\health.ps1` |

## Service URLs (default ports)

| Service | URL |
| ------- | --- |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |
| PgAdmin | http://localhost:5050 |
| MinIO Console | http://localhost:9001 |
| Qdrant | http://localhost:6333 |
| OTel Health | http://localhost:13133 |
| NATS Monitoring | http://localhost:8222 |

Default credentials are in `infrastructure/environments/.env.development`.

## Connecting application services

Use environment variables from `.env.development`:

```env
LATEEN_DATABASE_URL=postgresql://lateen:lateen_dev_postgres@localhost:5432/lateen_os
LATEEN_REDIS_URL=redis://:lateen_dev_redis@localhost:6379/0
LATEEN_NATS_URL=nats://localhost:4222
LATEEN_MINIO_ENDPOINT=http://localhost:9000
LATEEN_QDRANT_URL=http://localhost:6333
LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Reset (destructive)

Removes all containers **and volumes**:

```powershell
.\infrastructure\scripts\reset.ps1
```

## Troubleshooting

### Port conflicts

Edit `infrastructure/environments/.env.local` and change `*_HOST_PORT` values.

### Service unhealthy

```powershell
.\infrastructure\scripts\logs.ps1 -Service <name>
docker inspect lateen-<name> --format='{{json .State.Health}}'
```

### Docker not running

Start Docker Desktop and re-run `validate.ps1`.

### WSL2 on Windows

Run scripts from PowerShell or WSL. Docker Desktop must expose the daemon to WSL if using bash scripts from WSL.

## Bash (Git Bash / macOS / Linux)

```bash
./infrastructure/scripts/validate.sh
./infrastructure/scripts/start.sh
./infrastructure/scripts/health.sh
```

Make scripts executable on Unix:

```bash
chmod +x infrastructure/scripts/*.sh
```
