# Scaling Guide

## Horizontal Pod Autoscaling

Add HPA per service in production:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: identity-service
  namespace: lateen-os
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: identity-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Replica Baselines (Production)

| Component | Min | Max | Notes |
| --------- | --- | --- | ----- |
| identity-service | 3 | 10 | Auth bottleneck |
| customer-portal | 3 | 8 | User-facing |
| lateen-assistant | 3 | 8 | User-facing |
| business-dna-service | 3 | 6 | Core API |
| mission-scheduler | 2 | 4 | Background jobs |

## Vertical Scaling

Adjust in `values-prod.yaml`:

```yaml
backends:
  business-dna-service:
    resources:
      requests: { cpu: 500m, memory: 1Gi }
      limits: { cpu: 2000m, memory: 2Gi }
```

## Infrastructure Scaling

| Component | Scale approach |
| --------- | -------------- |
| PostgreSQL | Increase PVC, node size; consider managed RDS/Cloud SQL for prod |
| Redis | Single instance → Redis Cluster or ElastiCache |
| NATS | Enable JetStream clustering |
| MinIO | Distributed mode or managed S3 |
| Qdrant | Increase replicas with sharding |

## Cluster Node Scaling

Terraform modules support node count / instance type variables:

```hcl
# Azure
node_count  = 5
node_vm_size = "Standard_D8s_v3"

# AWS
node_count = 5
node_instance_type = "t3.xlarge"
```

## Ingress Rate Limiting

Production default: 200 RPS. Adjust in Helm:

```yaml
rateLimit:
  enabled: true
  requestsPerSecond: 200
```

## Load Testing

Before scaling events, validate with load tests against staging:

1. Deploy to staging with prod-like replicas
2. Run k6/Artillery against ingress host
3. Monitor Grafana P99 latency and error rate
4. Adjust HPA thresholds
