# Migration Guide — Lateen OS Enterprise v1.0.0-rc.1

## Overview

This guide covers migration to Lateen OS Enterprise v1.0.0-rc.1 from prior development snapshots.

## Pre-Migration Checklist

- [ ] Backup all databases
- [ ] Export tenant configurations
- [ ] Document custom extension manifests
- [ ] Review frozen surfaces (`release/FREEZE.md`)

## Database Migration

```bash
# Run for each Prisma service
pnpm --filter @lateen-os/business-dna-service prisma migrate deploy
pnpm --filter @lateen-os/identity-service prisma migrate deploy
pnpm --filter @lateen-os/marketplace-service prisma migrate deploy
pnpm --filter @lateen-os/provisioning-service prisma migrate deploy
pnpm --filter @lateen-os/knowledge-platform-service prisma migrate deploy
pnpm --filter @lateen-os/cloud-control-plane-service prisma migrate deploy
```

Estimated total time: <30s on empty database. See `benchmarks/database-migration-timing.md`.

## Configuration Migration

1. Update environment variables per `security/environment-validation.md`
2. Update service ports if using custom configuration (4001–4012)
3. Update app ports if using custom configuration (3000–3012)

## Extension Migration

Extension manifest schema v1 is frozen. Existing manifests compatible without changes.

## Validation

```bash
node release/scripts/validate.mjs
```

## Rollback

1. Restore database from backup
2. Redeploy previous container images
3. Revert environment configuration

## Support

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues.
