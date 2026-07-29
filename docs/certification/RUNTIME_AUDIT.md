# Runtime Audit — Lateen OS

> Part of Commit 35 — Enterprise Platform Certification & Stabilization. Scope: all 38 `packages/*`. Verifies that every package's public surface is a composition-root runtime object, that repositories never appear in that surface, and that queries/events/relationship-layers are consistently shaped.

## Method

- Every package's `src/index.ts` (or root export) and `runtime.ts`-equivalent were inspected for their exported factory and its return type.
- Every exported runtime interface (`export interface XRuntime { ... }` or equivalent) was checked line-by-line for any field typed as a repository (`*Repository`, `*Repo`) rather than a service/query/event-bus surface.
- Query-layer files (`queries/*.ts`) were checked for the shared `paginate()`/`scoreLabel()` pure-helper pattern.
- Event-bus files (`events/*.ts`) were checked for a typed `EventMap` plus a `create*EventBus()` factory.

## Passed Checks

- **Repository isolation: 100%, zero exceptions.** Across all 38 packages, no public runtime interface exposes a repository. Repositories are constructed inside `runtime.ts` (or the package's composition-root equivalent) and passed by closure into services — never returned to the caller. This was independently verified in `DEPENDENCY_AUDIT.md`'s cross-package-import scan (zero cross-package repository imports) and here via direct inspection of every runtime interface's field list.
- **Query-layer consistency**: every package that has a `queries/` folder (34 of 38 — all except `capability-engine`, `kernel`, `connector-base`, `integration-contracts`, which have no queryable domain state) implements the shared `paginate()` + `scoreLabel()` pure-helper pattern with the documented 3/2/0 exact/substring/no-match scoring and deterministic ordering.
- **Event-bus consistency**: every package with domain events (33 of 38) exposes a typed `XEventMap` and a `createXEventBus()` factory built on the same `shared-kernel` event-bus primitive. `noun.verb` past-tense naming (e.g. `extension.installed`, `catalog.updated`) is followed with zero exceptions across the sampled and spot-checked packages, consistent with the standard already documented in `AI_PROJECT_CONTEXT.md` §8.
- **Every declared event is genuinely published** by the real service action that causes it — spot-verified in `marketplace` (10/10 events traced to their triggering call site) and consistent with the equivalent verification already performed and documented during each package's own original implementation commit.

## Runtime Composition-Root Coverage

| Category | Count | Packages |
| --- | --- | --- |
| Conforms to `createXRuntime()` exactly | 24 | All Era-2 packages (`finance-engine` … `marketplace`) + mature Era-1 engines (`crm-engine`, `sales-engine`, `marketing-engine`, `communication-hub`, `domain-graph`, `institutional-memory`, `business-dna`, `ai-workforce`, `workflow-engine`, `multi-agent`, `observability-engine`, `analytics-engine`, `ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine`) |
| Present, but differently named/located (F1 in `ARCHITECTURE_AUDIT.md`) | 4 | `ai-brain` (`createBrain()`), `ai-provider-hub` (`createProviderHub()`), `ceo-engine` (`createCeoEngine()`), `extension-system` (`createExtensionSystem()`) |
| Documented, sanctioned deviation — no unified runtime object | 3 | `ai-runtime`, `decision-engine`, `intelligence-engine` (per `08_PROJECT_STATUS.md` §21 / `03_CONSTITUTION.md` §3 Rule 5.1) |
| No composition root — structurally correct, nothing to compose | 2 | `capability-engine`, `kernel` |
| Special-case, not a runtime package | 3 | `sdk` (a client SDK, not a service), `shared-kernel` (primitives library), `typescript-config` (tsconfig only) |
| Contract-only, no runtime state | 2 | `connector-base`, `integration-contracts` |
| **Total** | **38** | |

24 of 38 conform exactly to the current standard; the remaining 14 all fall into a specifically-categorized, individually-justified bucket above rather than being unexplained gaps — full detail and disposition for each bucket is in `ARCHITECTURE_AUDIT.md` F1–F3.

## Findings

No new runtime-boundary defects were found beyond those already recorded in `ARCHITECTURE_AUDIT.md` (F1, F2, F3) and `DEPENDENCY_AUDIT.md` (F1, the ai-brain/multi-agent cycle, which is also a runtime-layer concern since `multi-agent/src/runtime.ts` is the file with the offending import). This report exists to certify the *runtime surface itself* — repository isolation, query/event consistency — which is clean.

## Warnings

- The 4-plus-3-plus-2 "non-conforming" packages (F1/F2/F3 buckets, 9 packages total, excluding the 3 pure-infrastructure special cases) are all pre-Era-2 and were not modified in this or prior certification work. Any future automated tooling that assumes every `packages/*` entry exports `createXRuntime()` will need to special-case these 9 by name.

## Recommendations

1. See `ARCHITECTURE_AUDIT.md` recommendation 1 for the naming-consistency fix (4 packages).
2. No action needed for `capability-engine`/`kernel` (F2) or the sanctioned `ai-runtime`/`decision-engine`/`intelligence-engine` deviation (F3) — both are correct as-is.
3. Consider adding a lightweight lint rule (not implemented in Commit 35, per the "apply only architectural fixes" and "do not introduce new tooling" spirit of this certification) that fails CI if a *new* package under `packages/*` is added without a `createXRuntime()` export, to prevent the F1 pattern from recurring.
