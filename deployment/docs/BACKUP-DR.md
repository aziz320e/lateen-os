# Backup & Disaster Recovery

## Automated Backups

Helm CronJob `lateen-os-postgres-backup` runs daily at 02:00 UTC:

- Dumps all databases: `lateen_os`, `lateen_identity`, `lateen_integration`, `lateen_mission_scheduler`
- Format: PostgreSQL custom (`-Fc`)
- Retention: configurable via `backups.retentionDays` (default 14 dev, 30 prod)
- Storage: PVC `lateen-os-backup`

## MinIO Object Storage

MinIO data is persisted on StatefulSet PVC. For production:

1. Enable bucket versioning
2. Configure cross-region replication or S3-compatible backup target
3. Snapshot PVCs via cloud provider volume snapshots

## Restore — PostgreSQL

```bash
# Copy dump from backup PVC
kubectl cp lateen-os/$(kubectl get pod -l lateen.io/component=backup -o name | head -1 | cut -d/ -f2):/backup/lateen_os-TIMESTAMP.dump ./restore.dump

# Restore
kubectl exec -it postgres-0 -n lateen-os -- pg_restore -U lateen -d lateen_os -c /tmp/restore.dump
```

## Restore — Full Platform

1. Provision cluster via Terraform (`deployment/terraform/`)
2. Restore secrets from Vault
3. Deploy Helm chart with `backups.enabled: false` initially
4. Restore PostgreSQL dumps
5. Restore MinIO PVC snapshot
6. Verify health endpoints
7. Re-enable backup CronJob

## RTO / RPO Targets

| Tier | RPO | RTO |
| ---- | --- | --- |
| Production | 24h (daily backup) | 4h |
| Staging | 24h | 8h |
| Development | Best effort | 24h |

## Local reference

See `infrastructure/scripts/backup.ps1` for local Docker Compose backup procedures.
