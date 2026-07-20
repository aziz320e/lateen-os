# Identity Service — Authentication

## Supported methods

| Method | Status | Notes |
| ------ | ------ | ----- |
| Username / Password | Implemented | Local user store with scrypt |
| JWT | Implemented | HS256 access tokens via `jose` |
| Refresh Tokens | Implemented | Rotating refresh token chain |
| Remember Me | Implemented | Extended session TTL |
| OIDC | Keycloak adapter | `KEYCLOAK_ENABLED=true` |
| OAuth2 | Keycloak adapter | Authorization code + password grants |
| API Keys | Implemented | `lk_<prefix>_<secret>` format |
| Service Accounts | Implemented | clientId + clientSecret |

## Keycloak adapter

When `KEYCLOAK_ENABLED=true`:

- Login delegates to Keycloak password grant
- Refresh delegates to Keycloak token endpoint
- `/me` can introspect Keycloak tokens
- Logout calls Keycloak end-session endpoint

Configuration:

```
KEYCLOAK_REALM=lateen
KEYCLOAK_CLIENT_ID=identity-service
KEYCLOAK_CLIENT_SECRET=...
KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/lateen
```

## Token flow

```
Client                    Identity Service              PostgreSQL
  |  POST /login              |                            |
  |-------------------------->|  verify password           |
  |                           |  create session + refresh  |
  |                           |--------------------------->|
  |  access + refresh tokens  |                            |
  |<--------------------------|                            |
  |  GET /me (Bearer)         |                            |
  |-------------------------->|  verify JWT                |
  |  user profile             |                            |
  |<--------------------------|                            |
  |  POST /refresh            |                            |
  |-------------------------->|  rotate refresh token      |
  |  new token pair           |                            |
  |<--------------------------|                            |
```

## Device tracking

Optional `deviceId` and `deviceName` on login upserts a `Device` record for trusted device management.

## Identity entities

| Entity | Purpose |
| ------ | ------- |
| OrganizationIdentity | Links to Business DNA organization |
| User | Human actor with credentials |
| ServiceAccount | Machine-to-machine OAuth client |
| ApiKey | Long-lived programmatic access |
| Session | Active login session |
| RefreshToken | Token rotation chain |
| Device | Registered client device |
