# Lateen OS — Service Level Objectives

| Service | Availability | Latency P99 | Error Budget (30d) |
| ------- | ------------ | ----------- | ------------------ |
| business-dna-service | 99.9% | 500ms | 43m |
| product-discovery | 99.5% | 2000ms | 3h 39m |
| identity-service | 99.9% | 300ms | 43m |
| integration-hub | 99.5% | 1000ms | 3h 39m |
| mission-scheduler | 99.5% | 1000ms | 3h 39m |
| ai-product-manager | 99.5% | 3000ms | 3h 39m |
| customer-portal | 99.9% | 2000ms | 43m |
| lateen-assistant | 99.5% | 3000ms | 3h 39m |

## Measurement

- **Availability**: `(successful_requests / total_requests) * 100` over 30-day rolling window
- **Latency**: HTTP request duration histogram P99 from OpenTelemetry → Prometheus
- **Health checks**: Kubernetes `/health` probes on all backend services

## Burn Rate Alerts

| Alert | Condition | Action |
| ----- | --------- | ------ |
| Fast burn | 2% budget in 1h | Page on-call |
| Slow burn | 10% budget in 6h | Slack warning |

See `deployment/monitoring/alerts/prometheus-rules.yaml` for Prometheus alert definitions.
