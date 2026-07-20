# Restore Validation — v1.0.0-rc.1

## Restore Procedures

| Component | Restore Method | RTO Target |
| --------- | -------------- | ---------- |
| PostgreSQL | pg_restore | <1 hour |
| Redis | RDB reload | <15 min |
| MinIO | Bucket restore | <1 hour |
| Qdrant | Snapshot restore | <30 min |

## Validation Checklist

- [x] Restore procedures documented
- [x] Database migration rollback documented
- [ ] Full restore drill (deferred to GA)

## RC Status

✅ Pass — procedures documented; drill scheduled for GA.
