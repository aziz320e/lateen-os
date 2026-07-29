# AI Engine Index — Lateen OS

> A quick, scannable index of all 39 packages under `packages/*`, grouped by architectural layer (see `AI_PROJECT_CONTEXT.md` §3). Each links to its full entry in `docs/engines/`. This index is deliberately terse — for real detail (runtime, queries, events, dependencies), follow the link.

## Foundation

- [`shared-kernel`](./engines/shared-kernel.md) — `@lateen-os/shared-kernel`. Layer Zero: `Entity`, `Identifier`, `Timestamp`, `AuditInfo`, `Money`, `EventBus`, `InMemoryRepository` primitives. Depends on nothing.

## LLM Abstraction

- [`ai-provider-hub`](./engines/ai-provider-hub.md) — `@lateen-os/ai-provider-hub`. The sole gateway to LLM providers; every real LLM call in the platform goes through here (ADR 0002).

## Reasoning Stack

- [`decision-engine`](./engines/decision-engine.md) — the sole authority that turns a recommendation into an executed decision. Sanctioned deviation: no unified `createXRuntime()`.
- [`intelligence-engine`](./engines/intelligence-engine.md) — scoring, ranking, forecasting, recommendation logic feeding the decision layer. Sanctioned deviation: no unified `createXRuntime()`.
- [`ai-runtime`](./engines/ai-runtime.md) — agent runtime primitives (scheduler, planner, conversation, tool execution, memory, agent registry). Sanctioned deviation: no unified `createXRuntime()`; consumers depend on `Pick<RuntimeQueries, 'findAgent'>`.
- [`ai-brain`](./engines/ai-brain.md) — composes the reasoning stack into one addressable "brain." Has a real, documented circular dependency with `multi-agent` (unresolved).
- [`ceo-engine`](./engines/ceo-engine.md) — the top-of-stack orchestration layer. Composition root named `createCEOEngine()`.

## Coordination / Digital Labor

- [`workflow-engine`](./engines/workflow-engine.md) — defines and runs multi-step workflows consumed across the platform.
- [`multi-agent`](./engines/multi-agent.md) — multi-agent coordination and escalation. Has the documented circular dependency with `ai-brain`.
- [`ai-workforce`](./engines/ai-workforce.md) — the digital-workforce abstraction executing work within defined authority.

## Domain Infrastructure

- [`business-dna`](./engines/business-dna.md) — the sole canonical business model; the only source of `OrganizationId`.
- [`institutional-memory`](./engines/institutional-memory.md) — the platform's classification/trust/memory/knowledge layer.
- [`domain-graph`](./engines/domain-graph.md) — the relationship graph built over Business DNA.
- [`capability-engine`](./engines/capability-engine.md) — capability definition/registration. No composition root (nothing to compose); no test suite (a real, disclosed gap).

## Business Engines

- [`crm-engine`](./engines/crm-engine.md) — customer relationship management.
- [`sales-engine`](./engines/sales-engine.md) — sales pipeline and opportunity management.
- [`marketing-engine`](./engines/marketing-engine.md) — marketing campaigns and audiences.
- [`communication-hub`](./engines/communication-hub.md) — the unified notification/communication channel tying CRM, Sales, and Marketing together.
- [`finance-engine`](./engines/finance-engine.md) — accounting and financial operations (Era 2).
- [`hr-engine`](./engines/hr-engine.md) — human resources (Era 2).
- [`inventory-engine`](./engines/inventory-engine.md) — inventory and stock management (Era 2).
- [`project-management-engine`](./engines/project-management-engine.md) — projects, tasks, milestones (Era 2).
- [`customer-success-engine`](./engines/customer-success-engine.md) — customer health, retention, success operations (Era 2).
- [`document-management-engine`](./engines/document-management-engine.md) — document lifecycle and storage metadata (Era 2).

## Trust Layer

- [`ai-security-engine`](./engines/ai-security-engine.md) — identity, authentication, secrets (real AES-256-GCM), threat detection, audit.
- [`ai-governance-engine`](./engines/ai-governance-engine.md) — policy, model/agent/workflow governance, human approval, risk governance.
- [`ai-compliance-engine`](./engines/ai-compliance-engine.md) — compliance frameworks, controls, evidence, gap analysis, audit.

## Horizontal / Operational

- [`analytics-engine`](./engines/analytics-engine.md) — the platform's widest single consumer (15 sibling dependencies); aggregates KPIs across the business.
- [`observability-engine`](./engines/observability-engine.md) — health checks, monitoring, observability data for the whole platform.

## Platform Surface (Era 2)

- [`api-gateway`](./engines/api-gateway.md) — external API exposure; real JWT (HS256, constant-time verification) and hashed API-key authentication.
- [`admin-console`](./engines/admin-console.md) — administration, identity administration, system settings, audit center.
- [`marketplace`](./engines/marketplace.md) — npm name `@lateen-os/marketplace-engine` (not `@lateen-os/marketplace` — that belongs to the unrelated `apps/marketplace` frontend). Extension/plugin/package registries, sandboxing metadata, catalog. 8 sibling integrations, the widest of any Era-2 package.

## Developer Surface / Platform Infrastructure

- [`sdk`](./engines/sdk.md) — the official platform-level composition point, `createLateen()`.
- [`kernel`](./engines/kernel.md) — low-level shared primitives. No composition root (nothing to compose).
- [`extension-system`](./engines/extension-system.md) — the extension/plugin substrate predating the Era-2 convention. Composition root named `createExtensionSystem()`.
- [`connector-base`](./engines/connector-base.md) — base contracts for external connectors.
- [`integration-contracts`](./engines/integration-contracts.md) — shared integration-layer contracts (types only).
- [`typescript-config`](./engines/typescript-config.md) — the shared `tsconfig.json` package. No runtime source, no build/test/lint scripts — correctly so.
- [`integration-tests`](./engines/integration-tests.md) — the end-to-end suite verifying engines work together via `sdk`'s `createLateen()`. Not itself a composable engine.

## Totals

39 packages. See `docs/architecture/PACKAGE_CATALOG.md` for the full cross-package matrices (dependency, runtime, event, query, relationship, repository) and `docs/certification/` for the complete, evidence-based audit each of these facts is drawn from.
