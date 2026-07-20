# Runbook — Database Issues

## Symptoms

- Backend pods CrashLoop with DB connection errors
- Slow queries / timeouts
- Backup job failures

## Diagnosis

```bash
kubectl get pods -n lateen-os -l lateen.io/component=postgres
kubectl logs postgres-0 -n lateen-os --tail=100
kubectl exec -it postgres-0 -n lateen-os -- pg_isready -U lateen
```

## Disk Full

```bash
kubectl exec -it postgres-0 -n lateen-os -- df -h
# Expand PVC via cloud provider or clean old data
```

## Connection Refused

1. Verify postgres pod is Running
2. Check secret `LATEEN_POSTGRES_PASSWORD` matches postgres env
3. Verify service DNS: `kubectl get svc postgres -n lateen-os`

## Restore from Backup

See [BACKUP-DR.md](../BACKUP-DR.md).

## Performance

- Check active connections: `SELECT count(*) FROM pg_stat_activity;`
- Review slow queries in postgres logs
- Consider increasing `postgresql.storage` and node resources in prod values
