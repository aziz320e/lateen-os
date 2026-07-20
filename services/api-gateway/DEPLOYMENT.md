# Deployment

## Ports

| Component | Port |
| --------- | ---- |
| API Gateway | 4008 |
| Admin Gateway | 3007 |

## Environment Variables

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT` | `4008` | Gateway listen port |
| `HOST` | `0.0.0.0` | Bind address |
| `REDIS_URL` | `redis://localhost:6379/8` | Cache backing store |
| `NATS_URL` | `nats://localhost:4222` | Audit events |
| `IDENTITY_BASE_URL` | `http://localhost:4003` | Identity service |
| `BUSINESS_DNA_BASE_URL` | `http://localhost:4001` | Business DNA |
| `PRODUCT_DISCOVERY_BASE_URL` | `http://localhost:4002` | Product Discovery |
| `INTEGRATION_HUB_BASE_URL` | `http://localhost:4004` | Integration Hub |
| `MISSION_SCHEDULER_BASE_URL` | `http://localhost:4005` | Mission Scheduler |
| `MARKETPLACE_BASE_URL` | `http://localhost:4006` | Marketplace |
| `PROVISIONING_BASE_URL` | `http://localhost:4007` | Provisioning |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | — | OpenTelemetry collector |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `MAX_REQUEST_BYTES` | `10485760` | Max request body |
| `REQUEST_TIMEOUT_MS` | `30000` | Upstream timeout |
| `RATE_LIMIT_MAX` | `600` | Requests per window |
| `USE_REDIS` | `true` | Enable Redis cache |
| `USE_NATS` | `true` | Enable NATS audit |

## Docker

Image metadata registered in `deployment/docker/images.json`:

```json
{
  "name": "api-gateway",
  "package": "@lateen-os/api-gateway-service",
  "path": "services/api-gateway",
  "port": 4008,
  "healthPath": "/health"
}
```

## Health Probes

| Probe | Path | Success |
| ----- | ---- | ------- |
| Liveness | `/health/live` | `200` |
| Readiness | `/health/ready` | `200` with `status: ready` |
| Startup | `/health` | `200` |

## Scaling

- Gateway is stateless except Redis cache and in-memory rate limits
- Horizontal scaling requires shared Redis for consistent rate limiting and cache
- Place behind load balancer with sticky sessions optional

## Admin Console

Deploy `apps/admin-gateway` with:

```
NEXT_PUBLIC_LATEEN_GATEWAY_BASE_URL=http://api-gateway:4008
```

## Platform Manifest

Registered in Kernel manifest as `api-gateway` (port 4008) with dependencies on all orchestrated backend services.
