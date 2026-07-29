# Architecture Audit — Lateen OS

> Part of Commit 35 — Enterprise Platform Certification & Stabilization. Scope: all 39 `packages/*`. Findings are derived from direct inspection of each package's folder structure, `runtime.ts` (or equivalent), `package.json`, and source imports — cross-referenced against `docs/handbook/03_CONSTITUTION.md` (line 139, the canonical structure rule) and `docs/AI_PROJECT_CONTEXT.md`.
>
> **Correction (subsequent documentation sprint)**: this report originally stated the platform total as 38 packages; the correct count is 39 (`integration-tests` was omitted from the prose totals, though it was tested correctly in Commit 35). It also named three composition-root factories incorrectly: `ai-brain`'s real aggregating root is `createBrainSystem()` (not `createBrain()`, which is a real but narrower inner primitive requiring mandatory dependencies), `ai-provider-hub`'s is `createAiProviderHub()` (not `createProviderHub()`), and `ceo-engine`'s is `createCEOEngine()` (capitalized "CEO", not `createCeoEngine()`). All three corrected below.

## Method

- Every `packages/*/src` tree was enumerated for the canonical folder set (`shared/`, `events/`, one folder per subdomain, `queries/`, `relationship-management/`, `runtime.ts`, `index.ts`).
- Every `runtime.ts` (or its equivalent) was inspected for its exported factory name and return shape.
- Cross-package imports were greped to confirm every sibling integration goes through a public runtime/query surface, never a repository.

## Passed Checks

- **26 of 39 packages** (all Era-2 packages plus most of the mature Era-1 engines — `crm-engine`, `sales-engine`, `marketing-engine`, `finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine`, `communication-hub`, `domain-graph`, `institutional-memory`, `business-dna`, `ai-workforce`'s query/event layers, `admin-console`, `marketplace`, `api-gateway`, and others) follow the `03_CONSTITUTION.md` line-139 structure exactly: `shared/`, `events/`, one folder per subdomain (`types.ts`/`repository.ts`/`repository.impl.ts`/`engine.impl.ts` or `service.impl.ts`/`index.ts`), `queries/`, `runtime.ts`.
- **Zero repository leakage** through any package's public runtime type — confirmed for every package with a `runtime.ts` (see `DEPENDENCY_AUDIT.md` for method).
- **Zero dynamic, untyped cross-package invocation** — the one deliberate exception, the API Gateway's Runtime Dispatcher, resolves sibling handlers through a compile-time-checked registry, not `any`-typed reflection or string-based dynamic dispatch.
- **Deterministic design is upheld platform-wide**: every `create*` factory that needs time takes an injectable `now()`; no package was found calling `Date.now()`/`new Date()` directly inside business logic (only inside default-parameter fallbacks, which is the documented, injectable pattern); no package uses `Math.random()` for identifiers (IDs are either caller-supplied, counter-based, or — in `marketplace`'s package-registry signature — a real SHA-256 digest via Node's `crypto`).
- **No package contains an LLM/AI-inference call inside its business logic** — this boundary (business engines vs. the reasoning stack) is intact everywhere checked.

## Findings

### F1 — Composition-root naming/location inconsistencies (real, cosmetic, not a functional defect)

Not every package's composition root is named `createXRuntime()` in `runtime.ts` at the root of `src/`. Four Era-1 packages use a differently-named or differently-located single entry point that serves the same purpose:

| Package | Actual composition root |
| --- | --- |
| `ai-brain` | `createBrainSystem()` |
| `ai-provider-hub` | `createAiProviderHub()` |
| `ceo-engine` | `createCEOEngine()` |
| `extension-system` | `createExtensionSystem()` |

Each of these still returns a single object aggregating that package's services/queries/events — functionally equivalent to the Era-2 `createXRuntime()` convention — just under an earlier naming convention predating the Era-2 standardization documented in `AI_PROJECT_CONTEXT.md` §2. **Not renamed in Commit 35** (a rename of a public factory function is a breaking API change for any consumer already importing it, outside this commit's "minimal safe fixes only" mandate). Recorded here and in `KNOWN_TECHNICAL_DEBT.md` as a naming-consistency item for a future, dedicated (and properly consumer-checked) commit.

### F2 — Two packages have no composition root at all (real, and correctly so)

`capability-engine` and `kernel` have no `runtime.ts` / `createXRuntime()`-equivalent. Both were inspected directly:

- `kernel` exports low-level primitives consumed at build/type level by other packages (not a runtime service with state/collaborators to compose) — a composition root would have nothing to wire.
- `capability-engine` exports a capability-definition/registration API without injected collaborators or repositories — again, nothing to compose.

**Disposition**: not a defect. Both are foundational, Era-1 platform-support packages (see `AI_PROJECT_CONTEXT.md` §2) whose responsibilities never required a runtime composition root in the first place. Listed in `RUNTIME_AUDIT.md` as legitimate structural exceptions, not gaps.

### F3 — Three packages have a documented, sanctioned deviation from the Runtime convention

`ai-runtime`, `decision-engine`, and `intelligence-engine` do not expose a single `createXRuntime()` aggregating all their services. This is not a newly-discovered issue — it is already explicitly documented and sanctioned in `docs/handbook/08_PROJECT_STATUS.md` §21, citing `03_CONSTITUTION.md` §3/Rule 5.1. Commit 35 re-verified the deviation is still accurate (the three packages' current `src/` trees still lack a unified runtime object) and did **not** attempt to force a Runtime wrapper onto them, per `AI_PROJECT_CONTEXT.md` §2's explicit instruction not to "fix" this. Every sibling package that integrates with `ai-runtime` does so via the documented `Pick<RuntimeQueries, 'findAgent'>` narrow-typing pattern (verified in `marketplace`, `admin-console`, and others' `relationship-management/`).

### F4 — `relationship-management/` folder absent in nine packages with real cross-package dependencies

A folder-presence scan across the 32 packages named in the Enterprise Certification scope found that 18 have a `relationship-management/` folder and 14 do not. Of those 14, 9 declare and genuinely use real `@lateen-os/*` sibling dependencies in source (verified against `package.json` `dependencies` beyond `shared-kernel`/type-only `business-dna` reuse):

`ai-brain`, `ai-runtime`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `workflow-engine`, `multi-agent`, `institutional-memory`, `domain-graph`.

In every one of these 9, the sibling calls are made directly from within a subdomain's own `*.impl.ts` file (or, in `ai-workforce`'s case, from a `collaboration/` module using a different name for the same purpose) instead of being centralized behind a narrow, named Relationship Layer. All 9 are Era-1 packages that predate the `relationship-management/` convention — the convention appears consistently only in the 18 mature/later Era-1 business-and-platform engines (`crm-engine` through `ai-compliance-engine`) and all Era-2 packages. This is architecturally inconsistent but **not a boundary violation**: every sibling call in all 9 packages still goes through that sibling's own public runtime/query API, never a repository (re-confirmed for this finding specifically, not just inferred from the general repository-leakage scan). The remaining 5 of the 14 non-`relationship-management` packages in the 32-package scope (`shared-kernel`, `sdk`, `ai-provider-hub`, `ceo-engine`, `business-dna`) correctly have no such folder because they have no real sibling dependency beyond `shared-kernel` (foundational/leaf packages) or, in `sdk`'s case, are a client aggregator rather than a peer with its own integration surface.

All 18 packages that do have a `relationship-management/` folder were verified to type every collaborator as a narrow `Pick<SiblingRuntime, '...'>` slice in their `relationship-management/types.ts` — 18 of 18, zero exceptions.

**Not restructured in Commit 35** (moving integration code into a new folder is a real refactor of nine already-shipped packages, outside "apply only minimal safe fixes"). Tracked in `KNOWN_TECHNICAL_DEBT.md`. See `INTEGRATION_AUDIT.md` for the full per-package integration-surface validation across all 32 named packages.

### F5 — Documentation coverage gaps (see also the Documentation section of `PLATFORM_CERTIFICATION.md`)

| Package | Missing |
| --- | --- |
| `capability-engine`, `extension-system`, `kernel`, `shared-kernel` | MODEL document |
| `ceo-engine`, `sdk`, `integration-tests` | ARCHITECTURE.md and MODEL document |
| `connector-base`, `integration-contracts`, `typescript-config` | All three (README/ARCHITECTURE/MODEL) |

For `typescript-config` (a pure shared `tsconfig.json` package with no runtime source at all) and `connector-base`/`integration-contracts` (thin, stable contract-only packages), the absence is a legitimate structural exemption, not a gap — there is no runtime model to document. The remaining entries are genuine documentation debt. Per the task's explicit instruction not to fabricate net-new documentation under time pressure for packages not built in this commit, **no new README/ARCHITECTURE/MODEL files were authored in Commit 35** for these packages; this finding is recorded factually in `KNOWN_TECHNICAL_DEBT.md` instead.

### F6 — The "Two Eras" construction pattern (informational, confirms platform coherence)

Every package built under the sequential "Commit N: implement real X" Era-2 convention (`finance-engine` through `marketplace`) follows an identical, byte-for-byte-consistent structural template — verified across all 11 Era-2 packages. Era-1 packages (`ai-brain`, `ai-provider-hub`, `ceo-engine`, `extension-system`, `capability-engine`, `kernel`, `connector-base`, `integration-contracts`, `typescript-config`, and the reasoning-stack packages) predate this convention and reasonably vary from it (F1–F5 above). This is expected platform evolution, not drift — the convention was intentionally introduced partway through the project's history, and every package built since has conformed to it exactly.

### F7 — The one pre-existing circular dependency is also an architecture-boundary issue

`ai-brain` ⇄ `multi-agent` (full detail in `DEPENDENCY_AUDIT.md` F1) is, in addition to being a dependency-graph defect, an architecture-boundary defect: two packages each importing a type from the other means neither can be said to strictly depend "downward" on the other in a layered sense. Same disposition as `DEPENDENCY_AUDIT.md`: documented, not fixed, tracked as the platform's top technical-debt item.

## Warnings

- If any future package adopts F1's naming pattern (a bespoke `createX()` instead of `createXRuntime()`), the deviation will compound rather than resolve. `AI_PROJECT_CONTEXT.md` §10 ("How to Safely Extend Lateen OS") directs new packages to use `createXRuntime()` exclusively.
- F4's pattern (sibling calls embedded directly in subdomain logic rather than centralized in `relationship-management/`) makes it harder to audit a package's full integration surface at a glance. New packages should not replicate this pattern.

## Recommendations

1. In a dedicated, consumer-audited commit, rename the four F1 composition roots to `createXRuntime()` (with the old export kept as a deprecated alias for one release if any consumer is found).
2. In a dedicated refactor commit, extract the F4 packages' inline sibling calls into a proper `relationship-management/` module each, without changing behavior.
3. Author the F5 genuine documentation gaps (`capability-engine`, `extension-system`, `kernel`, `shared-kernel`, `ceo-engine`, `sdk`, `integration-tests`) in a documentation-only commit, written by someone (or an AI session) with time to read each package's actual implementation in full first.
4. See `DEPENDENCY_AUDIT.md` recommendation 1 for the F7 cycle.
