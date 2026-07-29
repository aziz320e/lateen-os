# Dependency Audit — Lateen OS

> Part of Commit 35 — Enterprise Platform Certification & Stabilization. Scope: `packages/*` (39 packages). Every claim below is derived directly from the repository's `package.json` files, `pnpm`/`turbo` tool output, and `grep`-verified source imports at commit time — nothing in this report is inferred or assumed.
>
> **Correction (subsequent documentation sprint)**: this report originally stated the platform total as 38 packages; the correct count is 39 (`integration-tests` was tested but omitted from the prose totals). The DFS graph size cited below (39 nodes) was always correct — only the surrounding narrative count was wrong.

## Method

- Direct workspace dependencies were extracted from every `packages/*/package.json`'s `dependencies` field.
- The dependency graph was built programmatically (Node script over the 39 `package.json` files, including the workspace root) and searched for cycles via DFS.
- `pnpm install` and `pnpm run build` (→ `turbo run build`) were run against the real workspace and their own cycle/collision detectors cross-checked against the programmatic result.
- Declared-but-unused dependencies were found by grepping each package's `src/` tree for `from '<dependency-name>'` (including subpath imports) per declared `@lateen-os/*` dependency.

## Passed Checks

- **Circular dependencies: exactly one found, fully characterized (see Findings).** All other 37 packages sit in a strict DAG — verified three independent ways: a DFS cycle search over the full 39-node graph, `pnpm install`'s own cyclic-dependency warning, and `turbo run build`'s own cyclic-dependency error, all in full agreement.
- **Repository leakage across packages: zero.** No package imports another business package's `repository.ts`/`repository.impl.ts`. The only cross-package imports matching `*/repository*` are the sanctioned, universal use of `@lateen-os/shared-kernel/repository`'s generic `createInMemoryRepository` helper (216 files, all of them this one pattern).
- **No package imports a sibling for anything other than its public runtime surface** in the 18 packages that have a `relationship-management/` module — every collaborator dependency is typed as a narrow `Pick<SiblingRuntime, '...'>` slice, never the whole sibling runtime type.
- **No workspace `package.json` declares a dependency on a package that does not exist** in the workspace.
- **`@lateen-os/business-dna`'s `OrganizationId`** is the sole source of the tenancy type across every package that needs it — no package redefines an equivalent type independently.
- **No package declares a duplicate dependency entry** (same name listed twice, or listed in both `dependencies` and `devDependencies`).

## Findings

### F1 — Circular workspace dependency: `@lateen-os/ai-brain` ⇄ `@lateen-os/multi-agent` (real, currently blocking, pre-existing)

- `packages/ai-brain/package.json` declares a `dependencies` entry on `@lateen-os/multi-agent`.
- `packages/multi-agent/package.json` declares a `dependencies` entry on `@lateen-os/ai-brain`.
- The cycle is not a stale/leftover declaration — both sides are exercised in real source code:
  - `ai-brain/src/context/types.ts` and `ai-brain/src/shared/identifiers.ts` import the type `MissionId` from `@lateen-os/multi-agent`.
  - `multi-agent/src/runtime.ts` and `multi-agent/src/escalation/service.impl.ts` import the type `Brain` from `@lateen-os/ai-brain`, used for an optional injected escalation collaborator.
- **Empirical impact**: `pnpm install` succeeds but prints `WARN There are cyclic workspace dependencies: ... ai-brain, ... multi-agent`. `turbo run build` (the repository's own root `build`/`typecheck`/`test`/`lint` scripts) **fails immediately** with `x Cyclic dependency detected` and refuses to compute a build order for *any* package, not just these two — this is a whole-workspace blocker for anyone relying on the root `pnpm run build`/`typecheck`/`test`/`lint` scripts. Individual, per-package `tsc`/`vitest` invocations are unaffected (see `TESTING_AUDIT.md`).
- **Origin**: both packages were built in Milestone 1 (`c20ae69` "ai-brain", `6a3b523` "multi-agent"). `docs/handbook/08_PROJECT_STATUS.md` §6, §17, and its own dashboard (§14) explicitly state "Zero cyclic dependencies... verified against actual package.json dependency data" for the 30-package Phase-1 graph. That claim does not hold for the current repository state under the verification method used in this audit (DFS over live `package.json` dependency data, cross-checked by `pnpm` and `turbo` themselves). This is noted here as a documentation-accuracy discrepancy, not attributed to any specific cause — no commit history evidence was reviewed to determine whether the cycle existed at the moment `08_PROJECT_STATUS.md` was authored.
- **Disposition**: **not fixed in Commit 35.** ADR `0003-no-cyclic-dependencies.md` prescribes the correct remedy — extract the shared concept (here, the `Brain` interface slice `multi-agent` actually needs, and/or the `MissionId` type `ai-brain` actually needs) downward into a package both already depend on (`shared-kernel`, or a new shared identifiers module), then remove the direct cross-dependency. This is a real design change to two already-shipped, fully-tested Milestone-1 packages and falls outside Commit 35's explicit "do not redesign existing architecture" mandate. Tracked in `KNOWN_TECHNICAL_DEBT.md` as the platform's highest-priority open item.

### F2 — Unused declared dependencies (real, low-risk, safe-to-fix-later)

Verified by grepping each package's `src/` tree for any import (including subpath) of each declared `@lateen-os/*` dependency:

| Package | Declared dependency | Import count in `src/` |
| --- | --- | --- |
| `extension-system` | `@lateen-os/sdk` | 0 |
| `extension-system` | `@lateen-os/shared-kernel` | 0 |
| `sdk` | `@lateen-os/ai-workforce` | 0 |
| `sdk` | `@lateen-os/business-dna` | 0 |
| `sdk` | `@lateen-os/multi-agent` | 0 |
| `sdk` | `@lateen-os/shared-kernel` | 0 |
| `sdk` | `@lateen-os/workflow-engine` | 0 |

`extension-system` and `sdk` are both Milestone-1, pre-Era-2 packages (see `AI_PROJECT_CONTEXT.md` §2). Their declared dependency lists are broader than what their current `src/` trees actually import — plausibly because their public API surface changed after these dependencies were added, or because they were declared for a planned integration that was implemented differently. Not fixed in Commit 35 (removing a declared dependency from an already-shipped package's `package.json` is a real change to that package's contract, outside this commit's minimal-fix mandate); tracked in `KNOWN_TECHNICAL_DEBT.md`.

### F3 — Package-name collision, found and fixed during this audit

`packages/marketplace/package.json` declared `"name": "@lateen-os/marketplace"`, identical to the pre-existing `apps/marketplace/package.json` (`@lateen-os/marketplace` — the Next.js extension-distribution frontend, unrelated to the backend engine built in Commit 34). This is a real, verified collision across the entire workspace (`packages/`, `apps/`, `services/`, `workflows/`, `extensions/` — checked exhaustively; it was the *only* name collision found anywhere in the workspace) and it broke `pnpm`/`turbo` workspace resolution outright: `turbo run build` failed before doing any work at all, with `Failed to add workspace "@lateen-os/marketplace" from "packages\marketplace\package.json", it already exists at "apps\marketplace\package.json"`.

**Fixed in this commit** (minimal, safe, non-behavioral): renamed the backend engine's package identity to `@lateen-os/marketplace-engine` in `packages/marketplace/package.json` and updated the two documentation files (`README.md`, `ARCHITECTURE.md`) that referenced the old name. The directory path (`packages/marketplace`) was left unchanged. No other package in the workspace declared a dependency on `@lateen-os/marketplace`, so no consumer needed updating. Verified by re-running `pnpm install` (clean, only the pre-existing `ai-brain`/`multi-agent` warning remains) and `pnpm run build`.

### F4 — Dependency fan-in/fan-out (informational, not a defect)

`shared-kernel` and `business-dna` remain the platform's highest-centrality packages (0 and 1 outbound `@lateen-os/*` dependency respectively; the largest fan-in of any package in the graph). `analytics-engine` remains the widest single consumer (15 declared `@lateen-os/*` dependencies). These figures are consistent with, and an extension of, the dependency-centrality analysis already published in `docs/handbook/08_PROJECT_STATUS.md` §17 for the Phase-1 subset of packages; Commit 35 did not recompute a full updated centrality table for all 39 packages, since doing so is descriptive, not a certification finding.

## Warnings

- The unresolved `ai-brain` ⇄ `multi-agent` cycle (F1) will continue to block `pnpm run build` / `pnpm run typecheck` / `pnpm run test` / `pnpm run lint` at the workspace-root level (via `turbo run <task>`) until it is deliberately broken in its own dedicated commit. Anyone relying on the root scripts should use per-package `pnpm --filter <pkg> run <task>` or a direct `npx tsc` / `npx vitest run` inside the package directory in the meantime — this is exactly how Commit 35's own `TESTING_AUDIT.md` results were produced.
- `apps/marketplace` (frontend) and `packages/marketplace` (backend engine, now `@lateen-os/marketplace-engine`) share a *directory basename* (`marketplace`) but no longer share a package *name*. This is intentional and matches the existing precedent of `services/marketplace` (`@lateen-os/marketplace-service`) and `services/api-gateway` (`@lateen-os/api-gateway-service`) — each surface of the same product concept gets its own package identity.

## Recommendations

1. Schedule a dedicated commit to break the `ai-brain` ⇄ `multi-agent` cycle per ADR 0003's prescribed remedy (extract `Brain`/`MissionId` downward) before any further work depends on `pnpm run build` at the workspace root.
2. Remove the seven unused dependency declarations in F2, or replace them with the intended real usage, in a small, isolated `chore(deps)` commit scoped to exactly `extension-system` and `sdk`.
3. Add a pre-flight check (a short script, or a `turbo` task) that greps every workspace `package.json` for duplicate `name` values before a new package is scaffolded, to prevent a recurrence of F3.
