# ADR 0005: Relationship Layer — Narrow `Pick<>` Typing for Sibling Integration

## Status

Accepted

## Context

Packages routinely need to call a sibling package for real cross-domain behavior (e.g. Marketplace notifying Communication Hub, or Admin Console reading an Analytics Engine KPI snapshot). The naive approach — injecting a sibling's entire `XRuntime` type as a dependency — creates two problems: it couples a consumer to every method the sibling happens to expose (including ones it never calls), and it makes a package's real integration surface impossible to audit at a glance (a `SiblingRuntime` field reveals nothing about which of that runtime's dozens of methods are actually used).

## Decision

Every package that integrates with siblings does so through a dedicated `relationship-management/` module, with one method per collaborator (e.g. `getCustomerContext()`, `notifyAdminEvent()`, `logMarketplaceDecisionToMemory()`). Each collaborator dependency is typed as narrowly as possible: `Pick<SiblingRuntime, 'onlyTheMethodsActuallyCalled'>` — never the sibling's whole Runtime type. Where a sibling has no single unified Runtime (only `ai-runtime`, among current integration targets, per its documented deviation), the dependency is typed directly against that sibling's own query-port type instead (`Pick<RuntimeQueries, 'findAgent'>`) — a documented, repeated special case verified across every package that talks to AI Runtime.

Every collaborator is optional and degrades to a documented no-op (`null` for a single-entity lookup, `[]` for a list) when not injected — this is what keeps every package's test suite runnable fully offline, exercising real degrade paths directly rather than mocking an absent dependency.

## Consequences

- A package's `relationship-management/types.ts` file is a complete, self-documenting inventory of every sibling method it actually calls — no need to read the sibling's full source to know the real integration surface.
- Changing an unrelated method on a sibling's Runtime type can never silently break a consumer that was never injecting it, since the consumer's dependency type only names the methods it uses.
- This pattern requires slightly more boilerplate per collaborator (one `Pick<>` type per integration point) than injecting a whole Runtime — accepted as the correct trade-off for auditability, verified in `docs/certification/INTEGRATION_AUDIT.md` (18 of 39 packages currently have this module, with zero deviations from the narrow-typing rule among them).
