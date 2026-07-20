# Backup Validation — v1.0.0-rc.1

## Backup Targets

| Component | Method | Frequency |
| --------- | ------ | --------- |
| PostgreSQL | pg_dump / WAL | Daily |
| Redis | RDB snapshot | Hourly |
| MinIO | Bucket replication | Daily |
| Qdrant | Snapshot API | Daily |

## Cloud Control Plane

Backup entity model in `services/cloud-control-plane` — contract for backup scheduling.

## Validation

- [x] Backup scripts documented in `deployment/docs/operations-guide.md`
- [x] Cloud control plane backup API contract defined
- [ ] Automated backup test (deferred to GA)

## RC Status

✅ Pass — backup procedures documented; automation deferred to GA.
