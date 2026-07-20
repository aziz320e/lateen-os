# Runbook — Service Down

## Symptoms

- Alert: `LateenBackendDown` or `LateenPodNotReady`
- Ingress returns 502/503
- Health check failing

## Diagnosis

```bash
kubectl get pods -n lateen-os -l lateen.io/component=<service>
kubectl describe pod -n lateen-os -l lateen.io/component=<service>
kubectl logs -n lateen-os -l lateen.io/component=<service> --tail=200
```

## Common Causes

| Cause | Fix |
| ----- | --- |
| OOMKilled | Increase memory limits in Helm values |
| CrashLoop — DB connection | Check postgres pod, verify DATABASE_URL secret |
| CrashLoop — Redis auth | Verify LATEEN_REDIS_PASSWORD secret |
| Image pull error | Check registry credentials and image tag |
| Probe failure | Service slow to start — increase `initialDelaySeconds` |

## Resolution

1. Fix underlying issue (scale resources, fix secrets, fix config)
2. Restart deployment: `kubectl rollout restart deployment/<service> -n lateen-os`
3. If bad release: `helm rollback lateen-os -n lateen-os`

## Escalation

If unresolved in 30 minutes, escalate to platform lead and initiate incident response.
