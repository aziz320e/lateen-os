# Cloud Operations

## Monitoring Components

- Tenant Health
- Infrastructure
- Applications
- Services
- Workers
- Connectors
- Storage
- Backups

## Backups

| Type | Description |
| ---- | ----------- |
| manual | On-demand backup |
| scheduled | Cron-based backup |
| snapshot | Point-in-time snapshot |

Operations: Manual · Scheduled · Restore · Snapshot · Verification

## Support

Support tickets with priority levels: low · normal · high · urgent

## Audit

Audit log records track organization actions (Prisma schema contract).

## Queue Jobs

BullMQ queue `cloud-jobs` for async provisioning, deployment, and backup operations.
