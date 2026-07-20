# Identity Service — API Reference

Base URL: `http://localhost:4003`

## Authentication

### POST /api/v1/auth/login

```json
{
  "organizationId": "00000000-0000-4000-8000-000000000001",
  "username": "admin",
  "password": "Admin123!",
  "rememberMe": false,
  "deviceId": "optional-device-id",
  "deviceName": "Chrome on Windows"
}
```

**Response 200:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "user": {
    "id": "...",
    "email": "admin@lateen.local",
    "username": "admin",
    "organizationId": "...",
    "roles": ["admin"],
    "permissions": ["*:*"]
  }
}
```

### POST /api/v1/auth/refresh

```json
{ "refreshToken": "..." }
```

### POST /api/v1/auth/logout

```json
{ "refreshToken": "..." }
```

Returns `204 No Content`.

### GET /api/v1/auth/me

Header: `Authorization: Bearer <accessToken>`

## API Keys

Headers: `Authorization`, `X-Organization-Id`

### GET /api/v1/auth/api-keys

### POST /api/v1/auth/api-keys

```json
{
  "organizationId": "...",
  "name": "CI Pipeline",
  "roles": ["operator"],
  "permissions": ["products:read"]
}
```

Returns the full API key **once** in the `key` field.

### DELETE /api/v1/auth/api-keys/:id

## Service Accounts

### GET /api/v1/auth/service-accounts

### POST /api/v1/auth/service-accounts

```json
{
  "organizationId": "...",
  "name": "Discovery Worker",
  "roles": ["service"],
  "permissions": ["discovery:run"]
}
```

Returns `clientId` and `clientSecret` once.

## Health

### GET /health

### GET /metrics

### GET /api/v1/security/rotation-contracts

Returns secret rotation contract definitions.

## Events (NATS)

Subject prefix: `lateen.identity`

| Event | Subject |
| ----- | ------- |
| UserLoggedIn | `lateen.identity.UserLoggedIn` |
| UserLoggedOut | `lateen.identity.UserLoggedOut` |
| SessionExpired | `lateen.identity.SessionExpired` |
| ApiKeyCreated | `lateen.identity.ApiKeyCreated` |
| PermissionGranted | `lateen.identity.PermissionGranted` |
| PermissionRevoked | `lateen.identity.PermissionRevoked` |
