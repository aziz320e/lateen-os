# Incident Response

## Severity Levels

| Level | Description | Response Time | Example |
| ----- | ----------- | ------------- | ------- |
| SEV-1 | Full platform outage | 15 min | All services down |
| SEV-2 | Major feature degraded | 30 min | Identity service down |
| SEV-3 | Minor degradation | 4h | Single frontend slow |
| SEV-4 | Low impact | Next business day | Monitoring gap |

## Response Process

1. **Detect** — Alert fires or user report
2. **Triage** — Assign incident commander, set severity
3. **Communicate** — Status page / internal channel update
4. **Mitigate** — Rollback, scale, failover (see runbooks)
5. **Resolve** — Confirm metrics green for 15 minutes
6. **Post-mortem** — Within 48h for SEV-1/SEV-2

## Roles

| Role | Responsibility |
| ---- | -------------- |
| Incident Commander | Coordinates response, communications |
| Technical Lead | Diagnosis and fix |
| Scribe | Timeline and action log |

## Communication Template

```
[SEV-X] Lateen OS Incident — <brief description>
Status: Investigating | Mitigating | Resolved
Impact: <user-facing impact>
Started: <UTC time>
Next update: <time>
```

## Quick Actions

```bash
# Rollback last deploy
helm rollback lateen-os -n lateen-os

# Scale critical service
kubectl scale deployment/identity-service --replicas=5 -n lateen-os

# Check all health
kubectl get pods -n lateen-os
```

## Post-Mortem Template

- Summary
- Timeline
- Root cause
- Impact (users, duration, SLO burn)
- Action items (prevent, detect, mitigate)
