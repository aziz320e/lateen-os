# Business DNA Engine — Architecture Audit Report

**Package:** `@lateen-os/business-dna`  
**Audit date:** 2026-07-18  
**Architecture baseline:** Lateen OS Architecture v1.0 Locked  
**Schema baseline:** Business DNA Schema 1.0 + Enrichment v1  
**Scope:** Sprint 1 foundation — types, value objects, domain events, repository ports  

---

## Executive summary

The Business DNA Engine is a well-structured **Layer 1 domain model package** that correctly separates concerns from infrastructure, application, and AI execution layers. It delivers a consistent module layout across 18 aggregates, a usable shared kernel, and repository ports suitable for hexagonal architecture.

The primary gaps are **incomplete schema coverage** (Role, Permission missing), **anemic domain modeling** (by design for Sprint 1), and **minor API surface inconsistencies**. No circular dependencies were found. The package is a solid foundation for Sprint 2 (persistence adapters, domain services, missing aggregates).

### Overall architecture score: **7.5 / 10**

| Dimension | Score | Weight | Notes |
| --------- | ----- | ------ | ----- |
| Architecture v1.0 alignment | 9/10 | High | Correct layer, event convention, AI agent modeling |
| Schema completeness | 7/10 | High | 18/20 entities; Role & Permission absent |
| DDD structure | 7/10 | High | Good boundaries; anemic models; some VO duplication |
| SOLID design | 8/10 | Medium | Strong ports/adapters prep; minor ISP variance |
| Dependency hygiene | 9/10 | High | Acyclic; shared kernel used correctly |
| Public API design | 7/10 | Medium | Good root exports; events/VOs require deep imports |
| Consistency | 7/10 | Medium | Naming (`agent` vs `ai_agent`), repository query variance |
| Documentation | 8/10 | Medium | README + JSDoc modules; no formal ADR for omissions |

---

## 1. DDD compliance

### Strengths

| Principle | Assessment |
| --------- | ---------- |
| **Bounded context** | Package represents Business DNA (Layer 1) exclusively. No Core, Intelligence, or AI Workforce logic leaked in. |
| **Ubiquitous language** | Module names, event prefixes, and Enrichment v1 fields align with schema docs (signage, B2B, production machines, rollouts). |
| **Aggregate boundaries** | `Workflow` owns `WorkflowStage[]`. `Customer` owns `RecurringOrderSchedule[]`. `Project` owns `ProjectSite[]` and `RolloutPhase[]`. Commercial documents own line items. |
| **Repository ports** | Persistence abstracted behind interfaces; implementations correctly deferred to infrastructure. |
| **Domain events** | Typed events follow `{entity}.{action}` convention matching schema and Architecture v1.0 Core event bus contract. |
| **Shared kernel** | `identifiers`, `primitives`, `enums`, `commercial`, `domain-event`, `repository` provide cross-cutting types without aggregate coupling. |
| **Tenant model** | `TenantScoped` + `organizationId` on all non-root aggregates reflects multi-tenant Business DNA correctly. |

### Weaknesses

| Issue | Severity | Detail |
| ----- | -------- | ------ |
| **Anemic domain model** | Expected | All aggregates are read-only interfaces with no factories, invariants, or behavior. Acceptable for Sprint 1; domain services or rich entities needed later. |
| **Missing authorization aggregates** | High | `Role` and `Permission` exist in schema but not in package. `RoleId`/`PermissionId` reserved in kernel; `WorkflowStage.requiredRoleId` references a non-existent aggregate. |
| **Value object vs entity blur** | Low | Projection VOs (`ProfitabilityProfile`, `ProductionCapabilities`, `EnterpriseContract`) duplicate aggregate fields. Useful for services but not true immutable VOs yet. |
| **Reference by ID only** | Acceptable | Aggregates reference other aggregates by ID (e.g. `customerId`, `productId`) — correct for DDD across bounded contexts within Business DNA. |
| **No explicit aggregate root registry** | Low | Organization is documented as root but not enforced via types (e.g. union of aggregate names). |

### DDD compliance score: **7 / 10**

Strong structural DDD for a types-only foundation. Points deducted for missing Role/Permission, anemic models, and VO/entity field overlap.

---

## 2. SOLID compliance

### Single Responsibility Principle (SRP) — **Strong**

Each module owns one aggregate's types, events, and repository port. Shared kernel owns cross-cutting concerns only. No module mixes persistence implementation or application logic.

### Open/Closed Principle (OCP) — **Strong**

New aggregates can be added as new folders without modifying existing modules. Repository interfaces extend base `ReadRepository` / `WriteRepository` without changing consumers.

### Liskov Substitution Principle (LSP) — **Good**

All entity-specific repositories extend `Repository<TEntity, TId>`. Implementations can substitute uniformly. `OrganizationRepository.findByCode` omits `organizationId` — valid specialization for tenant root, not an LSP violation.

### Interface Segregation Principle (ISP) — **Good with variance**

| Pattern | Repositories |
| ------- | ------------ |
| Base CRUD | All 18 via `Repository` |
| `findByCode` | 14 code-keyed aggregates |
| `findByNumber` | Quotation, Order, Invoice |
| Domain-specific | Customer (segment, status), Machine (branch, status), Project (customer, type), etc. |

Some repositories expose only `findById` + `findByCode`; others add rich query methods. Not inconsistent enough to harm consumers, but no shared query trait interfaces (e.g. `CodeLookupRepository`).

### Dependency Inversion Principle (DIP) — **Excellent**

High-level domain types depend on abstractions (`Repository` ports, `DomainEvent`, shared primitives). No dependency on databases, frameworks, or outer layers. Package is consumable from `services/`, `apps/`, and AI adapters via interfaces only.

### SOLID compliance score: **8 / 10**

---

## 3. Dependency analysis

### Dependency graph

```
                    ┌─────────────┐
                    │   shared/   │
                    │  (kernel)   │
                    └──────┬──────┘
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
 organization          customer              product
 branch                project               machine
 department            quotation             ...
 employee              order
 supplier              invoice
 service               workflow
                       policy
                       kpi
                       asset
                       agent
```

### Cross-module imports

| From | To | Status |
| ---- | -- | ------ |
| All aggregates | `shared/*` only | Correct |
| Aggregate → aggregate | None detected | Correct — acyclic |
| Customer, Project | `shared/enums` (`SlaTier`, `RegionCoverage`) | Correct — shared kernel |
| Organization | `shared/enums` (re-exports `SlaTier`) | Correct |

**No circular dependencies.**

### Architecture layer violations

| Check | Result |
| ----- | ------ |
| Business DNA depends on Core | None |
| Business DNA depends on Intelligence | None |
| Business DNA depends on AI Workforce execution | None — `Agent` is a DNA entity, not runtime |
| Business DNA depends on infrastructure | None |
| Identity references (`IdentityId`) | ID placeholder only — correct boundary to Layer 2 |

### Dependency analysis score: **9 / 10**

---

## 4. Public API review

### Entry point (`src/index.ts`)

| Export style | Contents | Assessment |
| ------------ | -------- | ---------- |
| `export * from './shared'` | Kernel types, IDs, enums, commercial VOs | Good — full kernel access |
| `export * as {module}` | 18 namespace exports | Good — discoverable, avoids name collisions |
| Root type re-exports | 18 aggregate interfaces + `AiAgent` alias | Good — ergonomic imports |
| Root repository re-exports | 18 repository ports | Good |

### Not exported at package root

| Symbol | Access path | Impact |
| ------ | ----------- | ------ |
| Domain events (`*DomainEvent`, `*EventName`) | `{module}/events` | Medium — event handlers need deeper imports |
| Value objects (`ManufacturingSpec`, etc.) | `{module}/value-objects` | Low — intentional |
| Status enums | `{module}/types` | Low — co-located with aggregates |
| `TenantAuditableEntity` base | `shared/entity` | Low — optional helper |

### Naming consistency

| Area | Convention | Issue |
| ---- | ---------- | ----- |
| Module folders | Singular lowercase | Consistent |
| Aggregate types | PascalCase singular | Consistent |
| Event prefixes | `{entity}` snake in action | `ai_agent.*` vs module `agent` — schema-aligned, documented |
| ID types | `{Entity}Id` | Consistent; `Kpi` vs KPI acceptable |
| Repository names | `{Entity}Repository` | Consistent |

### Package exports field (`package.json`)

Single entry point `"."` only. No subpath exports (e.g. `@lateen-os/business-dna/organization`). Consumers must import from root or rely on TypeScript path resolution to source — acceptable for monorepo, may need subpath exports for external publishing.

### Public API score: **7 / 10**

Ergonomic for aggregate and repository imports. Event-driven consumers will need namespace imports. Missing Role/Permission types creates authorization API gap.

---

## 5. Suggested improvements

Prioritized by impact. **None require immediate action** — track in Sprint 2+.

### P0 — Schema completeness

1. **Add `role/` and `permission/` modules** — complete schema coverage; unblock authorization modeling and Workflow stage assignments.
2. **Align Workflow with Role aggregate** — `requiredRoleId: RoleId` already typed; needs corresponding aggregate.

### P1 — Domain model maturity

3. **Introduce domain services** (separate package or `services/business-dna/`) — validation rules from schema (credit limits, machine routing, contract expiry) belong outside anemic interfaces.
4. **Adopt `TenantAuditableEntity<TId>`** on tenant-scoped aggregates — reduce repeated `extends Entity, TenantScoped, Auditable` boilerplate.
5. **Add aggregate factories / builders** — typed construction without business logic in entities (can live in same package as pure functions returning interfaces).

### P2 — API and ergonomics

6. **Export `BusinessDnaDomainEvent` discriminated union** — single type for Core event bus subscribers.
7. **Add subpath exports in `package.json`** — `@lateen-os/business-dna/organization`, etc.
8. **Standardize repository query traits** — optional interfaces: `CodeLookupRepository`, `DocumentNumberRepository`, `OrganizationListingRepository`.
9. **Export status enums at root** — or document recommended import pattern in ADR.

### P3 — Type safety hardening

10. **Branded nominal IDs** — `type CustomerId = string & { readonly __brand: unique symbol }` prevents ID cross-assignment bugs.
11. **Stricter decimal types** — document `string` for money/quantities; consider branded `DecimalString` type.

### P4 — Documentation

12. **ADR: Sprint 1 anemic model decision** — record intentional omission of behavior.
13. **ADR: Role/Permission deferral** — document Sprint 2 plan.
14. **Schema ↔ package mapping CI check** — script to verify 20/20 entity folders exist.

---

## 6. Technical debt

| ID | Item | Severity | Effort | Sprint |
| -- | ---- | -------- | ------ | ------ |
| TD-01 | Missing Role aggregate | High | Medium | 2 |
| TD-02 | Missing Permission aggregate | High | Medium | 2 |
| TD-03 | Anemic models — no invariant enforcement | Medium | High | 2–3 |
| TD-04 | VO field duplication on aggregates (Product, Machine, Customer) | Low | Low | 3 |
| TD-05 | `workflow/value-objects.ts` re-exports only — thin indirection | Low | Trivial | 3 |
| TD-06 | `ProjectRegion` deprecated alias — remove in v2 | Low | Trivial | Future |
| TD-07 | Repository query methods inconsistent across aggregates | Low | Medium | 2 |
| TD-08 | No unit tests for type compatibility / schema drift | Medium | Medium | 2 |
| TD-09 | `OrganizationScopedQuery` / `Page<T>` defined but unused | Low | Trivial | 2 |
| TD-10 | Goals, Integrations mentioned in Business DNA README but not in schema or package | Low | Trivial | TBD |
| TD-11 | Event types not at package root — consumer friction | Low | Low | 2 |
| TD-12 | `priceListId` on Customer typed as `string` not branded ID | Low | Trivial | 2 |
| TD-13 | No ESLint boundary rules enforcing shared-only imports | Medium | Low | 2 |

### Debt summary

- **Total items:** 13  
- **Blocking production authorization flows:** TD-01, TD-02  
- **Acceptable for Sprint 1 foundation:** TD-03 through TD-06  
- **Estimated remediation before Beta:** Sprint 2 addresses P0 + TD-08, TD-13  

---

## 7. Conclusion

`@lateen-os/business-dna` is **fit for purpose as a Sprint 1 domain foundation**. It honors Architecture v1.0 Locked boundaries, provides a clean acyclic module structure, and prepares hexagonal persistence through repository ports. The **7.5/10** score reflects strong structural design offset by intentional anemic modeling and two missing schema entities.

**Recommendation:** Proceed to Sprint 2 with Role/Permission aggregates and first repository implementations. Do not add business logic to this package — keep it as the canonical type system; place behavior in domain services or application layer.

---

## Appendix A — Entity coverage matrix

| Schema entity | Package module | Enrichment | Events | Repository | VOs |
| ------------- | -------------- | ---------- | ------ | ---------- | --- |
| Organization | ✅ organization | v1 | ✅ | ✅ | ✅ |
| Branch | ✅ branch | — | ✅ | ✅ | — |
| Department | ✅ department | — | ✅ | ✅ | — |
| Employee | ✅ employee | — | ✅ | ✅ | — |
| Role | ❌ | — | — | — | — |
| Permission | ❌ | — | — | — | — |
| Customer | ✅ customer | v1 | ✅ | ✅ | ✅ |
| Supplier | ✅ supplier | — | ✅ | ✅ | — |
| Product | ✅ product | v1 | ✅ | ✅ | ✅ |
| Service | ✅ service | — | ✅ | ✅ | — |
| Machine | ✅ machine | v1 | ✅ | ✅ | ✅ |
| Project | ✅ project | v1 | ✅ | ✅ | ✅ |
| Quotation | ✅ quotation | — | ✅ | ✅ | — |
| Order | ✅ order | — | ✅ | ✅ | — |
| Invoice | ✅ invoice | — | ✅ | ✅ | — |
| Asset | ✅ asset | — | ✅ | ✅ | — |
| Workflow | ✅ workflow | — | ✅ | ✅ | ✅ |
| Policy | ✅ policy | — | ✅ | ✅ | — |
| KPI | ✅ kpi | — | ✅ | ✅ | — |
| AI Agent | ✅ agent | — | ✅ | ✅ | ✅ |

**Coverage: 18 / 20 entities (90%)**

---

## Appendix B — Event naming audit

All events follow `{entity}.{action}`. Sample compliance:

| Module | Event prefix | Schema match |
| ------ | ------------ | ------------ |
| organization | `organization.*` | ✅ |
| customer | `customer.*` | ✅ |
| product | `product.*` | ✅ |
| machine | `machine.*` | ✅ (Enrichment v1 extensions) |
| agent | `ai_agent.*` | ✅ (schema uses `ai_agent`) |
| kpi | `kpi.*` | ✅ |

No orphan or inconsistent action verbs detected.

---

*Report generated as part of Sprint 1 audit. No code changes applied.*
