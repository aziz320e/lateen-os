# Domain Graph Ontology v1.0

> Canonical semantic relationships for Lateen OS.  
> Schema version: `1.0.0`

## Overview

The ontology defines **which edges are semantically valid** in the Lateen OS domain graph. Each triple is:

```
(Source Node Type) —[Relationship Type]→ (Target Node Type)
```

Implementations must not persist edges that violate these rules.

## Relationship types

| Type | Meaning |
| ---- | ------- |
| `BELONGS_TO` | Organizational or structural containment |
| `OWNS` | Ownership or custodianship |
| `PROVIDES` | Source provides capability or resource |
| `REQUIRES` | Source requires target to operate |
| `USES` | Source uses target during execution |
| `PRODUCES` | Source outputs or manufactures target |
| `ASSIGNED_TO` | Actor assigned to entity or stage |
| `REPORTS_TO` | Employee hierarchy |
| `MANAGED_BY` | Supervision or management |
| `SUPPLIES` | Supplier provides goods |
| `PURCHASED_BY` | Commercial document linked to customer |
| `GENERATED_FROM` | Derived from source document/entity |
| `DEPENDS_ON` | Dependency relationship |
| `LOCATED_AT` | Physical or logical location |
| `CREATED_BY` | Provenance — creation actor |
| `UPDATED_BY` | Provenance — last update actor |
| `RELATED_TO` | Generic association (undirected) |

## Semantic aliases

Natural-language phrasing mapped to canonical triples:

| Natural language | Canonical triple |
| ---------------- | ---------------- |
| Machine **PROVIDES** Capability | `machine` → `PROVIDES` → `capability` |
| Capability **ENABLES** Product | `product` → `REQUIRES` → `capability` |
| Customer **OWNS** Project | `customer` → `OWNS` → `project` |
| Project **USES** Machine | `project` → `USES` → `machine` |
| Employee **REPORTS_TO** Employee | `employee` → `REPORTS_TO` → `employee` |
| Service **REQUIRES** Capability | `service` → `REQUIRES` → `capability` |

> **Note:** "Capability ENABLES Product" is expressed canonically as `Product REQUIRES Capability` (demand-side edge).

## Organizational hierarchy

```
Organization
├── Branch          (branch BELONGS_TO organization)
│   └── Department  (department BELONGS_TO branch)
├── Department      (department BELONGS_TO organization)
├── Employee        (employee BELONGS_TO department)
│   └── Employee    (employee REPORTS_TO employee)
├── Machine         (machine BELONGS_TO branch | department)
├── AI Agent        (ai_agent BELONGS_TO department, MANAGED_BY employee)
├── Asset           (asset BELONGS_TO organization)
├── Policy          (policy BELONGS_TO organization)
└── KPI             (kpi BELONGS_TO organization)
```

## Capability graph

```
Machine ──PROVIDES──▶ Capability ◀──REQUIRES── Product
                          ▲
                          │
                     REQUIRES
                          │
                       Service
```

## Commercial chain

```
Customer ◀──PURCHASED_BY── Quotation
Customer ◀──PURCHASED_BY── Order ──GENERATED_FROM──▶ Quotation
Order ──GENERATED_FROM──▶ Invoice
Order ──REQUIRES──▶ Product | Service
```

## Supply chain

```
Supplier ──SUPPLIES──▶ Product ◀──DEPENDS_ON── Supplier
```

## Workflow and governance

```
Workflow ──DEPENDS_ON──▶ Policy
Workflow ──ASSIGNED_TO──▶ Employee | AI Agent
KPI ──DEPENDS_ON──▶ Product
```

## Full triple registry

The authoritative list is exported as `CANONICAL_ONTOLOGY` from `@lateen-os/domain-graph`:

```typescript
import { CANONICAL_ONTOLOGY } from '@lateen-os/domain-graph';
```

See `src/ontology/canonical-ontology.ts` for the complete registry.

## Node types

| Node type | Source package |
| --------- | -------------- |
| `organization` … `kpi` | Business DNA |
| `capability` | Capability Engine |

All 19 node types are registered in `GRAPH_NODE_DEFINITIONS`.
