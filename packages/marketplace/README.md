# @lateen-os/marketplace-engine

Marketplace / Extension Platform — the Extension Registry, Plugin Registry, Package Registry, Extension Sandbox, Extension Configuration, Extension Events, and the Marketplace Catalog for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Marketplace is the extension platform for Lateen OS. It owns the Extension Registry (install/uninstall/enable/disable/upgrade, plus composite validation over the three modules below), the Plugin Registry (capabilities, required permissions, and deterministic semantic-version-range compatibility checking), the Package Registry (versions, dependencies, and a real SHA-256 content-integrity signature), the Extension Sandbox (deterministic capability/permission/isolation metadata — **no code execution anywhere in this package**), Extension Configuration (defaults, overrides, validation), Extension Events (declared subscriptions/publications and compatibility checking against a known event-name catalog — metadata only, never a live subscription), and the Marketplace Catalog (categories, publishers, ratings, downloads — metadata only).

## Stack

- Pure TypeScript, strict mode
- DDD bounded context — one module per capability, each with `types.ts` / `repository.ts` (port) / `repository.impl.ts` (real in-memory implementation), plus a `*.impl.ts` service/engine
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, **no LLM anywhere in this package**, **no code execution anywhere in this package**
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createMarketplaceRuntime()` for the composition root
- A real, dependency-free semantic-version comparator (`shared/semver.ts`) and a real SHA-256 content-integrity signature (via Node's built-in `crypto`) — no external semver or cryptographic-signing library added

## Capabilities

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Extension Registry | `extension-registry` | install → enabled ⇄ disabled → uninstalled lifecycle, plus `validateExtension()` composing the Package Registry, Plugin Registry, and Extension Sandbox |
| Plugin Registry | `plugin-registry` | Plugins, declared capabilities/required permissions, and deterministic version-range compatibility checking |
| Package Registry | `package-registry` | Versions, dependencies, and a real SHA-256 signature computed at publish time |
| Extension Sandbox | `extension-sandbox` | Deterministic capability/permission/isolation-level metadata — **no code execution** |
| Extension Configuration | `extension-configuration` | Per-extension defaults and overrides, with a minimal hand-rolled field-level validator |
| Extension Events | `extension-events` | Declared event subscriptions/publications and compatibility checking against a known event-name catalog — metadata only |
| Marketplace Catalog | `marketplace-catalog` | Categories, publishers, deterministic running-average ratings, and download counts — metadata only |
| Relationship Layer | `relationship-management` | Integrates all 8 required sibling packages — see below |
| Query Layer | `queries` | Real, read-only `MarketplaceQueries` port — `findExtensions` / `findPlugins` / `findPackages` / `findCatalog` / `findConfigurations` / `findCompatibility` / `searchMarketplace` |
| Event Bus | `events` | Typed `MarketplaceEventMap`; every declared event is genuinely published by the service that triggers it |

## Integration with 8 sibling packages

Per the architecture rules, this package integrates with sibling packages **only through their public runtime APIs** — never a repository, never a modification to those packages.

- **API Gateway** — `getApiGatewayContext()` reads every real registered API via `queries.findApis()`.
- **Admin Console** — `getAdminOrganizationContext()` fetches the real organization record via `organizations.getOrganization()`.
- **AI Runtime** — `getAgentContext()` fetches a real agent via `RuntimeQueries.findAgent()`.
- **Workflow Engine** — `raiseExtensionApprovalWorkflow()` defines (idempotently, per organization + request type) and starts a real extension-approval workflow.
- **Analytics Engine** — `getAnalyticsSnapshotContext()` reads every real KPI snapshot via `queries.findKPIs()`.
- **Observability Engine** — `getObservabilityHealthContext()` reads every real health check via `queries.findHealth()`.
- **Communication Hub** — `notifyMarketplaceEvent()` creates and sends a real `'escalation'` notification.
- **Institutional Memory** — `logMarketplaceDecisionToMemory()` logs a real `'decision'` knowledge entry via `lifecycle.create()`.

Every optional collaborator degrades to a documented no-op (`null`/`[]`) when not injected, so the Marketplace is fully usable — and fully tested — completely offline without any of them.

## Event bus

`MarketplaceEventMap` declares 10 events, each genuinely published by the real service that causes it:

`extension.installed`, `extension.uninstalled`, `extension.enabled`, `extension.disabled`, `extension.upgraded`, `plugin.registered`, `catalog.updated`, `configuration.changed`, `compatibility.checked`, `extension.validated`.

## Usage

```typescript
import { createMarketplaceRuntime } from '@lateen-os/marketplace-engine';

const marketplace = createMarketplaceRuntime();

const extension = await marketplace.extensions.install('org-1', { key: 'com.acme.widget', name: 'Acme Widget', currentVersion: '1.0.0' });
await marketplace.packages.publishVersion('org-1', { extensionKey: 'com.acme.widget', version: '1.0.0' });
await marketplace.sandbox.createSandboxProfile('org-1', { extensionId: extension.id, allowedCapabilities: ['read:data'] });

const validation = await marketplace.extensions.validateExtension('org-1', extension.id);
if (validation.valid) {
  await marketplace.extensions.enable('org-1', extension.id);
}

const catalogEntry = await marketplace.catalog.publishToCatalog('org-1', {
  extensionKey: 'com.acme.widget',
  name: 'Acme Widget',
  category: 'productivity',
  publisher: 'Acme',
});
await marketplace.catalog.recordRating('org-1', catalogEntry.id, 5);
```

Wiring in real sibling collaborators (any subset):

```typescript
import { createApiGatewayRuntime } from '@lateen-os/api-gateway';
import { createObservabilityRuntime } from '@lateen-os/observability-engine';

const marketplace = createMarketplaceRuntime({
  apiGateway: createApiGatewayRuntime(),
  observability: createObservabilityRuntime(),
});
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
marketplace.events.subscribe('extension.installed', (payload) => {
  console.log(`Extension ${payload.key} installed for ${payload.organizationId}`);
});
```

## Structure

```
src/
├── shared/                     # IDs, semver comparator, primitives, errors
├── events/                     # Typed MarketplaceEventMap
├── package-registry/           # Versions, dependencies, real SHA-256 signatures
├── plugin-registry/            # Plugins, capabilities, permissions, compatibility
├── extension-sandbox/          # Deterministic capability/permission/isolation metadata
├── extension-registry/         # install/uninstall/enable/disable/upgrade, validateExtension()
├── extension-configuration/    # Defaults, overrides, validation
├── extension-events/           # Declared subscriptions/publications, compatibility
├── marketplace-catalog/        # Categories, publishers, ratings, downloads
├── relationship-management/    # 8-collaborator Relationship Layer
├── queries/                    # Real MarketplaceQueries read layer
├── runtime.ts                  # createMarketplaceRuntime() composition root
└── index.ts
```

See [MARKETPLACE_MODEL.md](./MARKETPLACE_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/api-gateway` — optional Relationship Layer collaborator
- `@lateen-os/admin-console` — optional Relationship Layer collaborator
- `@lateen-os/ai-runtime` — optional Relationship Layer collaborator
- `@lateen-os/workflow-engine` — optional Relationship Layer collaborator
- `@lateen-os/analytics-engine` — optional Relationship Layer collaborator
- `@lateen-os/observability-engine` — optional Relationship Layer collaborator
- `@lateen-os/communication-hub` — optional Relationship Layer collaborator
- `@lateen-os/institutional-memory` — optional Relationship Layer collaborator
- `@lateen-os/business-dna` — type-only reuse

## Verification

```bash
pnpm --filter @lateen-os/marketplace-engine build
pnpm --filter @lateen-os/marketplace-engine typecheck
pnpm --filter @lateen-os/marketplace-engine test
pnpm --filter @lateen-os/marketplace-engine lint
```
