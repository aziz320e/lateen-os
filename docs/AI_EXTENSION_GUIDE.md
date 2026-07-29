# AI Extension Guide — Lateen OS

> A practical checklist for an AI system asked to extend Lateen OS. This is the actionable companion to `AI_PROJECT_CONTEXT.md` §10 — read that section first for the full reasoning; this file is the checklist you actually follow step by step.
>
> **Before using this guide at all**: confirm the user is actually asking for new engine/feature work. As of Commit 35, Milestone 2 is complete and the explicit instruction was "do NOT implement any new engine" until told otherwise. If you're not sure whether this instruction still applies, ask rather than assume.

## Checklist: Adding a New Business-Capability Package

- [ ] **1. Read the philosophy first.** `docs/AI_PROJECT_CONTEXT.md` in full, then one recent Era-2 package end to end (e.g. `packages/finance-engine` or `packages/admin-console`) as your structural template — not an Era-1 package, which varies more.
- [ ] **2. Check the name across all five workspace roots.** Grep `package.json` `name` fields under `packages/`, `apps/`, `services/`, `workflows/`, `extensions/` for your proposed npm name before scaffolding anything. See ADR 0006 and the real `@lateen-os/marketplace` collision incident.
- [ ] **3. Scaffold the standard shape.** `shared/`, `events/`, one folder per subdomain (`types.ts`/`repository.ts`/`repository.impl.ts`/`engine.impl.ts`/`index.ts`), `relationship-management/` (only if you genuinely integrate with siblings), `queries/`, `runtime.ts`, `index.ts`.
- [ ] **4. Build the repository layer on `shared-kernel`.** Use `@lateen-os/shared-kernel/repository`'s `createInMemoryRepository()` rather than hand-rolling a `Map`-backed store (see ADR 0004). Every read/write is organization-scoped.
- [ ] **5. Integrate with siblings only through their public runtime API.** Never import another package's `repository.ts`/`repository.impl.ts`. Type each collaborator as narrowly as possible (`Pick<SiblingRuntime, 'onlyWhatYouCall'>`, see ADR 0005). Every collaborator is optional and degrades to `null`/`[]`.
- [ ] **6. Make everything deterministic.** Every factory that needs "now" takes an injectable `now: () => string`. Every function that needs randomness (IDs, tokens, keys) takes an injectable randomness source, defaulting to real `node:crypto` primitives (see ADR 0007). Never `Math.random()`, never an uninjected `Date.now()` inside business logic.
- [ ] **7. Write real tests, no mocking libraries.** Use real sibling runtimes for integration coverage; hand-built literal objects matching a `Pick<>` shape only for narrow unit isolation.
- [ ] **8. Validate in strict order.** Build → typecheck → tests → lint. Stop and understand any failure before proceeding.
- [ ] **9. Write the doc trio.** `README.md`, `ARCHITECTURE.md`, a `*_MODEL.md` — written from what you actually built, never fabricated ahead of the implementation.
- [ ] **10. One commit per package/feature.** Never mix unrelated packages in one commit. Never rewrite history. Never force-push.

## Common Mistakes Seen in This Repository (Learn From Them)

- **Don't skip the five-root name check.** This caused a real, whole-monorepo-breaking incident (`packages/marketplace` vs `apps/marketplace`, Commit 34/35).
- **Don't force a `relationship-management/` folder where there's no real integration**, and don't skip it where there genuinely is one — 9 packages currently lack it despite real sibling calls, which is documented technical debt, not a pattern to imitate.
- **Don't force a unified `createXRuntime()` onto a package that was deliberately designed without one** (`ai-runtime`, `decision-engine`, `intelligence-engine` — a documented, sanctioned deviation, not a gap to "fix").
- **Don't introduce a circular dependency.** If package B needs a type from package A and A needs one from B, extract the shared concept downward (usually into `shared-kernel`) instead — this is exactly the fix still owed for the one real cycle on the platform today (`ai-brain` ⇄ `multi-agent`).
- **Don't fabricate documentation ahead of implementation.** Every doc in this repository is expected to describe what was actually built, verified by reading the real source — not what was planned or hoped for.

## Where This Guide Doesn't Cover

Modifying an *existing* package's behavior, fixing a bug, or doing documentation-only work each have their own norms — see `docs/handbook/07_DEVELOPER_GUIDE.md` and CLAUDE.md at the repository root for the general engineering rules that apply regardless of what kind of change you're making.
