# Chaos Testing Checklist — v1.0.0-rc.1

## Planned Chaos Scenarios (GA)

| Scenario | Tool | Priority |
| -------- | ---- | -------- |
| Kill random pod | Kubernetes | High |
| Network partition | Chaos Mesh | High |
| Database failover | Manual | High |
| Redis unavailable | Manual | Medium |
| High latency injection | Toxiproxy | Medium |
| Memory pressure | stress-ng | Low |

## RC Validation

- [x] Health endpoints respond under single-service restart
- [x] API Gateway returns 503 when downstream unavailable
- [ ] Automated chaos suite (deferred to GA)

## RC Status

✅ Pass — manual validation complete; automation deferred.
