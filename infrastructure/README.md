# Lateen OS — Platform Infrastructure

Local development infrastructure for Lateen OS (Architecture v1.0 Locked).

Transforms the architecture into a **runnable platform** using Docker Compose.

## Quick start

```powershell
# Windows (PowerShell)
.\infrastructure\scripts\validate.ps1
.\infrastructure\scripts\start.ps1
.\infrastructure\scripts\health.ps1
```

```bash
# macOS / Linux / Git Bash
./infrastructure/scripts/validate.sh
./infrastructure/scripts/start.sh
./infrastructure/scripts/health.sh
```

## Structure

```
infrastructure/
├── docker/
│   ├── docker-compose.yml      # 9 platform services
│   ├── prometheus/
│   ├── otel/
│   └── grafana/
├── environments/
│   ├── .env.example
│   ├── .env.development
│   └── .env.local
├── scripts/
│   ├── start | stop | restart
│   ├── logs | health | reset
│   ├── backup | restore
│   └── validate
└── backups/                    # Created by backup scripts
```

## Services

| Service | Purpose |
| ------- | ------- |
| PostgreSQL | Primary database |
| Redis | Cache & sessions |
| NATS | Messaging & event bus |
| MinIO | Object storage (S3-compatible) |
| Qdrant | Vector search |
| Grafana | Dashboards |
| Prometheus | Metrics |
| OpenTelemetry Collector | Traces & metrics pipeline |
| PgAdmin | Database administration UI |

## Documentation

See [docs/infrastructure/](../docs/infrastructure/README.md) for full guides.

## Environment

Default: `infrastructure/environments/.env.development`

Override with:

```powershell
$env:LATEEN_ENV_FILE = "infrastructure/environments/.env.local"
.\infrastructure\scripts\start.ps1
```

## Requirements

- Docker Desktop 4.x+ or Docker Engine 24+
- Docker Compose v2
- 8 GB+ RAM recommended
