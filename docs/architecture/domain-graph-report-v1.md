# Domain Graph — Architecture Report (Sprint 4)

> **Date:** 2026-07-18  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked)

## Executive summary

Sprint 4 introduces `@lateen-os/domain-graph`, the canonical semantic graph layer for Lateen OS. The package defines nodes, edges, relationship types, ontology rules, traversal ports, query ports, and reasoning ports — with no data storage, graph database, or business logic.

## Deliverables

| Item | Status |
| ---- | ------ |
| `packages/domain-graph` package | Done |
| Graph structures (Node, Edge, Path, Metadata, Snapshot) | Done |
| 19 node definitions | Done |
| 17 relationship types | Done |
| Canonical ontology + semantic aliases | Done |
| 4 traversal ports | Done |
| 11 query methods | Done |
| 4 reasoning ports | Done |
| README.md, ARCHITECTURE.md, Ontology.md | Done |
| Dependency + graph + relationship diagrams | Done |
| Typecheck | Passed |

## Package structure

```
packages/domain-graph/
├── README.md
├── ARCHITECTURE.md
├── Ontology.md
├── package.json
├── tsconfig.json
└── src/
    ├── shared/
    ├── graph/
    ├── nodes/           (19 entity node modules)
    ├── edges/
    ├── relationships/
    ├── ontology/
    ├── traversal/
    ├── queries/
    ├── reasoning/
    └── index.ts
```

## Graph model

### Core structures

- **GraphNode** — vertex with `nodeType`, `entityId`, `organizationId`
- **GraphEdge** — directed edge with `relationshipType`
- **GraphPath** — ordered node/edge walk
- **GraphMetadata** — graph statistics
- **GraphSnapshot** — immutable typed view (no storage)

### Node types (19)

Organization, Branch, Department, Employee, Customer, Supplier, Machine, Capability, Product, Service, Project, Workflow, Policy, Asset, Quotation, Order, Invoice, AI Agent, KPI

### Relationship types (17)

BELONGS_TO, OWNS, PROVIDES, REQUIRES, USES, PRODUCES, ASSIGNED_TO, REPORTS_TO, MANAGED_BY, SUPPLIES, PURCHASED_BY, GENERATED_FROM, DEPENDS_ON, LOCATED_AT, CREATED_BY, UPDATED_BY, RELATED_TO

## Ontology highlights

Canonical triples include:

- `machine PROVIDES capability`
- `product REQUIRES capability` (semantic alias: "Capability ENABLES Product")
- `customer OWNS project`
- `project USES machine`
- `employee REPORTS_TO employee`
- `service REQUIRES capability`
- Commercial chain: `quotation → order → invoice`

Full registry: `CANONICAL_ONTOLOGY` (35+ triples).

## Ports defined

### Traversal

- `GraphTraversal`, `GraphNavigator`, `GraphExplorer`, `GraphPathFinder`

### Queries (`GraphQueries`)

- `findNeighbors`, `findAncestors`, `findDescendants`, `findShortestPath`
- `findRelatedEntities`, `findImpactedEntities`
- `findCapabilitiesForMachine`, `findProductsForMachine`, `findProjectsForCustomer`
- `findMachinesForCapability`, `findCustomersUsingCapability`

### Reasoning

- `RelationshipResolver` — ontology validation
- `ImpactAnalyzer` — change impact analysis
- `DependencyAnalyzer` — dependency chains
- `ContextResolver` — entity context for AI agents

## Dependencies

| Package | Purpose |
| ------- | ------- |
| `@lateen-os/shared-kernel` | Identifier, Timestamp |
| `@lateen-os/business-dna` | Entity IDs (Machine, Product, …) |
| `@lateen-os/capability-engine` | CapabilityId |

No modifications to upstream packages. No circular dependencies.

## Verification

```
pnpm typecheck — all packages pass (including domain-graph)
```

## Constraints honored

- Pure TypeScript DDD
- No UI, API, database, ORM, HTTP, frameworks
- No implementation, persistence, or business logic
- Interfaces and type definitions only

## Next steps (out of scope)

- Graph projection adapter in infrastructure (event-sourced edge materialization)
- Intelligence layer query implementations
- AI agent context injection via `ContextResolver`

## References

- [Lateen OS Architecture v1.0](./lateen-os-v1.md)
- [Domain Graph ARCHITECTURE.md](../packages/domain-graph/ARCHITECTURE.md)
- [Domain Graph Ontology](../packages/domain-graph/Ontology.md)
- [Business DNA](../packages/business-dna/ARCHITECTURE.md)
- [Capability Engine](../packages/capability-engine/ARCHITECTURE.md)
