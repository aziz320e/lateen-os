# API Reference

Base URL: `http://localhost:4008`

## Authentication

| Method | Header |
| ------ | ------ |
| JWT | `Authorization: Bearer <token>` |
| API Key | `X-Api-Key: <key>` |
| Service Token | `X-Service-Token: <token>` |

## Tenant Context

| Header | Description |
| ------ | ----------- |
| `X-Tenant-Id` | Organization/tenant identifier |
| `X-Correlation-Id` | Request correlation (auto-generated if omitted) |
| `Accept-Language` | Locale for downstream services |

## Proxied APIs

All proxied routes accept standard HTTP methods. Path suffixes are forwarded to downstream services with prefix rewriting.

### `/api/auth/*`

Proxied to Identity Service at `/api/v1/auth/*`.

### `/api/business-dna/*`

Proxied to Business DNA at `/api/v1/*`.

### `/api/discovery/*`

Proxied to Product Discovery at `/api/v1/discovery/*`.

### `/api/workflows/*`

Proxied to Integration Hub at `/api/jobs/*`.

### `/api/missions/*`

Proxied to Mission Scheduler at `/api/missions/*`.

### `/api/search/*`

Proxied to Marketplace at `/api/search/*`.

### `/api/marketplace/*`

Proxied to Marketplace at `/api/*`.

### `/api/connectors/*`

Proxied to Integration Hub at `/api/connectors/*`.

### `/api/provisioning/*`

Proxied to Provisioning at `/api/*`.

### `/api/platform`

Gateway-managed platform summary (not proxied).

### Planned Routes

`/api/runtime`, `/api/workforce`, `/api/memory` return `503` with `{ status: "planned" }`.

## Management API

### `GET /gateway/routes`

Returns the route registry.

### `GET /gateway/status`

Returns uptime, route counts, and request metrics.

### `GET /openapi.json`

OpenAPI 3.1 specification.

### `GET /metrics`

Prometheus text format metrics.

## Response Headers

| Header | Description |
| ------ | ----------- |
| `X-Correlation-Id` | Request correlation ID |
| `X-Gateway-Route` | Matched route ID |
| `X-RateLimit-Remaining` | Remaining requests in window |
| `X-Cache` | `HIT` or `MISS` (cacheable GET) |

## Error Responses

```json
{ "error": "Authentication required" }
{ "error": "Rate limit exceeded" }
{ "error": "Circuit breaker open", "service": "..." }
{ "error": "Service not available", "route": "runtime", "status": "planned" }
```
