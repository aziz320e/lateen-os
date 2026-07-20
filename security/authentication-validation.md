# Authentication Validation — v1.0.0-rc.1

## Mechanisms

- JWT bearer tokens (Identity service)
- Session cookies (Next.js apps via BFF)
- API keys (Integration Hub connectors — contract only)

## Flow

```
Client → BFF (Next.js) → API Gateway → Service
         ↓
    Identity Service (token validation)
```

## Validated

| Check | Status |
| ----- | ------ |
| Token expiry enforced | ✅ |
| Invalid token rejected (401) | ✅ |
| Missing token rejected (401) | ✅ |
| Refresh flow documented | ✅ |

## RC Status

✅ Pass
