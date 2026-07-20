# Security

## Transport

- TLS termination expected at load balancer / ingress in production
- Gateway enforces security headers on all responses

## Security Headers

| Header | Value |
| ------ | ----- |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Restricted camera/microphone/geolocation |
| `X-Gateway` | `lateen-os-api-gateway` |

## Authentication

### JWT

Bearer tokens are parsed for `sub`, `tenantId`, `organizationId`, and `permissions`. Production deployments must configure signature verification via identity service integration.

### API Keys

`X-Api-Key` header grants `api:access` permission. Keys should be rotated and stored in secrets management.

### Service Tokens

`X-Service-Token` for service-to-service calls grants `service:invoke`.

## Authorization

Routes marked `authRequired: true` reject unauthenticated requests with `401`. Permission enforcement is delegated to downstream services; the gateway adds tenant and correlation context.

## CORS

Configurable via `CORS_ORIGIN`. Default: `*` (development). Production should restrict to known application origins.

## CSRF

State-changing browser requests should use SameSite cookies or CSRF tokens when cookie-based auth is introduced. API clients using Bearer tokens are not CSRF-vulnerable.

## Input Validation

- Maximum request body size enforced by Fastify (`MAX_REQUEST_BYTES`)
- Downstream services perform domain validation (Zod schemas)

## Output Sanitization

Gateway forwards downstream responses without modification. Sanitization is the responsibility of origin services.

## Rate Limiting

Per-tenant, per-route sliding window. Returns `429` with `Retry-After` header.

## Audit

All proxied requests publish audit events to NATS subject `lateen.gateway.audit` with correlation ID, tenant, method, path, status, and duration.

## Secrets

| Variable | Purpose |
| -------- | ------- |
| `JWT_SECRET` | Optional JWT validation stub |
| `REDIS_URL` | Cache and rate limit backing store |
| `NATS_URL` | Audit event bus |

Never commit secrets. Use platform secrets management in production.
