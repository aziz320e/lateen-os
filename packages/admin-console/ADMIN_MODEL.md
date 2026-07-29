# Admin Model

> Real, implemented model for the Admin Console — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Organization Registry

`organizations/engine.impl.ts`'s `createOrganizationEngine()` implements the platform-wide record of every organization — deliberately keyed 1:1 with `OrganizationId` (`Organization.id === organizationId`), since an organization IS the tenancy boundary:

- **`registerOrganization()`** — starts at `status: 'active'`. Throws `DuplicateOrganizationError` if that `organizationId` is already registered. Publishes `organization.created`.
- **`suspendOrganization()` / `reactivateOrganization()` / `archiveOrganization()`** — guarded by `canTransitionOrganization()` (pure): `active ⇄ suspended → archived`, `archived` terminal.
- **`listOrganizations()`** — genuinely platform-wide (no `organizationId` argument), backed by a repository that is not partitioned the usual way.

---

## Tenant Registry, Environment Registry

`tenants/engine.impl.ts`'s `createTenantEngine()` implements a tenant's guarded lifecycle and its deployment environments:

- **`createTenant()`** — starts at `status: 'active'`. Publishes `tenant.created`.
- **`suspendTenant()` / `reactivateTenant()` / `archiveTenant()`** — guarded by `canTransitionTenant()` (pure), the same `active ⇄ suspended → archived` shape as Organizations.
- **`createEnvironment()`** — requires the parent tenant to exist (`TenantNotFoundError` otherwise); starts at `status: 'active'`, with `environmentType: 'development' | 'staging' | 'production'`.
- **`disableEnvironment()` / `enableEnvironment()`** — simple two-state toggle, independent of the parent tenant's own status (archiving a tenant does not implicitly disable its environments).

---

## Feature Flag Registry

`feature-flags/engine.impl.ts`'s `createFeatureFlagEngine()` implements organization-wide feature defaults with optional, independently-addressable overrides:

- **`registerFlag()`** — defaults `enabled` to `false`; accepts an optional `tenantId` and/or `environmentId` for override granularity. A flag with neither is the organization-wide default for its `key`.
- **`enableFlag()` / `disableFlag()`** — toggle one specific flag record by id. Publish `feature.enabled` / `feature.disabled`.
- **`isEnabled()`** — deterministic most-specific-match resolution: an environment-scoped match (for the given `tenantId` + `environmentId`) wins over a tenant-scoped match, which wins over the organization-wide default, which falls back to `false` if nothing is registered.

---

## Identity Administration

`identity/engine.impl.ts`'s `createIdentityAdministrationEngine()` implements Users, Groups, Roles, and Permissions as administrative RBAC bookkeeping. **This engine never verifies a password or token and implements no authentication pipeline** — see the Relationship Layer for the real, read-only link to AI Security Engine.

- **`Permission`** — `createPermission()` / `archivePermission()`; a flat `code` + optional `description`.
- **`Role`** — `createRole()` validates every given `permissionCodes` entry against registered permissions (`UnknownPermissionCodeError` otherwise); `addPermissionToRole()` / `removePermissionFromRole()` mutate the code list idempotently; `archiveRole()` does not prevent further permission changes. Publishes `role.created`.
- **`Group`** — `createGroup()` starts with no members; `addMember()` / `removeMember()` validate the user exists and are idempotent.
- **`User`** — `createUser()` starts at `status: 'active'` with no roles; `assignRole()` / `unassignRole()` validate the role exists and are idempotent; `suspendUser()` / `reactivateUser()` / `deactivateUser()` are independent status transitions (not a guarded state machine — any of the three is always reachable). Publishes `user.created`.

---

## System Settings

`settings/engine.impl.ts`'s `createSettingsEngine()` implements versioned settings at three scopes. **Deliberately not organization-scoped in the repository layer** — a `'global'` setting has no `organizationId` at all, so `settings/repository.ts` uses the same platform-wide store pattern as `organizations/`, with scope filtering performed here in the engine.

- **`upsertGlobalSetting()` / `upsertOrganizationSetting()` / `upsertTenantSetting()`** — each creates a new setting at version `1` or increments the existing one's `version`, appending every value to an immutable `history` array. Publish `settings.updated` regardless of scope.
- **`getEffectiveSetting()`** — fixed precedence: a tenant-scoped setting (when a `tenantId` is given) wins over the organization-scoped setting, which wins over the global setting, which falls back to `null`.

---

## Configuration Management

`configuration/engine.impl.ts`'s `createConfigurationEngine()` implements runtime configuration with per-environment overrides and a minimal, hand-rolled validator — never an external JSON Schema library.

- **`validateConfigPayload()`** (pure) — the same `FieldSchema[]`-style required/type check used elsewhere in this monorepo; `0`, `''`, and `false` are all treated as present, never as missing.
- **`setRuntimeConfig()`** — upserts by `(organizationId, environmentId, key)`; when a `schema` is given, the payload is validated first and `ConfigValidationError` is thrown (leaving the previous entry, if any, untouched) before anything is persisted. Publishes `configuration.updated`.
- **`getEffectiveConfig()`** — an environment override (when an `environmentId` is given) wins over the organization-wide default, which falls back to `null`.

---

## Audit Center

`audit/engine.impl.ts`'s `createAuditCenterEngine()` implements an immutable, append-only audit timeline. **There is no update or delete on this engine's public surface.**

- **`recordAudit()`** — persists `actor` (`{ id, type }`), `action` (a free-form string), `target` (`{ type, id }`), and `metadata` (defaults to `{}`) verbatim, with `createdAt === recordedAt`. Publishes `audit.recorded`.
- **`findForActor()` / `findForTarget()`** — simple, deterministic filters over the organization's full timeline.

---

## System Monitoring

`monitoring/engine.impl.ts`'s `createMonitoringEngine()` implements a pure aggregation over the Relationship Layer. **It owns no repository and computes no health/alerting/scoring logic of its own** — every number is read live, on each call, from a sibling package's own query layer:

- **`getSystemMonitoringSnapshot()`** — calls `getObservabilityHealthContext()`, `getAnalyticsSnapshotContext()`, `getSecurityPolicyContext()`, `getGovernancePolicyContext()`, and `getComplianceFrameworkContext()` in parallel and reduces each to a count (health checks are additionally split into total vs. non-`'healthy'`).

---

## Administration Dashboard

`dashboard/engine.impl.ts`'s `createDashboardEngine()` implements the Administration Dashboard, composed intra-package over the Tenant, Feature Flag, Identity, and Audit engines plus System Monitoring:

- **`computeSystemStatus()`** (pure) — fixed banding over checked vs. unhealthy service counts: `'healthy'` when there are no checked services or none are unhealthy, `'unhealthy'` when every checked service is unhealthy, `'degraded'` otherwise.
- **`generateDashboard()`** — gathers real tenant/feature-flag/user/audit counts plus a System Monitoring snapshot, computes `systemStatus`, `tenantStatus` (per-tenant name + status), `healthSummary`, and `alertsSummary` (the organization's own recorded audit-entry count), and persists the result as an immutable snapshot. Publishes `dashboard.generated`.
- **`getLatestDashboard()`** — the most recently generated snapshot for an organization, resolved deterministically by `generatedAt`.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 9 required packages, each exclusively through its public API:

- **`getApiGatewayContext()`** — real API Gateway `queries.findApis()`.
- **`getObservabilityHealthContext()`** — real Observability Engine `queries.findHealth()`.
- **`getAnalyticsSnapshotContext()`** — real Analytics Engine `queries.findKPIs()`.
- **`getSecurityPolicyContext()`** — real AI Security Engine `queries.findPolicies()`.
- **`getGovernancePolicyContext()`** — real AI Governance Engine `queries.findPolicies()`.
- **`getComplianceFrameworkContext()`** — real AI Compliance Engine `queries.findFrameworks()`.
- **`getBusinessProfileContext()`** — real Business DNA `businessProfile.get()`.
- **`logAdminDecisionToMemory()`** — real Institutional Memory `lifecycle.create()`, logging a `'decision'`-typed, `'operational'`-category knowledge entry sourced as `'admin-console'`.
- **`notifyAdminEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.

Every method degrades to a documented `null`/`[]` when its collaborator was not injected, so the Admin Console remains fully usable — and fully tested — completely offline. System Monitoring and the Administration Dashboard are built entirely on top of these same 9 methods.
