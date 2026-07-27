# @lateen-os/domain-graph

Domain Graph — the canonical semantic graph of Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Domain Graph defines **how Business DNA entities relate to each other** — nodes, edges, relationship types, ontology rules, traversal ports, query ports, and reasoning ports.

## Stack

- Pure TypeScript, strict mode
- One module per capability, each with `types.ts` / a repository port (internal) / `*.impl.ts` real implementations
- Framework agnostic — no UI, REST, database, or LLM SDK
- Deterministic and offline — no wall-clock timers baked in (every `create*` factory accepts an injectable `now()`), no network calls, no AI/LLM anywhere in this package
- Dependency injection only — every `create*` factory takes its dependencies explicitly; see `createDomainGraphRuntime()` for the composition root

## Real runtime vs. contracts-only

The Graph Lifecycle, Entity Registry, Relationship Engine, Graph Repository, Traversal Engine, Validation engine, Search engine, query layer, and event bus are **real, deterministic, in-memory implementations**:

| Capability | Module | Notes |
| ---------- | ------ | ----- |
| Graph Lifecycle | `graph` | Guarded `create` / `update` / `archive` / `restore`, plus `rebuild` (publishes `graph.rebuilt`), over a real `DomainGraphRepository` |
| Entity Registry | `entities` | Register / update / archive first-class entities across all 27 `GraphNodeType`s (19 original + `lead`, `contact`, `competitor`, `market`, `mission`, `knowledge`, `document`, `campaign`) |
| Relationship Engine | `relationship-engine` | 14 typed `DomainRelationshipType`s (`owns`, `belongs_to`, `manages`, `depends_on`, `references`, `related_to`, `competitor_of`, `customer_of`, `supplier_of`, `member_of`, `executes`, `created_by`, `assigned_to`, `blocked_by`); creation is guarded against dangling references |
| Graph Repository | `store` | Internal, tenant-and-graph-scoped in-memory storage — `findEntity` / `findEntities` / `findRelationships` / `findNeighbors` / `findParents` / `findChildren` / `shortestPath` / `connectedComponents` |
| Traversal Engine | `traversal` | BFS, DFS, shortest path, cycle detection, and deterministic dependency ordering (topological sort) — pure algorithms in `graph/algorithms.ts`, reused by both the Graph Repository and the Traversal Engine |
| Validation | `validation` | Duplicate entity detection, dangling relationship detection, orphan detection, cycle validation |
| Search | `search` | Deterministic search by name, type, tags, and metadata — no embeddings, no vector search |
| Query Layer | `queries` | Real, read-only `DomainGraphQueries` port — `findEntity` / `searchEntities` / `findRelationships` / `findNeighbors` / `shortestPath` / `dependencyOrder` / `detectCycles` / `graphStatistics` |
| Event Bus | `events` | Typed `DomainGraphEventMap`; every declared event is genuinely published by the service that triggers it |

The original ontology system (`graph/types.ts`'s `GraphEdge`/`GraphPath`/`GraphSnapshot`, `nodes/` per-type schema definitions, `relationships/relationship-type.ts`'s upper-snake-case `RelationshipType`, `ontology/`, and the `reasoning/` ports) remains **contracts only** — untouched by this commit. The real runtime's `DomainRelationshipType` is a deliberately distinct, lowercase vocabulary from the ontology's `RelationshipType`; see [DOMAIN_GRAPH_MODEL.md](./DOMAIN_GRAPH_MODEL.md) for why both exist side by side.

## Event bus

`DomainGraphEventMap` declares the 8 required events, each genuinely published by the real service that causes it:

`entity.created`, `entity.updated`, `entity.archived`, `relationship.created`, `relationship.updated`, `relationship.deleted`, `graph.validated`, `graph.rebuilt`.

## Usage

```typescript
import { createDomainGraphRuntime } from '@lateen-os/domain-graph';

const runtime = createDomainGraphRuntime();

const graph = await runtime.graphs.create('org-1', { name: 'Primary Graph' });

const acme = await runtime.entities.register('org-1', graph.id, { nodeType: 'organization', entityId: 'org-entity-1', label: 'Acme Corp' });
const dept = await runtime.entities.register('org-1', graph.id, { nodeType: 'department', entityId: 'dept-1', label: 'Sales' });

await runtime.relationships.create('org-1', graph.id, {
  relationshipType: 'belongs_to',
  sourceNodeId: dept.nodeId,
  targetNodeId: acme.nodeId,
});

const { path } = await runtime.queries.shortestPath({
  organizationId: 'org-1',
  graphId: graph.id,
  sourceNodeId: dept.nodeId,
  targetNodeId: acme.nodeId,
});

const report = await runtime.validation.validate('org-1', graph.id);
console.log(report.isValid); // true
```

Every declared event is genuinely published — subscribe via `runtime.events`:

```typescript
runtime.events.subscribe('relationship.created', (payload) => {
  console.log(`${payload.sourceNodeId} -[${payload.relationshipType}]-> ${payload.targetNodeId}`);
});
```

## Structure

```
src/
├── shared/          # Graph IDs, primitives, id.ts/errors.ts helpers, entity.ts base
├── graph/           # Core structures + real DomainGraph lifecycle + pure algorithms
├── nodes/           # 27 entity node definitions (19 original + 8 new)
├── edges/           # Edge type definitions (contracts only)
├── relationships/   # 17 ontology relationship types (contracts only)
├── ontology/        # Canonical allowed triples (contracts only)
├── store/           # Internal real repositories (Entity, Relationship, Graph)
├── entities/        # Real Entity Registry
├── relationship-engine/  # Real Relationship Engine
├── traversal/       # Traversal ports (contracts) + real Traversal Engine
├── validation/      # Real Validation engine
├── search/          # Real Search engine
├── queries/         # GraphQueries port (contracts) + real DomainGraphQueries
├── reasoning/       # Semantic analysis ports (contracts only)
├── events/          # Typed DomainGraphEventMap
├── runtime.ts       # createDomainGraphRuntime() composition root
└── index.ts
```

## Node types (27)

Organization, Branch, Department, Employee, Customer, Supplier, Machine, Capability, Product, Service, Project, Workflow, Policy, Asset, Quotation, Order, Invoice, AI Agent, KPI, **Lead, Contact, Competitor, Market, Mission, Knowledge, Document, Campaign**

## Relationship types

- Ontology (contracts only, upper-snake-case, 17): `BELONGS_TO`, `OWNS`, `PROVIDES`, `REQUIRES`, `USES`, `PRODUCES`, `ASSIGNED_TO`, `REPORTS_TO`, `MANAGED_BY`, `SUPPLIES`, `PURCHASED_BY`, `GENERATED_FROM`, `DEPENDS_ON`, `LOCATED_AT`, `CREATED_BY`, `UPDATED_BY`, `RELATED_TO`
- Relationship Engine (real, lowercase, 14): `owns`, `belongs_to`, `manages`, `depends_on`, `references`, `related_to`, `competitor_of`, `customer_of`, `supplier_of`, `member_of`, `executes`, `created_by`, `assigned_to`, `blocked_by`

See [Ontology.md](./Ontology.md) for canonical triples, [DOMAIN_GRAPH_MODEL.md](./DOMAIN_GRAPH_MODEL.md) for the real runtime model, and [ARCHITECTURE.md](./ARCHITECTURE.md) for diagrams.

## Dependencies

- `@lateen-os/shared-kernel` — Identifier, Timestamp, EventBus, InMemoryRepository
- `@lateen-os/business-dna` — Entity IDs (incl. `CompetitorId`, `MarketId`)
- `@lateen-os/capability-engine` — CapabilityId

## Verification

```bash
pnpm --filter @lateen-os/domain-graph build
pnpm --filter @lateen-os/domain-graph typecheck
pnpm --filter @lateen-os/domain-graph test
pnpm --filter @lateen-os/domain-graph lint
```
