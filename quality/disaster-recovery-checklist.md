# Disaster Recovery Checklist — v1.0.0-rc.1

## RPO/RTO Targets

| Tier | RPO | RTO |
| ---- | --- | --- |
| Critical (Identity, Business DNA) | 1 hour | 2 hours |
| Standard (Analytics, Search) | 4 hours | 4 hours |
| Non-critical (Marketplace cache) | 24 hours | 8 hours |

## DR Checklist

- [x] Multi-AZ deployment documented (Terraform)
- [x] Database backup strategy defined
- [x] Service restart procedures documented
- [x] Failover DNS documented
- [ ] DR drill executed (deferred to GA)

## RC Status

✅ Pass — checklist complete; drill deferred.
