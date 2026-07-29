# ADR 0006: Workspace Package Naming Discipline

## Status

Accepted

## Context

The workspace has five package roots — `packages/`, `apps/`, `services/`, `workflows/`, `extensions/` — and `pnpm`/`turbo` resolve packages by their `package.json` `name` field, not by directory path. Two workspace packages sharing the same `name` breaks resolution for the *entire monorepo*, not just the offending package. This happened for real in Commit 34: `packages/marketplace` (the new backend engine) was named `@lateen-os/marketplace`, colliding with the pre-existing `apps/marketplace` (the extension-distribution frontend). `turbo run build` failed immediately with `Failed to add workspace "@lateen-os/marketplace" ... it already exists at "apps\marketplace\package.json"`, blocking every package's build, not just the two involved.

## Decision

Before naming any new workspace package, every one of the five workspace roots must be checked for the exact proposed `name` — not just the root the new package lives under. A package's npm `name` is allowed to differ from its directory path when a directory-name collision exists across roots but the underlying concepts are genuinely distinct (e.g. `packages/marketplace`, the backend engine, is named `@lateen-os/marketplace-engine`, while `apps/marketplace`, the frontend, keeps `@lateen-os/marketplace`; `services/marketplace` similarly disambiguates as `@lateen-os/marketplace-service`). The directory path is not renamed to match — only the npm identity changes, since the directory path carries no resolution semantics for `pnpm`/`turbo`.

## Consequences

- A one-line grep across all five roots (`packages/*/package.json`, `apps/*/package.json`, `services/*/package.json`, `workflows/*/package.json`, `extensions/*/package.json`) for a candidate name is now a mandatory step before scaffolding a new package — documented in `docs/handbook/07_DEVELOPER_GUIDE.md` and `docs/AI_PROJECT_CONTEXT.md` §4, rule 2b.
- Multiple workspace roots may legitimately share the same *directory basename* (`marketplace` appears under `packages/`, `apps/`, and `services/`) as long as their npm `name` fields are all distinct — directory basename reuse across roots is not itself a problem; `package.json` name reuse is.
- This ADR does not retroactively rename any other existing package; it only fixes the one real incident found (`packages/marketplace` → `@lateen-os/marketplace-engine`, Commit 35) and establishes the check going forward.
