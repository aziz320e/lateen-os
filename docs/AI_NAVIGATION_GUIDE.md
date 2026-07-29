# AI Navigation Guide — Lateen OS

> A map of where to look, keyed by what you're trying to find out. Read `AI_PROJECT_CONTEXT.md` first regardless — this guide assumes that context and just tells you which file answers a specific question.

| If you need to know... | Go to |
| --- | --- |
| What Lateen OS is and its founding principle | `docs/handbook/00_MASTER_PLAN.md`, `docs/AI_PROJECT_CONTEXT.md` §1 |
| The binding architectural rules | `docs/handbook/03_CONSTITUTION.md` |
| How rules apply in practice (folder shape, layering) | `docs/handbook/04_ARCHITECTURE_GUIDE.md` |
| How to read or build one engine package | `docs/handbook/05_ENGINE_GUIDE.md`, `docs/engines/<package-name>.md` |
| Exactly what `createXRuntime()` may and may not do | `docs/handbook/06_RUNTIME_GUIDE.md` |
| How to get started as a new contributor | `docs/handbook/07_DEVELOPER_GUIDE.md` |
| Phase 1 (Milestone 1) historical status, frozen at commit `d9616a0` | `docs/handbook/08_PROJECT_STATUS.md` |
| Why packages were built in the order they were (Phase 1) | `docs/handbook/09_COMMIT_HISTORY.md` |
| What happened after Phase 1 (Milestone 2, current status) | `docs/handbook/10_AI_PROJECT_CONTEXT.md`, `docs/AI_PROJECT_CONTEXT.md` |
| One specific package's purpose, runtime, queries, events, dependencies | `docs/engines/<package-name>.md` |
| The full package map grouped by layer | `docs/architecture/PACKAGE_MAP.md` |
| The dependency graph and its one known cycle | `docs/architecture/DEPENDENCY_MODEL.md`, `docs/certification/DEPENDENCY_AUDIT.md` |
| Composition-root coverage across all packages | `docs/architecture/COMPOSITION_ROOTS.md`, `docs/certification/RUNTIME_AUDIT.md` |
| The query-layer (`paginate`/`scoreLabel`) convention | `docs/architecture/QUERY_MODEL.md` |
| The event-bus (`noun.verb`) convention | `docs/architecture/EVENT_MODEL.md` |
| The relationship-layer (`Pick<>`) convention | `docs/architecture/RELATIONSHIP_MODEL.md`, ADR 0005 |
| Real security posture (JWT, secrets, encryption) | `docs/architecture/SECURITY_ARCHITECTURE.md`, `docs/certification/SECURITY_AUDIT.md` |
| Real governance/compliance model | `docs/architecture/GOVERNANCE_ARCHITECTURE.md` |
| How the business-engine layer maps to ERP concepts | `docs/architecture/ERP_ARCHITECTURE.md` |
| All 7 cross-package matrices (dependency, runtime, event, query, etc.) | `docs/architecture/PACKAGE_CATALOG.md` |
| Visual diagrams (C4, dependency graph, event flow, etc.) | `docs/diagrams/` |
| Why a specific architectural decision was made | `docs/adr/*.md` |
| Real, current build/typecheck/test/lint results | `docs/certification/TESTING_AUDIT.md` |
| Every unresolved known issue on the platform | `docs/certification/KNOWN_TECHNICAL_DEBT.md` |
| Coding/architecture/testing standards with real examples | `docs/engineering/ENGINEERING_GUIDE.md` |
| How to safely add a new engine (when that's actually requested) | `docs/AI_PROJECT_CONTEXT.md` §10, `docs/AI_EXTENSION_GUIDE.md` |
| Facts and incidents worth remembering across sessions | `docs/AI_MEMORY.md` |
| A quick, scannable index of all 39 packages | `docs/AI_ENGINE_INDEX.md` |

## The One Rule That Overrides This Table

If anything in this table conflicts with what you find by actually reading the real source code, **the source code is correct and the documentation is wrong** — fix the documentation (factually, without inventing anything), don't trust the doc over the code.
