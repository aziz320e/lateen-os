# AI Project Context — Lateen OS

> **Canonical context document for AI systems working on this repository.** If you are an AI agent about to read, modify, or extend Lateen OS, read this document in full before touching any code. It is the single source of truth for *how this platform is built and how it must continue to be built*. Where this document and a specific package's own `ARCHITECTURE.md` disagree on a factual detail, trust the package's own doc for that package's internals — but the philosophy and rules below still apply to it.
>
> This document is part of **Commit 35 — Enterprise Platform Certification & Stabilization**, the final commit of Milestone 2. It complements, and does not replace, `docs/handbook/00_MASTER_PLAN.md` through `09_COMMIT_HISTORY.md` (the Phase 1 / Milestone 1 record, frozen at commit `d9616a0`) and the certification reports in `docs/certification/`.

---

## 1. What Lateen OS Is

Lateen OS is an **AI-native business operating system** — not a single application, but a layered platform of independent, real, deterministic TypeScript packages that together model an entire enterprise: its business DNA, its institutional memory, its reasoning, its decisions, its digital workforce, and its business-domain operations (CRM, sales, marketing, finance, HR, inventory, projects, customer success, documents), wrapped in a trust layer (security, governance, compliance) and an operational layer (analytics, observability), and finally exposed to the outside world through an API Gateway, administered through an Admin Console, and extensible through a Marketplace.

The founding principle, stated in `docs/handbook/00_MASTER_PLAN.md`: **AI produces recommendations; the Decision Engine is the only party authorized to turn a recommendation into an executed decision.** This separation of "thinking" from "deciding" is what makes the platform auditable, governable, and compliant at an enterprise level. Every package in this repository either implements a piece of that pipeline or supports it.

## 2. Two Eras of Package Construction

The repository's packages were built in two distinct eras, and the eras use two distinct (both intentional, both valid) architectural patterns. Recognizing which era a package belongs to prevents an AI from "fixing" something that only *looks* inconsistent.

### Era 1 — Foundation (commits `ea48fe6` → `d9616a0`, Milestone 1 / Phase 1)

`shared-kernel`, `ai-provider-hub`, `ai-runtime`, `ai-brain`, `ceo-engine`, `workflow-engine`, `multi-agent`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `business-dna`, `institutional-memory`, `domain-graph`, `crm-engine`, `sales-engine`, `marketing-engine`, `communication-hub`, `ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine`, `analytics-engine`, `observability-engine`, `sdk` — plus the platform-support packages `capability-engine`, `kernel`, `extension-system`, `connector-base`, `integration-contracts`, `typescript-config`, `integration-tests`.

This era established `shared-kernel` as the dependency-free foundation, `business-dna` as the single canonical business model, and the reasoning stack (`decision-engine` → `intelligence-engine` → `ai-runtime` → `ai-brain` → `ceo-engine`). It converged on the `createXRuntime()` composition-root pattern for most packages, but **three packages deliberately do not follow it** — `ai-runtime`, `decision-engine`, `intelligence-engine` expose module-level factories (`createReasoner`, `createScorer`, `createConversationRuntimeService`, ...) plus a unified query layer, instead of one Runtime object. This is documented in `docs/handbook/08_PROJECT_STATUS.md` §21 as an intentional deviation from Constitution Rule (`03_CONSTITUTION.md` §3): these three packages are meant to be partially composed by a consumer (chiefly `ai-brain`), not instantiated as one monolith. **Do not "fix" this by forcing a Runtime wrapper onto them** — see `docs/certification/ARCHITECTURE_AUDIT.md` for the full analysis.

The Era-1 platform-support packages (`capability-engine`, `kernel`, `extension-system`, `connector-base`, `integration-contracts`) predate the `relationship-management/` + `queries/` + `runtime.ts` + 3-document convention entirely. They are real, working, tested (to varying degrees) code, but their internal shape does not match the Era-2 convention below. Do not retrofit them without a dedicated, scoped commit — see `KNOWN_TECHNICAL_DEBT.md`.

### Era 2 — Business Capability & Platform Rollout (Milestone 2, commits documented per-package in each package's own git history)

`finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine`, `api-gateway`, `admin-console`, `marketplace` (the backend engine at `packages/marketplace`, npm name `@lateen-os/marketplace-engine`) — plus, stylistically, the trust-layer and horizontal packages built just before them (`ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine`, `analytics-engine`, `observability-engine`) which already followed this shape.

Every Era-2 package follows **one rigid, repeated construction pattern**, described in full in §7 below. This is the pattern you must follow for any new package.

## 3. The Complete Package Map (as of Commit 35)

39 packages under `packages/*` (38 with their own `package.json` plus this repo's `README.md`). Grouped by role:

| Layer | Packages |
| --- | --- |
| Foundation | `shared-kernel` |
| LLM abstraction | `ai-provider-hub` |
| Reasoning stack | `decision-engine`, `intelligence-engine`, `ai-runtime`, `ai-brain`, `ceo-engine` |
| Coordination / digital labor | `workflow-engine`, `multi-agent`, `ai-workforce` |
| Domain infrastructure | `business-dna`, `institutional-memory`, `domain-graph`, `capability-engine` |
| Business engines | `crm-engine`, `sales-engine`, `marketing-engine`, `communication-hub`, `finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine` |
| Trust layer | `ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine` |
| Horizontal / operational | `analytics-engine`, `observability-engine` |
| Platform surface | `api-gateway`, `admin-console`, `marketplace` (`@lateen-os/marketplace-engine`) |
| Developer surface / platform infra | `sdk`, `kernel`, `extension-system`, `connector-base`, `integration-contracts`, `typescript-config`, `integration-tests` |

Outside `packages/*`, the workspace also contains `apps/*` (Next.js frontends, including a separate `apps/marketplace` — the **extension distribution UI**, distinct from `packages/marketplace`, the **backend engine**; they were namespace-colliding until Commit 35, see §9), `services/*` (deployable service wrappers, e.g. `@lateen-os/marketplace-service`, `@lateen-os/api-gateway-service`), `workflows/*`, and `extensions/*` (real third-party connector integrations: Slack, Stripe, Shopify, etc.). **These are out of scope for the `packages/*` engine-construction discipline described in this document** — they are consumers, not engines.

## 4. Non-Negotiable Rules (apply to every package, both eras)

1. **Never introduce a circular workspace dependency.** ADR `0003-no-cyclic-dependencies.md` prohibits this without exception; Turbo's build graph depends on a strict DAG. One violation exists today (`ai-brain` ⇄ `multi-agent`) — it predates Milestone 2, it is documented in full in `docs/certification/DEPENDENCY_AUDIT.md`, and it is **not** to be silently "fixed" by an unrelated commit; breaking it requires a dedicated, reviewed commit that extracts the shared type (`Brain`, `MissionId`) downward, per the ADR's own prescribed remedy.
2. **Never give two workspace packages the same `name` in `package.json`.** This breaks `pnpm`/`turbo` workspace resolution for the *entire monorepo*, not just the offending package. Before naming a new `packages/*` engine, check `apps/*` and `services/*` for a same-named package — see §9 for the real incident this caused.
2b. **Never invent a name collision fix without checking every workspace root** (`packages/`, `apps/`, `services/`, `workflows/`, `extensions/`) — a name is only safe once confirmed unique across all five.
3. **Repositories are never part of a package's public runtime surface.** Every repository lives behind a `Repository` port interface, is constructed only inside that package's own `runtime.ts`, and is injected into services — never returned from `createXRuntime()`, never imported by another package.
4. **Cross-package integration happens only through a sibling's public runtime API** — its `createXRuntime()` return value (or documented equivalent), never a repository, never an internal module. A package never imports another package's `repository.ts` / `repository.impl.ts`.
5. **No package may modify another package to accommodate itself.** If package B needs something from package A that A doesn't expose, B either adapts to what A already exposes publicly, or the change to A is proposed and made through A's own commit/ownership — never smuggled into an unrelated package's commit.
6. **Determinism first.** Every `create*` factory that has a notion of "now" accepts an injectable `now: () => string` defaulting to a real ISO-timestamp function. No hidden randomness beyond real, intentional ID generation (`crypto.randomUUID()`, `crypto.randomBytes()`) — never a source of behavioral non-determinism in business logic itself. No LLM/AI inference inside a business-capability engine; where "AI" appears in a package name (`ai-runtime`, `ai-brain`, `ai-security-engine`, ...), read each package's own docs for the exact, narrow boundary of what is genuinely non-deterministic (typically isolated to `ai-provider-hub`'s real external adapters) versus what is fixed arithmetic/logic dressed in an AI-sounding name.
7. **No placeholders, no `TODO`/`FIXME`, no mocked implementations, no stub error paths.** This has held since Milestone 1 and was re-verified in Commit 35 (zero `TODO`/`FIXME`/`XXX` markers across the entire `packages/*` source tree).
8. **`shared-kernel` is the only package every other package may treat as free.** Reach for `@lateen-os/shared-kernel/{core,identity,time,audit,common,events,repository}` before inventing a local equivalent of `Entity`, `Identifier`, `Timestamp`, `AuditInfo`, `Money`/`CurrencyCode`, `EventBus`, or `InMemoryRepository`.
9. **`business-dna` is the only source of `OrganizationId`.** Every package imports the type from `@lateen-os/business-dna` (a type-only reuse, since `OrganizationId` is a plain string alias, not nominally branded) rather than redefining tenancy.

## 5. Composition Root Philosophy

A composition root (`runtime.ts`'s `createXRuntime(deps = {})`, or the Era-1 equivalents) is the **only** place in a package where:

- Every repository is constructed.
- Every internal engine/service is wired together with its dependencies (repositories, the event bus, `now()`, and — critically — any injected sibling-package slices for the Relationship Layer).
- The final public surface object is assembled and returned.

Nothing above the composition root (a consuming package, a test, an application) is allowed to construct a repository directly, or to reach into one engine's internals to hand it to another engine outside of the composition root's own wiring. This is what keeps every package's internal module graph private and its public surface small and stable.

**Every `create*` dependency is optional and every optional sibling collaborator degrades to a documented no-op** (`null` for a single-entity lookup, `[]` for a list) when not injected. This is what makes every package's test suite runnable completely offline, with zero mocking libraries — real degrade paths are exercised directly, and real sibling packages are wired in for genuine integration tests.

## 6. The Relationship Layer Philosophy

A `relationship-management/` module (present in 18 of the 38 packages — the ones that genuinely integrate with siblings) is the **single, centralized, exhaustive list of every sibling integration a package performs**, with exactly one method per collaborator, e.g. `getCustomerContext()` for CRM Engine, `notifyAdminEvent()` for Communication Hub, `logMarketplaceDecisionToMemory()` for Institutional Memory. Each method:

- Takes only the plain data it needs (usually `organizationId` plus a small input object), never a whole aggregate from the sibling.
- Calls exactly one named, public method on the injected sibling slice — never dynamic property access, never reflection, never a generically-typed "invoke by string" mechanism (the one deliberate exception, `api-gateway`'s Runtime Dispatcher, still resolves through a fixed, exhaustive, compile-time-checked lookup table into this same Relationship Layer — see `packages/api-gateway/GATEWAY_MODEL.md`).
- Returns `null`/`[]` when that one collaborator was not injected.

A package's `RelationshipManagementDeps` interface types each collaborator slice as narrowly as possible — `Pick<SiblingRuntime, 'onlyTheMethodsActuallyCalled'>` — never the sibling's whole Runtime type. Where a sibling has no single Runtime type (only `ai-runtime`, among Era-2's integration targets), the dependency is typed directly against that sibling's own query-port type (`Pick<RuntimeQueries, 'findAgent'>`), a documented, repeated special case across every Era-2 package that talks to AI Runtime.

## 7. The Query Layer Philosophy

A `queries/` module (present in 35 of 38 packages) is a real, deterministic, read-only CQRS port over the package's *own* repositories (never a sibling's). It never mutates state. Its methods are named `findX(query): Promise<{ x: readonly X[], total: number }>` for collections, composing two small pure helpers repeated verbatim across every package that has one:

- `paginate(items, offset?, limit?)` — a plain array slice.
- `scoreLabel(label, keyword)` — exact match scores `3`, substring match scores `2`, no match scores `0` — used by every package's `searchX()` method, sorted by score descending then `id` ascending for a fully deterministic result order. **Never a fuzzy-match library, never a ranking model.**

## 8. The Typed Event Bus Philosophy

Every package with domain events (35 of 38) builds its event bus on `shared-kernel`'s generic `createEventBus<TEventMap>()`, wrapped in a package-specific `create<X>EventBus()` and a `type <X>EventMap = { 'noun.verb': { ...payload } }` map. Event names are always `noun.verb` (past tense), e.g. `extension.installed`, `settings.updated`, `compatibility.checked`. **Every event actually declared in the map is genuinely published by the real code path that causes it** — there are no aspirational/unused event declarations anywhere in the codebase (verified in Commit 35).

## 9. Real Incidents Fixed During Commit 35

- **Package-name collision**: `packages/marketplace`'s `package.json` was named `@lateen-os/marketplace`, identical to the pre-existing `apps/marketplace` (the extension-distribution frontend). This broke `pnpm`/`turbo` workspace resolution for the entire monorepo (`Failed to add workspace "@lateen-os/marketplace" ... it already exists`). Fixed by renaming the backend engine's package name to `@lateen-os/marketplace-engine` (directory path `packages/marketplace` unchanged; nothing else in the workspace depended on the old name). See `DEPENDENCY_AUDIT.md` for the full incident record.

## 10. How to Safely Extend Lateen OS

If you are an AI system asked to add a new business-capability engine to `packages/*`:

1. Read this document, then read one recent Era-2 package in full (e.g. `packages/finance-engine` or `packages/admin-console`) as your structural template — not an Era-1 package.
2. Scaffold `shared/` (id/date helpers, identifiers, primitives, entity/domain-event/repository bases, typed errors), `events/` (a typed event map + bus), one folder per business sub-domain (`types.ts` / `repository.ts` / `repository.impl.ts` / `engine.impl.ts` / `index.ts` each), `relationship-management/` (only if you genuinely integrate with siblings — one method per collaborator, always degrading to `null`/`[]`), `queries/` (the CQRS read port), `runtime.ts` (the composition root, `createXRuntime(deps = {})`), and `index.ts` (the full barrel export with a `@packageDocumentation` header).
3. Integrate with any sibling **only** through that sibling's own `createXRuntime()` return value — check the sibling's own `index.ts`/`ARCHITECTURE.md` for its actual public surface before assuming a method exists.
4. Before choosing your package's npm name, grep every `package.json` under `packages/`, `apps/`, `services/`, `workflows/`, and `extensions/` for the exact name you intend to use.
5. Write real tests with real sibling runtimes for integration coverage — no mocking libraries, no fabricated network stubs. Use hand-built literal objects matching a `Pick<>` shape only for narrow unit-level isolation tests, exactly as every existing package does.
6. Validate in strict order: build → typecheck → tests → lint. Do not proceed to the next step, and do not commit, until the failing step is understood and fixed.
7. Write `README.md`, `ARCHITECTURE.md`, and a `*_MODEL.md` doc before considering the package done — this trio exists for 30 of 38 packages today (see `docs/certification/ARCHITECTURE_AUDIT.md` for exactly which packages are missing which document and why).
8. One commit per package/feature. Never mix unrelated packages in one commit. Never rewrite git history. Never force-push.

## 11. Where to Look Next

- `docs/handbook/00_MASTER_PLAN.md` through `09_COMMIT_HISTORY.md` — the frozen Milestone 1 record and the platform's founding philosophy/constitution.
- `docs/adr/` — architecture decision records (start with `0003-no-cyclic-dependencies.md`, directly relevant to the one open violation on the platform today).
- `docs/certification/` — the nine Commit 35 certification reports: `PLATFORM_CERTIFICATION.md` (executive summary), `ARCHITECTURE_AUDIT.md`, `DEPENDENCY_AUDIT.md`, `RUNTIME_AUDIT.md`, `INTEGRATION_AUDIT.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_AUDIT.md`, `TESTING_AUDIT.md`, `KNOWN_TECHNICAL_DEBT.md`.
- Each package's own `README.md` / `ARCHITECTURE.md` / `*_MODEL.md` — the authoritative source for that package's internals.
