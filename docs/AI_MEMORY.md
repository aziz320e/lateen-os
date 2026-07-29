# AI Memory — Lateen OS

> A durable record of facts, incidents, and corrections an AI system should carry across sessions working on this repository. This is not a philosophy document (see `AI_PROJECT_CONTEXT.md` for that) — it is a list of concrete things that were true, false, discovered, or fixed, so a future session doesn't re-derive or re-break them.

## Real Incidents (What Happened, and the Fix)

1. **Package-name collision** (Commit 34/35): `packages/marketplace`'s `package.json` was named `@lateen-os/marketplace`, identical to the pre-existing `apps/marketplace` frontend. This broke `pnpm`/`turbo` workspace resolution for the entire monorepo. **Fixed** by renaming the backend engine's npm identity to `@lateen-os/marketplace-engine` (directory path unchanged). See ADR 0006.
2. **Circular dependency** (pre-existing, found in Commit 35, still unresolved): `@lateen-os/ai-brain` ⇄ `@lateen-os/multi-agent`. `ai-brain` imports the type `MissionId` from `multi-agent`; `multi-agent` imports the type `Brain` from `ai-brain` for an optional injected escalation collaborator. This blocks `turbo run <task>` at the workspace root — use `pnpm --filter <pkg> run <task>` per package instead until it's fixed. **Not fixed** — fixing it requires extracting the shared type downward (per ADR 0003), which is a real design change outside any "certification/documentation only" commit's scope. Tracked in `docs/certification/KNOWN_TECHNICAL_DEBT.md` item 1.
3. **Package-count miscount** (Commit 35, corrected in the subsequent documentation sprint): the nine Commit 35 certification reports and the first draft of `AI_PROJECT_CONTEXT.md` all stated the platform total as "38 packages." The real, verified count is **39** — `integration-tests` was tested correctly throughout Commit 35 but omitted from every prose total and from `RUNTIME_AUDIT.md`'s coverage table. All nine certification reports and `AI_PROJECT_CONTEXT.md` were corrected in place (not rewritten) with dated correction notes.
4. **Incorrect documentation-gap claim** (Commit 35, corrected in the subsequent documentation sprint): `ARCHITECTURE_AUDIT.md` and `KNOWN_TECHNICAL_DEBT.md` both incorrectly listed `ai-provider-hub` as missing a MODEL document. It actually has a complete doc trio (`README.md`, `ARCHITECTURE.md`, `MODEL_CATALOG.md`) — verified directly by listing the package's own directory. Corrected in place.

## Facts Worth Remembering (Verified, Not Obvious From a Quick Read)

- There are **39 packages** under `packages/*`, all with a real `package.json`. (`ls packages` also returns the directory's own `README.md`, which is not a package — 40 filesystem entries, 39 real packages.)
- The real doc-trio (README + ARCHITECTURE + MODEL) coverage is **29 of 39** packages — verified by direct filesystem check, not by trusting any prior report's number without re-checking.
- Real folder-presence counts (verified directly, not inferred): `queries/` in 31 of 39; `events/` in 31 of 39; `relationship-management/` in 18 of 39.
- `packages/marketplace`'s npm name is `@lateen-os/marketplace-engine`, NOT `@lateen-os/marketplace` (that name belongs to `apps/marketplace`, a different, unrelated frontend). Get this exactly right in any new documentation or code that references it.
- Every package's `lint` script (except `typescript-config`, which has none) is the identical no-op stub `node -e "process.exit(0)"` — there is no real ESLint (or equivalent) configuration anywhere in `packages/*`. "Lint passing" does not mean static analysis actually ran. Do not assume otherwise.
- `capability-engine` has real business logic (capability definition/registration) but zero tests — a genuine, disclosed gap, not a structural exemption like `typescript-config`.
- Milestone 2 (commits 26-35) is complete. Per explicit user instruction at the end of Commit 35, **no new engine is to be implemented** — any further work in this repository until told otherwise is documentation, stabilization, or targeted bugfixes only, not new business capability.

## Where the Full Detail Lives

- Architecture philosophy: `docs/AI_PROJECT_CONTEXT.md`
- Full certification evidence: `docs/certification/*.md` (9 reports)
- Per-package facts: `docs/engines/<package-name>.md`
- Architectural decisions and their rationale: `docs/adr/*.md`
- Navigation across all of the above: `docs/AI_NAVIGATION_GUIDE.md`
