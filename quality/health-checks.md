# Health Checks — v1.0.0-rc.1

## Backend Services

All 12 services expose `GET /health`:

| Service | Port | Path |
| ------- | ---- | ---- |
| business-dna-service | 4001 | /health |
| product-discovery | 4002 | /health |
| identity-service | 4003 | /health |
| integration-hub | 4004 | /health |
| mission-scheduler | 4005 | /health |
| marketplace | 4006 | /health |
| provisioning | 4007 | /health |
| api-gateway | 4008 | /health |
| knowledge-platform | 4009 | /health |
| search-platform | 4010 | /health |
| analytics-platform | 4011 | /health |
| cloud-control-plane | 4012 | /health |

## Infrastructure

See `infrastructure/docker/scripts/health-check.sh`

## Kubernetes

Helm chart includes liveness/readiness probes on all service deployments.

## RC Status

✅ Pass
