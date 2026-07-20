# Lateen OS — Operations Guide

## Daily Checks

1. `kubectl get pods -n lateen-os` — all pods Running/Ready
2. Grafana dashboard: Platform Overview (`deployment/monitoring/dashboards/platform-overview.json`)
3. Prometheus alerts — no firing critical alerts
4. Backup CronJob — last run succeeded

## Health Endpoints

| Service | Endpoint |
| ------- | -------- |
| All backends | `GET /health` |
| Frontends | `GET /` |
| PostgreSQL | `pg_isready` (probe) |
| Redis | TCP 6379 |
| NATS | `GET /healthz:8222` |
| MinIO | `/minio/health/live` |
| Qdrant | `/healthz` |
| Grafana | `/api/health` |

## Logs

Structured JSON logs with correlation ID header `x-correlation-id`.

```bash
kubectl logs -n lateen-os -l lateen.io/tier=backend --tail=100
kubectl logs -n lateen-os deploy/identity-service -f
```

## Metrics & Tracing

- Prometheus: `http://prometheus:9090` (cluster-internal) or `/prometheus` via ingress
- Grafana: `/grafana` via ingress
- OTLP endpoint: `http://otel-collector:4318`

## Rolling Updates

Helm performs rolling updates by default. Monitor rollout:

```bash
kubectl rollout status deployment/identity-service -n lateen-os
```

## Rollback

```bash
helm rollback lateen-os -n lateen-os
# or
kubectl rollout undo deployment/<service> -n lateen-os
```

## Database Operations

Connect to PostgreSQL:

```bash
kubectl exec -it postgres-0 -n lateen-os -- psql -U lateen -d lateen_os
```

## Backup Verification

```bash
kubectl get cronjobs -n lateen-os
kubectl get jobs -n lateen-os -l lateen.io/component=backup
```

See [BACKUP-DR.md](./BACKUP-DR.md) for restore procedures.

## On-Call Runbooks

- [Service Down](./runbooks/SERVICE-DOWN.md)
- [High Error Rate](./runbooks/HIGH-ERROR-RATE.md)
- [Database Issues](./runbooks/DATABASE-ISSUES.md)
- [Incident Response](./INCIDENT-RESPONSE.md)
