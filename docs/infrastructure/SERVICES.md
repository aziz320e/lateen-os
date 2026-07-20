# Platform Services

> Catalog of Lateen OS local infrastructure services

## Overview

| Service | Image | Container | Default Port |
| ------- | ----- | ----------- | -------------- |
| PostgreSQL | `postgres:16-alpine` | `lateen-postgres` | 5432 |
| Redis | `redis:7-alpine` | `lateen-redis` | 6379 |
| NATS | `nats:2.10-alpine` | `lateen-nats` | 4222, 8222 |
| MinIO | `minio/minio` | `lateen-minio` | 9000, 9001 |
| Qdrant | `qdrant/qdrant:v1.12.5` | `lateen-qdrant` | 6333, 6334 |
| Prometheus | `prom/prometheus:v2.55.1` | `lateen-prometheus` | 9090 |
| OpenTelemetry Collector | `otel/opentelemetry-collector-contrib` | `lateen-otel-collector` | 4317, 4318, 8888, 13133 |
| Grafana | `grafana/grafana:11.4.0` | `lateen-grafana` | 3000 |
| PgAdmin | `dpage/pgadmin4:8.14` | `lateen-pgadmin` | 5050 |

---

## PostgreSQL

**Role:** Primary relational database for Lateen OS application data.

| Setting | Env variable | Default |
| ------- | ------------ | ------- |
| User | `LATEEN_POSTGRES_USER` | `lateen` |
| Password | `LATEEN_POSTGRES_PASSWORD` | `lateen_dev_postgres` |
| Database | `LATEEN_POSTGRES_DB` | `lateen_os` |
| Connection URL | `LATEEN_DATABASE_URL` | See `.env.development` |

**Volume:** `lateen-postgres-data`

**Health check:** `pg_isready`

---

## Redis

**Role:** Cache, session store, pub/sub backing.

| Setting | Env variable |
| ------- | ------------ |
| Password | `LATEEN_REDIS_PASSWORD` |
| URL | `LATEEN_REDIS_URL` |

**Volume:** `lateen-redis-data` (AOF enabled)

**Health check:** `redis-cli ping`

---

## NATS

**Role:** Messaging backbone and JetStream event bus.

| Setting | Env variable |
| ------- | ------------ |
| Client port | `LATEEN_NATS_HOST_CLIENT_PORT` (4222) |
| Monitoring | `LATEEN_NATS_HOST_MONITORING_PORT` (8222) |
| URL | `LATEEN_NATS_URL` |

**Volume:** `lateen-nats-data` (JetStream storage)

**Health check:** `GET /healthz` on monitoring port

---

## MinIO

**Role:** S3-compatible object storage for files, exports, and assets.

| Setting | Env variable |
| ------- | ------------ |
| Root user | `LATEEN_MINIO_ROOT_USER` |
| Root password | `LATEEN_MINIO_ROOT_PASSWORD` |
| API port | `LATEEN_MINIO_HOST_API_PORT` (9000) |
| Console port | `LATEEN_MINIO_HOST_CONSOLE_PORT` (9001) |
| Default bucket | `LATEEN_MINIO_BUCKET` |

**Volume:** `lateen-minio-data`

**Health check:** `GET /minio/health/live`

---

## Qdrant

**Role:** Vector database for semantic search and embeddings.

| Setting | Env variable |
| ------- | ------------ |
| HTTP port | `LATEEN_QDRANT_HOST_HTTP_PORT` (6333) |
| gRPC port | `LATEEN_QDRANT_HOST_GRPC_PORT` (6334) |
| URL | `LATEEN_QDRANT_URL` |
| Collection | `LATEEN_QDRANT_COLLECTION` |

**Volume:** `lateen-qdrant-data`

**Health check:** `GET /healthz`

---

## Prometheus

**Role:** Metrics collection and storage.

| Setting | Env variable |
| ------- | ------------ |
| Port | `LATEEN_PROMETHEUS_HOST_PORT` (9090) |
| Retention | `LATEEN_PROMETHEUS_RETENTION` (15d) |

**Volume:** `lateen-prometheus-data`

**Scrape targets:** Prometheus self, OTel Collector metrics

---

## OpenTelemetry Collector

**Role:** Telemetry pipeline — receives OTLP traces/metrics/logs, exports to Prometheus.

| Setting | Env variable |
| ------- | ------------ |
| OTLP gRPC | `LATEEN_OTEL_HOST_GRPC_PORT` (4317) |
| OTLP HTTP | `LATEEN_OTEL_HOST_HTTP_PORT` (4318) |
| Health | `LATEEN_OTEL_HEALTH_PORT` (13133) |
| Metrics | `LATEEN_OTEL_METRICS_PORT` (8888) |

**Config:** `infrastructure/docker/otel/otel-collector.yaml`

---

## Grafana

**Role:** Observability dashboards.

| Setting | Env variable |
| ------- | ------------ |
| Admin user | `LATEEN_GRAFANA_ADMIN_USER` |
| Admin password | `LATEEN_GRAFANA_ADMIN_PASSWORD` |
| Port | `LATEEN_GRAFANA_HOST_PORT` (3000) |

**Volume:** `lateen-grafana-data`

**Provisioning:** Prometheus datasource auto-configured

---

## PgAdmin

**Role:** PostgreSQL administration UI.

| Setting | Env variable |
| ------- | ------------ |
| Email | `LATEEN_PGADMIN_EMAIL` |
| Password | `LATEEN_PGADMIN_PASSWORD` |
| Port | `LATEEN_PGADMIN_HOST_PORT` (5050) |

**Volume:** `lateen-pgadmin-data`

**Depends on:** PostgreSQL (healthy)

---

## Resource limits

All services have CPU and memory limits configured via environment variables:

```
LATEEN_<SERVICE>_CPU
LATEEN_<SERVICE>_MEM
```

See `infrastructure/environments/.env.development` for defaults.

## Restart policy

All services: `restart: unless-stopped`

## Labels

Each service is labeled:

```yaml
lateen.service: <name>
lateen.layer: infrastructure | observability
```
