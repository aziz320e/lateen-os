# Lateen OS — Infrastructure Documentation

Platform infrastructure guides for local development and operations.

Aligned with **Lateen OS Architecture v1.0 (Locked)** — Epic 2: Platform Infrastructure.

## Guides

| Document | Description |
| -------- | ----------- |
| [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) | Setup, start, and daily workflow |
| [SERVICES.md](./SERVICES.md) | Service catalog, ports, and configuration |
| [NETWORK.md](./NETWORK.md) | Docker network topology |
| [BACKUP.md](./BACKUP.md) | Backup and restore procedures |

## Quick reference

```powershell
.\infrastructure\scripts\validate.ps1   # Validate config
.\infrastructure\scripts\start.ps1      # Start all services
.\infrastructure\scripts\health.ps1     # Health checks
.\infrastructure\scripts\stop.ps1       # Stop all services
```

## Architecture context

Infrastructure (Layer 7) hosts platform services that application layers consume:

```
Applications / Services
        │
        ▼
┌───────────────────────────────────┐
│  Platform Infrastructure        │
│  PostgreSQL · Redis · NATS      │
│  MinIO · Qdrant                   │
│  Grafana · Prometheus · OTel      │
└───────────────────────────────────┘
```

Domain packages (`business-dna`, `shared-kernel`, `ai-runtime`, etc.) are **not modified** by infrastructure — they connect via environment variables defined in `infrastructure/environments/`.

## Related

- [Lateen OS Architecture v1.0](../architecture/lateen-os-v1.md)
- [Infrastructure README](../../infrastructure/README.md)
- [PROJECT_BOARD.md](../../PROJECT_BOARD.md)
