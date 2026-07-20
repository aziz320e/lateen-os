# Environment Validation — v1.0.0-rc.1

## Required Infrastructure

| Service | Port | Health Check |
| ------- | ---- | ------------ |
| PostgreSQL | 5432 | `pg_isready` |
| Redis | 6379 | `redis-cli ping` |
| NATS | 4222 | HTTP monitoring |
| MinIO | 9000 | `/minio/health/live` |
| Qdrant | 6333 | `/healthz` |
| Prometheus | 9090 | `/-/healthy` |
| Grafana | 3000 | `/api/health` |
| OTEL Collector | 4318 | gRPC health |

## Backend Service Environment

All services require:

```
NODE_ENV=production
PORT=<service-port>
LOG_LEVEL=info
```

Prisma services additionally require:

```
DATABASE_URL=postgresql://...
```

Queue-enabled services require:

```
REDIS_URL=redis://...
```

## Validation Script

```bash
cd infrastructure/docker
docker compose up -d
./scripts/health-check.sh
```

## RC Status

✅ Environment templates validated against `deployment/docs/` and `infrastructure/docker/.env.example`.
