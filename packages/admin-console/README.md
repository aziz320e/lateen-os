# @lateen-os/admin-console

Admin Console — Administration, Identity Administration, System Settings, Configuration Management, the Audit Center, System Monitoring, and the Administration Dashboard for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Admin Console is the platform administration layer for Lateen OS. It owns the Organization Registry (the platform-level record of every tenancy boundary), the Tenant/Environment Registry, the Feature Flag Registry, Identity Administration (Users/Groups/Roles/Permissions — administrative RBAC bookkeeping, never authentication itself), System Settings (versioned, at global/tenant/organization scope), Configuration Management (runtime configuration with environment overrides and validation), the Audit Center (an immutable actor/action/target/metadata timeline), System Monitoring (a pure aggregation over Observability/Analytics/Security/Governance/Compliance — never a re-implementation of their logic), and the Administration Dashboard (KPIs, system status, tenant status, health summary, alerts summary).

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package**
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createAdminConsoleRuntime()` for the composition root
- Repositories stay internal — never exposed outside the runtime composition root

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Organization Registry | `organizations` | Platform-wide, deliberately **not** organization-scoped — `Organization.id === organizationId`, since an organization IS the tenancy boundary |
| Tenant Registry, Environment Registry | `tenants` | A tenant's guarded lifecycle plus its deployment environments (development/staging/production) |
| Feature Flag Registry | `feature-flags` | Organization-wide defaults, optionally overridden at tenant or environment granularity, resolved by deterministic most-specific-match precedence |
| Identity Administration | `identity` | Users, Groups, Roles, Permissions — administrative bookkeeping only; never duplicates authentication (see Relationship Layer) |
| System Settings | `settings` | Versioned settings at `global` / `tenant` / `organization` scope, with full change history and tenant-over-organization-over-global effective resolution |
| Configuration Management | `configuration` | Runtime configuration with per-environment overrides and a minimal, hand-rolled field-level validator |
| Audit Center | `audit` | An immutable, append-only audit timeline — actor, action, target, metadata |
| System Monitoring | `monitoring` | A pure aggregation over the Relationship Layer's Observability/Analytics/Security/Governance/Compliance methods — owns no health/alerting logic of its own |
| Administration Dashboard | `dashboard` | KPIs, system status, tenant status, health summary, alerts summary — composed intra-package over every other engine plus System Monitoring |
| Relationship Layer | `relationship-management` | Integrates all 9 required sibling packages — see below |
| Query Layer | `queries` | Real, read-only `AdminQueries` port — `findOrganizations` / `findTenants` / `findUsers` / `findRoles` / `findSettings` / `findAudits` / `findDashboard` / `searchAdministration` |
| Event Bus | `events` | Typed `AdminEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with 9 sibling packages

Per the architecture rules, this package integrates with sibling packages **only through their public runtime APIs** — never a repository, never a modification to those packages.

- **API Gateway** — `getApiGatewayContext()` reads every real registered API via `queries.findApis()`.
- **Observability Engine** — `getObservabilityHealthContext()` reads every real health check via `queries.findHealth()`.
- **Analytics Engine** — `getAnalyticsSnapshotContext()` reads every real KPI snapshot via `queries.findKPIs()`.
- **AI Security Engine** — `getSecurityPolicyContext()` reads every real policy via `queries.findPolicies()`.
- **AI Governance Engine** — `getGovernancePolicyContext()` reads every real policy via `queries.findPolicies()`.
- **AI Compliance Engine** — `getComplianceFrameworkContext()` reads every real framework via `queries.findFrameworks()`.
- **Business DNA** — `getBusinessProfileContext()` fetches the real business profile via `businessProfile.get()`.
- **Institutional Memory** — `logAdminDecisionToMemory()` logs a real `'decision'` knowledge entry via `lifecycle.create()`.
- **Communication Hub** — `notifyAdminEvent()` creates and sends a real `'escalation'` notification.

Every optional collaborator degrades to a documented no-op (`null`/`[]`) when not injected, so the Admin Console is fully usable — and fully tested — completely offline without any of them. System Monitoring and the Administration Dashboard are built entirely on top of this same Relationship Layer, so they never duplicate the monitoring or health logic those sibling packages already own.

## Event bus

`AdminEventMap` declares 10 events, each genuinely published by the real service that causes it:

`organization.created`, `tenant.created`, `user.created`, `role.created`, `settings.updated`, `feature.enabled`, `feature.disabled`, `audit.recorded`, `dashboard.generated`, `configuration.updated`.

## Usage

```typescript
import { createAdminConsoleRuntime } from '@lateen-os/admin-console';

const admin = createAdminConsoleRuntime();

await admin.organizations.registerOrganization('org-1', { name: 'Acme Co', plan: 'business' });
const tenant = await admin.tenants.createTenant('org-1', { name: 'Production Tenant' });
await admin.tenants.createEnvironment('org-1', { tenantId: tenant.id, name: 'Prod', environmentType: 'production' });

const flag = await admin.featureFlags.registerFlag('org-1', { key: 'new-ui' });
await admin.featureFlags.enableFlag('org-1', flag.id);

const user = await admin.identity.createUser('org-1', { email: 'admin@acme.co', displayName: 'Acme Admin' });
const role = await admin.identity.createRole('org-1', { name: 'Org Admin' });
await admin.identity.assignRole('org-1', user.id, role.id);

const snapshot = await admin.dashboard.generateDashboard('org-1');
```

Wiring in real sibling collaborators (any subset):

```typescript
import { createObservabilityRuntime } from '@lateen-os/observability-engine';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';

const admin = createAdminConsoleRuntime({
  observability: createObservabilityRuntime(),
  analytics: createAnalyticsRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
admin.events.subscribe('dashboard.generated', (payload) => {
  console.log(`Dashboard ${payload.dashboardSnapshotId} generated for ${payload.organizationId}`);
});
```

## Structure

```
src/
├── shared/                     # IDs, date arithmetic, primitives, errors
├── events/                     # Typed AdminEventMap
├── organizations/              # Organization Registry (platform-wide)
├── tenants/                    # Tenant Registry, Environment Registry
├── feature-flags/              # Feature Flag Registry
├── identity/                   # Identity Administration (Users/Groups/Roles/Permissions)
├── settings/                   # System Settings (versioned, global/tenant/organization)
├── configuration/              # Configuration Management
├── audit/                      # Audit Center
├── monitoring/                 # System Monitoring (composed over the Relationship Layer)
├── dashboard/                  # Administration Dashboard
├── relationship-management/    # 9-collaborator Relationship Layer
├── queries/                    # Real AdminQueries read layer
├── runtime.ts                  # createAdminConsoleRuntime() composition root
└── index.ts
```

See [ADMIN_MODEL.md](./ADMIN_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/api-gateway` — optional Relationship Layer collaborator
- `@lateen-os/observability-engine` — optional Relationship Layer collaborator
- `@lateen-os/analytics-engine` — optional Relationship Layer collaborator
- `@lateen-os/ai-security-engine` — optional Relationship Layer collaborator
- `@lateen-os/ai-governance-engine` — optional Relationship Layer collaborator
- `@lateen-os/ai-compliance-engine` — optional Relationship Layer collaborator
- `@lateen-os/business-dna` — optional Relationship Layer collaborator; also `OrganizationId`
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator

## Verification

```bash
pnpm --filter @lateen-os/admin-console build
pnpm --filter @lateen-os/admin-console typecheck
pnpm --filter @lateen-os/admin-console test
pnpm --filter @lateen-os/admin-console lint
```
