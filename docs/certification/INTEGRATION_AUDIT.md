# Integration Audit — Lateen OS

> Part of Commit 35 — Enterprise Platform Certification & Stabilization. Scope: the 32 packages explicitly named in the Enterprise Certification section — Shared Kernel, SDK, AI Provider Hub, AI Runtime, AI Brain, CEO Engine, Workflow Engine, Multi Agent, AI Workforce, Decision Engine, Intelligence Engine, Business DNA, Institutional Memory, Domain Graph, CRM, Sales, Marketing, Communication Hub, Finance, HR, Inventory, Project Management, Customer Success, Document Management, API Gateway, Admin Console, Marketplace, Analytics, Observability, AI Security, AI Governance, AI Compliance (directories: `shared-kernel`, `sdk`, `ai-provider-hub`, `ai-runtime`, `ai-brain`, `ceo-engine`, `workflow-engine`, `multi-agent`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `business-dna`, `institutional-memory`, `domain-graph`, `crm-engine`, `sales-engine`, `marketing-engine`, `communication-hub`, `finance-engine`, `hr-engine`, `inventory-engine`, `project-management-engine`, `customer-success-engine`, `document-management-engine`, `api-gateway`, `admin-console`, `marketplace`, `analytics-engine`, `observability-engine`, `ai-security-engine`, `ai-governance-engine`, `ai-compliance-engine`).

## Method

- Each of the 32 packages was checked for a `relationship-management/` module (or, where absent, the location of its actual sibling-integration code).
- Each package's declared `@lateen-os/*` runtime dependencies (`DEPENDENCY_AUDIT.md`'s data) was cross-referenced against real usage in source.
- Every `relationship-management/types.ts` file present was checked for the `Pick<SiblingRuntime, '...'>` narrow-typing pattern, confirming integration happens only through a sibling's own public runtime surface.
- `ai-runtime`'s special-case consumers were checked for the documented `Pick<RuntimeQueries, 'findAgent'>` pattern (since `ai-runtime` itself has no unified `createXRuntime()` — see `RUNTIME_AUDIT.md` F3).

## Passed Checks

- **18 of the 32 named packages have a `relationship-management/` module**, and in every one of them (18/18) collaborators are typed as narrow `Pick<SiblingRuntime, '...'>` slices — never the sibling's full runtime type, never a repository.
- **Zero repository-level integration** anywhere in the 32-package scope (consistent with the whole-workspace finding in `DEPENDENCY_AUDIT.md`).
- **`ai-runtime`'s consumers correctly use its documented special-case typing.** Packages integrating with `ai-runtime` (which has no unified runtime object — `RUNTIME_AUDIT.md` F3) type that collaborator as `Pick<RuntimeQueries, 'findAgent'>` rather than inventing an ad hoc alternative — verified directly in `marketplace` and `admin-console`, and consistent with the same pattern's prior documentation in `08_PROJECT_STATUS.md` for the Phase-1 packages that also consume `ai-runtime`.
- **No package in scope modifies a sibling package to accommodate its own integration need** — every integration point is a pre-existing, independently-designed public method on the sibling's own runtime or query surface.
- **No package in scope was found bypassing its own Relationship Layer** to reach into a sibling directly from a subdomain engine, *except* the 9 packages already identified as lacking a Relationship Layer entirely (see below) — for those, "direct from a subdomain engine" is the only integration style that exists, not a bypass of an otherwise-present layer.

## Findings

### F1 — 9 of the 32 named packages integrate with real siblings without a dedicated Relationship Layer

`ai-brain`, `ai-runtime`, `ai-workforce`, `decision-engine`, `intelligence-engine`, `workflow-engine`, `multi-agent`, `institutional-memory`, `domain-graph` — full detail already recorded as `ARCHITECTURE_AUDIT.md` F4. Restated here because it is the single most relevant integration-layer finding within this report's specific scope: **28% of the packages named in the Enterprise Certification (9 of 32) have their real sibling integrations scattered across subdomain implementation files rather than centralized.** This makes those 9 packages' full integration surface harder to audit at a glance than the other 23, though (per `ARCHITECTURE_AUDIT.md` F4) no actual boundary violation was found in any of them.

### F2 — 5 of the 32 named packages correctly have no sibling integration surface

`shared-kernel`, `sdk`, `ai-provider-hub`, `ceo-engine`, `business-dna` declare no real `@lateen-os/*` sibling dependency beyond `shared-kernel` itself (or, for `business-dna`, none at all). This is expected: these are foundational/leaf packages in the dependency graph (see `DEPENDENCY_AUDIT.md` F4) or, for `sdk`, a client-side aggregator whose "integration" is aggregation of sibling public APIs for external consumers rather than peer-to-peer service composition. Not a defect.

### F3 — The `ai-brain` ⇄ `multi-agent` cycle is itself an integration-boundary issue within this scope

Both packages are in the 32-package Enterprise Certification scope. Their mutual, type-only cross-import (`DEPENDENCY_AUDIT.md` F1) means the "integration" between them is a compile-time type dependency in both directions rather than a clean one-way consumer→provider relationship. This is the only pair, among all integration relationships checked across the 32 named packages, where the direction of integration is not strictly one-way.

## Coverage Summary

| Relationship Layer status | Count | Packages |
| --- | --- | --- |
| Has `relationship-management/`, all collaborators `Pick`-typed | 18 | crm-engine, sales-engine, marketing-engine, communication-hub, finance-engine, hr-engine, inventory-engine, project-management-engine, customer-success-engine, document-management-engine, api-gateway, admin-console, marketplace, analytics-engine, observability-engine, ai-security-engine, ai-governance-engine, ai-compliance-engine |
| Real sibling integration, no dedicated layer (F1) | 9 | ai-brain, ai-runtime, ai-workforce, decision-engine, intelligence-engine, workflow-engine, multi-agent, institutional-memory, domain-graph |
| No sibling integration surface needed (F2) | 5 | shared-kernel, sdk, ai-provider-hub, ceo-engine, business-dna |
| **Total** | **32** | |

## Warnings

- Any future automated integration-coverage tooling that expects a `relationship-management/` folder on all 32 named packages will need to special-case the 14 packages in F1+F2.

## Recommendations

1. Same as `ARCHITECTURE_AUDIT.md` recommendation 2 — extract F1's 9 packages' inline sibling calls into dedicated `relationship-management/` modules in a future refactor commit, without behavior change.
2. Resolving the `ai-brain` ⇄ `multi-agent` cycle (F3, and `DEPENDENCY_AUDIT.md` F1) would also resolve this report's only bidirectional-integration finding — one fix addresses both.
