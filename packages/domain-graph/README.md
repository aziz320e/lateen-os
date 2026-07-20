# @lateen-os/domain-graph

Domain Graph — the canonical semantic graph of Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Domain Graph defines **how Business DNA entities relate to each other** — nodes, edges, relationship types, ontology rules, traversal ports, query ports, and reasoning ports.

This package:

- **Does** define the semantic graph schema and contracts
- **Does not** store data, implement a graph database, or contain business logic

## Scope

| Included | Excluded |
| -------- | -------- |
| GraphNode, GraphEdge, GraphPath | Graph database |
| 19 node type definitions | Data persistence |
| 17 relationship types | Query implementations |
| Canonical ontology | UI / API / HTTP |
| Traversal ports | ORM |
| Query ports | Business logic |
| Reasoning ports | |

## Usage

```typescript
import {
  ontology,
  nodes,
  relationships,
  type GraphQueries,
  type GraphNode,
  CANONICAL_ONTOLOGY,
} from '@lateen-os/domain-graph';

// Inspect ontology
ontology.CANONICAL_ONTOLOGY.forEach((triple) => {
  console.log(`${triple.source} ${triple.relationship} ${triple.target}`);
});

// Query port (implement in infrastructure / intelligence layer)
declare const graphQueries: GraphQueries;
await graphQueries.findCapabilitiesForMachine(orgId, machineId);
await graphQueries.findShortestPath(sourceId, targetId, { organizationId: orgId });
```

## Structure

```
src/
├── shared/          # Graph IDs and primitives
├── graph/           # GraphNode, GraphEdge, GraphPath, GraphMetadata, GraphSnapshot
├── nodes/           # 19 entity node definitions
├── edges/           # Edge type definitions
├── relationships/   # 17 relationship types
├── ontology/        # Canonical allowed triples
├── traversal/       # GraphTraversal, GraphNavigator, GraphExplorer, GraphPathFinder
├── queries/         # GraphQueries port
├── reasoning/       # RelationshipResolver, ImpactAnalyzer, DependencyAnalyzer, ContextResolver
└── index.ts
```

## Node types (19)

Organization, Branch, Department, Employee, Customer, Supplier, Machine, Capability, Product, Service, Project, Workflow, Policy, Asset, Quotation, Order, Invoice, AI Agent, KPI

## Relationship types (17)

`BELONGS_TO`, `OWNS`, `PROVIDES`, `REQUIRES`, `USES`, `PRODUCES`, `ASSIGNED_TO`, `REPORTS_TO`, `MANAGED_BY`, `SUPPLIES`, `PURCHASED_BY`, `GENERATED_FROM`, `DEPENDS_ON`, `LOCATED_AT`, `CREATED_BY`, `UPDATED_BY`, `RELATED_TO`

See [Ontology.md](./Ontology.md) for canonical triples and [ARCHITECTURE.md](./ARCHITECTURE.md) for diagrams.

## Dependencies

- `@lateen-os/shared-kernel` — Identifier, Timestamp
- `@lateen-os/business-dna` — Entity IDs
- `@lateen-os/capability-engine` — CapabilityId

## Build

```bash
pnpm --filter @lateen-os/domain-graph build
pnpm --filter @lateen-os/domain-graph typecheck
```
