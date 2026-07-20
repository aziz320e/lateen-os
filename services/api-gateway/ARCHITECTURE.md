# Architecture

## Overview

The Enterprise API Gateway is the single entry point for Lateen OS. It provides cross-cutting platform capabilities:

- Routing and path rewriting to downstream services
- Authentication (JWT, API key, service token)
- Tenant resolution via headers and JWT claims
- Rate limiting, caching, circuit breaker, retry, timeout
- Correlation IDs and audit event publishing (NATS)
- Health aggregation and observability

**No business logic** lives in the gateway. Downstream services remain unchanged.

## Request Flow

```
Client → Gateway Middleware → Policy Engine → Proxy → Downstream Service
                ↓
         Audit / Metrics / Tracing
```

## Middleware Pipeline

1. **Correlation ID** — `X-Correlation-Id` generated or forwarded
2. **JWT / API Key / Service Token** — authentication context
3. **Tenant Resolver** — `X-Tenant-Id` or JWT `tenantId` / `organizationId`
4. **Permission Resolver** — JWT permissions (stub v1)
5. **Audit Context** — NATS publish on completion
6. **Localization** — `Accept-Language` forwarded
7. **Request Metrics** — Prometheus counters

## Route Registry

Routes are defined in `src/domain/route-registry.ts`. Each route specifies:

- Gateway prefix (public API path)
- Target service base URL
- Path rewrite prefix
- Auth, cache, and status (active/planned)

## Policies

Configured via environment (see `src/config/index.ts`):

| Policy | Default |
| ------ | ------- |
| Max request size | 10 MB |
| Request timeout | 30s |
| Retry attempts | 2 |
| Rate limit | 600 req/min per tenant+route |
| Cache TTL | 60s (GET, cacheable routes) |

## Health Model

- **Liveness** — Gateway process is running
- **Readiness** — Required downstream services respond to `/health`
- **Dependencies** — Per-service health with latency

## Observability

- OpenTelemetry traces and metrics (OTLP)
- Structured logging via Pino
- Prometheus endpoint at `/metrics`

## Admin Console

`apps/admin-gateway` provides a BFF over the gateway management APIs for route and dependency visibility.
