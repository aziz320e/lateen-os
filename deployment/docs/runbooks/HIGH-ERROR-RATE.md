# Runbook — High Error Rate

## Symptoms

- Alert: `LateenHighErrorRate`
- Elevated 5xx responses in Grafana
- User reports of failures

## Diagnosis

```bash
# Check error logs
kubectl logs -n lateen-os -l lateen.io/tier=backend --tail=500 | grep '"level":"error"'

# Check dependency health
kubectl get pods -n lateen-os
```

## Common Causes

| Cause | Fix |
| ----- | --- |
| Downstream service failure | Fix dependency (postgres, redis, nats) |
| Rate limiting at ingress | Adjust `rateLimit.requestsPerSecond` |
| Database connection pool exhausted | Scale postgres or reduce service replicas temporarily |
| Bad deployment | Rollback |

## Resolution

1. Identify affected service from Prometheus labels
2. Check correlation IDs in logs for request traces
3. Rollback if caused by recent deploy
4. Scale horizontally if load-related: `kubectl scale deployment/<svc> --replicas=N -n lateen-os`
