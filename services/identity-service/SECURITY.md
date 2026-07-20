# Identity Service — Security

## Password policies

- Minimum length: 8 (configurable via `PASSWORD_MIN_LENGTH`)
- Requires uppercase, lowercase, and digit
- Stored using scrypt with per-password salt

## Session management

- Access tokens: JWT, default 15 minutes (`JWT_ACCESS_TTL_SECONDS`)
- Refresh tokens: stored hashed in PostgreSQL
- Remember me: extended TTL (default 30 days)
- Sessions revocable via logout

## Rate limiting

- Redis-backed sliding window (in-memory fallback for tests)
- Default: 100 requests per 60 seconds per login key
- Configurable via `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`

## Account lockout

- Failed login attempts tracked per user
- Lockout after 5 failures (configurable)
- Lockout duration: 15 minutes (configurable)

## IP restrictions

- Optional CIDR allowlist via `ALLOWED_IP_CIDRS`
- Empty = allow all

## Audit logging

All authentication and credential management actions are persisted to `audit_logs`:

- Login success/failure
- Logout
- API key create/revoke
- Service account create
- Permission grant/revoke

## Secret rotation contracts

Exposed at `GET /api/v1/security/rotation-contracts`:

| Secret type | Rotation guidance |
| ----------- | ----------------- |
| JWT signing key | Dual-sign overlap window |
| API keys | Create new, revoke old after grace period |
| Service account secrets | Rotate via service API |
| Keycloak client secret | Rotate in Keycloak admin |

## Tenant isolation

- All entities scoped by `organizationId`
- JWT claims include organization context
- Cross-tenant access rejected at repository layer

## Production checklist

- [ ] Set strong `JWT_SECRET` (32+ chars)
- [ ] Enable `KEYCLOAK_ENABLED=true` with production realm
- [ ] Configure `ALLOWED_IP_CIDRS` for admin endpoints
- [ ] Enable OpenTelemetry export
- [ ] Use dedicated PostgreSQL database (`lateen_identity`)
- [ ] Enable Redis for rate limiting and session cache
- [ ] Run `db:migrate:deploy` in CI/CD
