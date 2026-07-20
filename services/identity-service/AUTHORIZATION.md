# Identity Service — Authorization

## Business DNA integration

Authorization loads roles and permissions from Business DNA Service:

```
GET /api/v1/organizations/:orgId/roles
GET /api/v1/organizations/:orgId/policies
```

User-local roles/permissions (stored in identity DB) are merged with Business DNA roles at login and token issuance.

## Permission model

Permissions use `resource:action` format:

- `products:read`
- `machines:write`
- `*:*` (superuser)

Authorization checks:

1. User/API key local permissions
2. Business DNA role permissions
3. Decision Engine policy evaluation (sensitive actions)

## Decision Engine policies

Sensitive actions trigger additional policy evaluation:

- `delete`
- `revoke`
- `rotate`
- `admin`

Policies are fetched from Business DNA `policies` endpoint and evaluated via Decision Engine contracts.

## Tenant isolation

Every authorization request includes `organizationId`. The provider rejects cross-tenant access by scoping all repository queries to the tenant's internal organization identity record.

## Permission grants

Explicit grants tracked in `permission_grants` table with audit trail:

- `PermissionGranted` event on grant
- `PermissionRevoked` event on revoke

## Roles from Business DNA

Business DNA defines organizational roles (stored as Business DNA entities). Identity Service does not duplicate role definitions — it consumes them at runtime and embeds resolved permissions in JWT claims.
