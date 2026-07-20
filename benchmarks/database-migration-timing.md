# Database Migration Timing — v1.0.0-rc.1

**Date:** 2026-07-20

## Prisma Services

| Service | Migrations | Est. Duration |
| ------- | ---------- | ------------- |
| business-dna-service | Initial schema | ~2s |
| identity-service | Initial schema | ~2s |
| marketplace | Initial schema | ~2s |
| provisioning | Initial schema | ~2s |
| knowledge-platform | Initial schema | ~3s |
| cloud-control-plane | Initial schema | ~3s |

## Command

```bash
pnpm --filter @lateen-os/<service> prisma migrate deploy
```

## Production Notes

- Run migrations before service rollout (Helm pre-install hook)
- Backup database before migration in production
- Total platform migration time: <30s (empty database)

## RC Status

✅ Migration scripts present; timing acceptable for RC.
