# Operations Guide — Lateen OS Enterprise v1.0.0-rc.1

## Daily Operations

- Monitor Grafana dashboards for service health
- Review structured logs (Pino JSON format)
- Check BullMQ queue depths on Redis
- Verify backup completion

## Service Management

| Action | Command |
| ------ | ------- |
| Health check all | `infrastructure/docker/scripts/health-check.sh` |
| Restart service | `kubectl rollout restart deployment/<service>` |
| View logs | `kubectl logs -f deployment/<service>` |
| Scale service | `kubectl scale deployment/<service> --replicas=N` |

## Incident Response

See `deployment/docs/INCIDENT-RESPONSE.md` and runbooks:

- `deployment/docs/runbooks/SERVICE-DOWN.md`
- `deployment/docs/runbooks/HIGH-ERROR-RATE.md`
- `deployment/docs/runbooks/DATABASE-ISSUES.md`

## Backup & DR

See `deployment/docs/BACKUP-DR.md` and `quality/reliability-report.md`.

## Performance Monitoring

See `benchmarks/performance-report.md` for baseline metrics.

## Reference

- Full operations: `deployment/docs/OPERATIONS-GUIDE.md`
- Health checks: `quality/health-checks.md`
