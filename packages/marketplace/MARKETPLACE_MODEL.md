# Marketplace Model

> Real, implemented model for the Marketplace / Extension Platform — see [README.md](./README.md) for the runtime and [ARCHITECTURE.md](./ARCHITECTURE.md) for the module map.

---

## Package Registry

`package-registry/engine.impl.ts`'s `createPackageRegistryEngine()` implements versions, dependencies, and a real content-integrity signature:

- **`computeSignature()`** (pure) — a genuine SHA-256 digest (via `node:crypto`) over the canonical `(extensionKey, version, dependencies)` content; the dependency list is sorted by `key` before hashing, so signature computation is order-independent.
- **`publishVersion()`** — computes and persists the signature; throws `DuplicatePackageVersionError` for a repeated `(extensionKey, version)` pair, even if the dependency list differs between calls.
- **`verifySignature()`** — re-hashes nothing; it's a real repository-backed comparison between the presented signature and the one computed and stored at publish time.
- **`findDependents()`** — every version, across the whole organization, whose `dependencies` array references a given key.

---

## Plugin Registry

`plugin-registry/engine.impl.ts`'s `createPluginRegistryEngine()` implements plugin definitions with deterministic compatibility checking:

- **`registerPlugin()`** — starts at `status: 'active'`, defaulting `capabilities`/`requiredPermissions` to empty arrays. Publishes `plugin.registered`.
- **`deprecatePlugin()` / `reactivatePlugin()` / `archivePlugin()`** — guarded by `canTransitionPlugin()` (pure): `active ⇄ deprecated → archived`, `archived` terminal.
- **`checkCompatibility()`** — real, deterministic version-range matching via `shared/semver.ts`'s `satisfiesRange()`; returns `{ compatible: false, reason }` with a human-readable explanation on failure. Publishes `compatibility.checked`.

---

## Extension Sandbox

`extension-sandbox/engine.impl.ts`'s `createExtensionSandboxEngine()` implements deterministic capability/permission/isolation metadata. **No code execution anywhere in this module** — every check is a plain set-membership lookup over stored metadata, never a runtime capability grant.

- **`createSandboxProfile()`** — defaults `isolationLevel` to `'none'` and both capability/permission lists to empty.
- **`allowCapability()` / `revokeCapability()`**, **`grantPermission()` / `revokePermission()`** — idempotent list mutations.
- **`isCapabilityAllowed()`** — a real, deterministic membership check against the stored `allowedCapabilities` list.

---

## Extension Registry

`extension-registry/engine.impl.ts`'s `createExtensionRegistryEngine()` implements the extension lifecycle and composite validation, composed intra-package over the Package Registry, Plugin Registry, and Extension Sandbox.

- **`install()`** — starts at `status: 'installed'`. Throws `DuplicateExtensionKeyError` if that `key` is already installed (at any status) in the organization. Publishes `extension.installed`.
- **`enable()` / `disable()` / `uninstall()`** — guarded by `canTransitionExtension()` (pure): `installed → enabled | uninstalled`, `enabled ⇄ disabled`, either → `uninstalled`; `uninstalled` terminal. Each publishes its corresponding event.
- **`upgrade()`** — updates `currentVersion` without touching `status`; blocked only once the extension is `uninstalled`. Publishes `extension.upgraded` with both `fromVersion` and `toVersion`.
- **`validateExtension()`** — a genuine composite check, never a duplicate of any sibling module's logic:
  1. Package Registry: does a published `PackageVersion` exist for `(extension.key, extension.currentVersion)`?
  2. Plugin Registry (only if `pluginId` is set): does `checkCompatibility(pluginId, currentVersion)` report compatible?
  3. Extension Sandbox: does a `SandboxProfile` exist for this extension?

  Every failing check appends a human-readable reason; `valid` is `true` only when every check passes. Publishes `extension.validated` with the computed validity.

---

## Extension Configuration

`extension-configuration/engine.impl.ts`'s `createExtensionConfigurationEngine()` implements per-extension defaults and overrides with a minimal, hand-rolled validator — never an external JSON Schema library.

- **`validateExtensionConfig()`** (pure) — the same required/type field check used elsewhere in this monorepo; `0`, `''`, and `false` are all treated as present, never as missing.
- **`setDefault()` / `setOverride()`** — independent upserts keyed by `(extensionId, key, isOverride)`; when a `schema` is given, the payload is validated first and `ConfigValidationError` is thrown before anything is persisted. Both publish `configuration.changed`.
- **`getEffectiveConfig()`** — the override (if one exists) always wins over the default for the same `(extensionId, key)`.

---

## Extension Events

`extension-events/engine.impl.ts`'s `createExtensionEventsEngine()` implements declared event interests and compatibility checking. **This is metadata bookkeeping only** — declaring a subscription or publication never wires anything onto a live event bus.

- **`declareSubscription()` / `declarePublication()`** — record one `(extensionId, eventName, direction)` declaration each.
- **`checkEventCompatibility()`** — compares every declared event name for an extension against a caller-supplied `knownEventNames` catalog (in practice, the platform's own `MARKETPLACE_EVENT_NAMES` plus any others); unknown event names are deduplicated and reported. Publishes `compatibility.checked`.

---

## Marketplace Catalog

`marketplace-catalog/engine.impl.ts`'s `createMarketplaceCatalogEngine()` implements public catalog metadata — categories, publishers, ratings, and downloads. **Metadata only** — never a recommendation or ranking model.

- **`computeRunningAverage()`** (pure) — the standard incremental-mean formula, rounded to 2 decimal places.
- **`publishToCatalog()`** — starts at `ratingAverage: 0`, `ratingCount: 0`, `downloadCount: 0`. Publishes `catalog.updated`.
- **`recordRating()`** — validates the score is within 1–5 (`InvalidRatingError` otherwise), then applies the pure running-average formula. Publishes `catalog.updated`.
- **`recordDownload()`** — increments `downloadCount`. Publishes `catalog.updated`.

---

## Relationship Layer

`relationship-management/service.impl.ts`'s `createRelationshipManagement()` integrates all 8 required packages, each exclusively through its public API:

- **`getApiGatewayContext()`** — real API Gateway `queries.findApis()`.
- **`getAdminOrganizationContext()`** — real Admin Console `organizations.getOrganization()`.
- **`getAgentContext()`** — real AI Runtime `RuntimeQueries.findAgent()`.
- **`raiseExtensionApprovalWorkflow()`** — real Workflow Engine `defineWorkflow()` (idempotent per `(organization, requestType)`, cached) + `startWorkflow()`.
- **`getAnalyticsSnapshotContext()`** — real Analytics Engine `queries.findKPIs()`.
- **`getObservabilityHealthContext()`** — real Observability Engine `queries.findHealth()`.
- **`notifyMarketplaceEvent()`** — creates and sends a real Communication Hub `'escalation'` notification.
- **`logMarketplaceDecisionToMemory()`** — real Institutional Memory `lifecycle.create()`, logging a `'decision'`-typed, `'operational'`-category knowledge entry sourced as `'marketplace'`.

Every method degrades to a documented `null`/`[]` when its collaborator was not injected, so the Marketplace remains fully usable — and fully tested — completely offline.
