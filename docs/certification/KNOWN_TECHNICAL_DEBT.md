# Known Technical Debt — Lateen OS

> Part of Commit 35 — Enterprise Platform Certification & Stabilization. This is the single consolidated register of every unresolved item found across the seven certification dimensions. Every item here was deliberately **not** fixed in Commit 35, per the task's "apply only minimal safe fixes; document everything else" mandate. Items are ordered by priority, highest first.

## 1. Circular workspace dependency: `@lateen-os/ai-brain` ⇄ `@lateen-os/multi-agent`

- **Priority: highest.** Blocks all root-level `pnpm run build`/`typecheck`/`test`/`lint` (via `turbo`).
- **Detail**: `DEPENDENCY_AUDIT.md` F1, `ARCHITECTURE_AUDIT.md` F7, `INTEGRATION_AUDIT.md` F3, `TESTING_AUDIT.md` F1.
- **Fix**: extract the shared concept (`ai-brain`'s `Brain` interface slice `multi-agent` needs; `multi-agent`'s `MissionId` type `ai-brain` needs) downward into `shared-kernel` or a new shared identifiers module, per ADR `0003-no-cyclic-dependencies.md`. Requires a dedicated commit touching both packages.

## 2. No real static-analysis linter configured anywhere in `packages/*`

- **Priority: high** (silent — every package reports "lint passing" today, which could mask the absence).
- **Detail**: `TESTING_AUDIT.md` F3. Every package's `lint` script (38 of 39; `typescript-config` has none) is the identical no-op stub `node -e "process.exit(0)"`.
- **Fix**: introduce a real ESLint (or equivalent) configuration in its own dedicated commit, with time budgeted to triage existing violations before enabling it in CI.

## 3. `capability-engine` has no test suite

- **Priority: medium.**
- **Detail**: `TESTING_AUDIT.md` F2. Unlike `typescript-config` (no runtime code to test), `capability-engine` has real capability-definition/registration logic and zero tests.
- **Fix**: write a real test suite covering its actual exported behavior.

## 4. Nine packages integrate real siblings without a dedicated `relationship-management/` layer

- **Priority: medium** (no boundary violation found, but harder to audit).
- **Packages**: `ai-brain`, `ai-runtime`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `workflow-engine`, `multi-agent`, `institutional-memory`, `domain-graph`.
- **Detail**: `ARCHITECTURE_AUDIT.md` F4, `INTEGRATION_AUDIT.md` F1. All 9 predate the Era-2 `relationship-management/` convention; sibling calls are embedded directly in subdomain implementation files instead.
- **Fix**: extract each package's inline sibling calls into a proper `relationship-management/` module, in a refactor commit with no behavior change.

## 5. Composition-root naming inconsistency in four Era-1 packages

- **Priority: low** (cosmetic; functionally equivalent).
- **Packages**: `ai-brain` (`createBrainSystem()`), `ai-provider-hub` (`createAiProviderHub()`), `ceo-engine` (`createCEOEngine()`), `extension-system` (`createExtensionSystem()`) — all should eventually be `createXRuntime()`.
- **Detail**: `ARCHITECTURE_AUDIT.md` F1, `RUNTIME_AUDIT.md` coverage table.
- **Fix**: rename in a dedicated, consumer-audited commit (check for any existing importer of the old name first; consider a deprecated re-export during transition).

## 6. Seven unused declared dependencies

- **Priority: low.**
- **Detail**: `DEPENDENCY_AUDIT.md` F2 — `extension-system` declares unused `@lateen-os/sdk`, `@lateen-os/shared-kernel`; `sdk` declares unused `@lateen-os/ai-workforce`, `@lateen-os/business-dna`, `@lateen-os/multi-agent`, `@lateen-os/shared-kernel`, `@lateen-os/workflow-engine`.
- **Fix**: remove or replace with intended real usage, in a small `chore(deps)` commit scoped to exactly these two packages.

## 7. Documentation coverage gaps

- **Priority: low.**
- **Missing MODEL document**: `capability-engine`, `extension-system`, `kernel`, `shared-kernel`. (`ai-provider-hub` was incorrectly listed here in the original Commit 35 report — it actually has a full doc trio, including `MODEL_CATALOG.md`; corrected during the subsequent documentation sprint.)
- **Missing ARCHITECTURE.md and MODEL document**: `ceo-engine`, `sdk`, `integration-tests`.
- **Missing all three (README/ARCHITECTURE/MODEL)**: `connector-base`, `integration-contracts`, `typescript-config` — for these three specifically, the absence is likely a legitimate structural exemption (thin contract-only or tooling-only packages with no runtime model), not true debt; a maintainer should confirm this per-package before authoring anything.
- **Detail**: `ARCHITECTURE_AUDIT.md` F5.
- **Fix**: author the genuine gaps in a documentation-only commit, written after actually reading each package's real implementation (not fabricated) — out of scope for Commit 35 under the "no fabricated reports" rule.

## 8. `08_PROJECT_STATUS.md`'s "zero cyclic dependencies" claim no longer holds

- **Priority: low** (a documentation-accuracy note, not a code defect).
- **Detail**: `DEPENDENCY_AUDIT.md` F1. `docs/handbook/08_PROJECT_STATUS.md` §6/§14/§17 states "Zero cyclic dependencies... 0 recorded cycles across 30 packages" for its Phase-1 scope. Item 1 above (the `ai-brain`/`multi-agent` cycle) contradicts this under the verification method used in Commit 35 (DFS over live `package.json` data, cross-checked by `pnpm`/`turbo` themselves). Not attributed to a specific cause — no commit-history archaeology was performed to determine whether the cycle predates or postdates that document.
- **Fix**: once item 1 is resolved, either statement becomes true again without any documentation edit needed; alternatively, a maintainer could append a dated correction note to `08_PROJECT_STATUS.md` in its own commit. Commit 35 did not edit that document, per the "do not redesign unrelated packages/documents" mandate.

## Not included here (already fully resolved in Commit 35)

- The `packages/marketplace` ↔ `apps/marketplace` package-name collision (`DEPENDENCY_AUDIT.md` F3) — fixed in this commit by renaming the backend engine's npm identity to `@lateen-os/marketplace-engine`.
