# Institutional Memory — Package Architecture

> **Lateen OS Architecture v1.0 (Locked)**

## Purpose

`@lateen-os/institutional-memory` is the **canonical Institutional Memory model** for Lateen OS — long-term organizational knowledge consumed by Proactive AI (Architecture v1.0 § Proactive AI monitoring inputs).

The `knowledge` module's Memory/Knowledge Lifecycle, Memory Versioning, Memory Search, Knowledge Relationships, Knowledge Validation, Retention Engine, query layer, and event bus are **real, deterministic, in-memory implementations** — see `runtime.ts`'s `createInstitutionalMemoryRuntime()` for the composition root, and `knowledge/*.impl.ts` for each engine. The other 10 aggregates (`memory`, `decision`, `lesson`, `meeting`, `incident`, `playbook`, `research`, `template`, `document`, `timeline`) remain domain models and contracts only. No persistence adapter, vector database, embeddings, or AI logic anywhere in this package.

---

## Design principles

1. **Curated knowledge, not raw streams** — Memory is intentional artifacts, not chat or logs.
2. **Evidence-backed** — Confidence scores and evidence sources support trustworthiness.
3. **Classified and scoped** — Category, importance, visibility, and retention policies govern access and lifecycle.
4. **Entity-linked** — Memory connects to Business DNA via domain graph entity references.
5. **Ports only** — Repositories and queries are interfaces; implementations live in infrastructure.

---

## Module map

| Module | Responsibility | Real? |
| ------ | -------------- | ----- |
| `shared/` | IDs, primitives, entity base, events, repository ports, `id.ts`/`errors.ts` helpers | — |
| `classification/` | MemoryCategory, ImportanceLevel, Visibility, RetentionPolicy | contracts only |
| `confidence/` | ConfidenceScore, Evidence, EvidenceSource | contracts only |
| `memory/` | InstitutionalMemory aggregate | contracts only |
| `knowledge/` | KnowledgeEntry + KnowledgeType taxonomy (now 14 types incl. `sop`/`playbook`/`faq`/`documentation`) | ✅ `KnowledgeLifecycle`, `KnowledgeSearchEngine`, `KnowledgeRelationshipService`, `KnowledgeValidationEngine`, `RetentionEngine` |
| `decision/` | DecisionRecord | contracts only |
| `lesson/` | LessonLearned | contracts only |
| `meeting/` | MeetingRecord + ActionItem | contracts only |
| `incident/` | IncidentRecord | contracts only |
| `playbook/` | Playbook + PlaybookStep | contracts only |
| `research/` | ResearchRecord | contracts only |
| `template/` | Template + TemplateVariable | contracts only |
| `document/` | DocumentReference + RelatedEntityRef | contracts only |
| `timeline/` | TimelineEvent, MemoryTimeline | contracts only |
| `queries/` | Original `MemoryQueries` port (contract) + real `KnowledgeRuntimeQueries` | ✅ `KnowledgeRuntimeQueries` |
| `events/` | Typed `InstitutionalMemoryEventMap` | ✅ `InstitutionalMemoryEventBus` |

`runtime.ts` is the composition root: `createInstitutionalMemoryRuntime()` wires the real in-memory `KnowledgeEntryRepository` and `KnowledgeEntryVersionRepository` into every engine above and exposes only `lifecycle`, `search`, `relationships`, `validation`, `retention`, `queries`, and `events` — repositories are never part of the returned surface.

Each aggregate module: `types`, `value-objects`, `events`, `repository`, `index` — `knowledge/` additionally has `repository.impl.ts`, `lifecycle.impl.ts`, `search.impl.ts`, `relationships.impl.ts`, `validation.impl.ts`, and `retention.impl.ts`.

---

## Dependency rules

```
┌──────────────────────────────────────────────┐
│  Intelligence, AI Workforce, Applications      │
└────────────────────┬─────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────┐
│       @lateen-os/institutional-memory        │
└──────┬──────────────┬──────────────┬─────────┘
       │              │              │
       ▼              ▼              ▼
┌────────────┐ ┌─────────────┐ ┌──────────────┐
│ domain-    │ │ business-   │ │ shared-      │
│ graph      │ │ dna         │ │ kernel       │
└────────────┘ └─────────────┘ └──────────────┘
```

### Allowed dependencies

- `shared-kernel` — Entity, Timestamp, TimeRange, Identifier
- `business-dna` — OrganizationId, EmployeeId, KpiId, …
- `domain-graph` — GraphNodeType for entity linking

### Forbidden

- Persistence, ORM, vector DB, embedding libraries
- AI/ML frameworks
- Upstream packages importing institutional-memory
- Business logic in this package

---

## Dependency diagram

```mermaid
flowchart BT
  subgraph consumers [Future Consumers]
    AI[AI Workforce]
    INT[Intelligence]
    APP[Applications]
  end

  subgraph im ["@lateen-os/institutional-memory"]
    IDX[index.ts]
    MEM[memory]
    KNOW[knowledge]
    DEC[decision]
    LES[lesson]
    MTG[meeting]
    INC[incident]
    PB[playbook]
    RES[research]
    TPL[template]
    DOC[document]
    TL[timeline]
    Q[queries]
    CLS[classification]
    CONF[confidence]
  end

  subgraph dg [domain-graph]
    GNT[GraphNodeType]
  end

  subgraph bd [business-dna]
    EID[Entity IDs]
  end

  subgraph sk [shared-kernel]
    CORE[Core types]
  end

  AI --> IDX
  INT --> IDX
  APP --> IDX

  IDX --> MEM & KNOW & DEC & LES & MTG & INC & PB & RES & TPL & DOC & TL & Q
  MEM --> CLS & CONF
  DOC --> GNT
  Q --> MEM & KNOW & DEC
  MEM --> EID & CORE
  DOC --> EID

  dg --> bd
  dg --> sk
  bd --> sk
```

---

## Relationship diagram

```mermaid
erDiagram
  Organization ||--o{ InstitutionalMemory : "organizationId"
  Organization ||--o{ KnowledgeEntry : "organizationId"
  Organization ||--o{ DecisionRecord : "organizationId"
  Organization ||--o{ LessonLearned : "organizationId"
  Organization ||--o{ MeetingRecord : "organizationId"
  Organization ||--o{ IncidentRecord : "organizationId"
  Organization ||--o{ Playbook : "organizationId"
  Organization ||--o{ ResearchRecord : "organizationId"
  Organization ||--o{ Template : "organizationId"
  Organization ||--o{ DocumentReference : "organizationId"
  Organization ||--o{ MemoryTimeline : "organizationId"

  Employee ||--o{ DecisionRecord : "ownerId"
  Employee ||--o{ MeetingRecord : "attendees"
  Employee ||--o{ DocumentReference : "ownerId"

  MeetingRecord ||--o{ DecisionRecord : "decisionIds"
  Playbook ||--o{ Kpi : "kpiIds"

  DocumentReference }o--o{ GraphEntity : "relatedEntities"
  MemoryTimeline ||--|{ TimelineEvent : "events"

  InstitutionalMemory {
    InstitutionalMemoryId id
    string title
    MemoryCategory category
    ImportanceLevel importance
    ConfidenceScore confidence
    Visibility visibility
  }

  KnowledgeEntry {
    KnowledgeEntryId id
    KnowledgeType knowledgeType
    string content
  }

  DecisionRecord {
    DecisionRecordId id
    string decision
    string reason
  }
```

---

## Proactive AI integration

Per Architecture v1.0, Proactive AI agents monitor Institutional Memory alongside Business DNA, Intelligence, and operational metrics. This package supplies the **type contracts** those agents read — implementations project memory artifacts from events and user-curated input in higher layers.

---

## Public API

```typescript
import {
  memory,
  lesson,
  classification,
  type InstitutionalMemory,
  type MemoryQueries,
} from '@lateen-os/institutional-memory';
```

Namespace exports for each module; root re-exports for aggregates, classification, confidence, query port, and repository ports.

---

## Version alignment

| Artifact | Count |
| -------- | ----- |
| Aggregates | 11 (1 real: `knowledge`; 10 contracts only) |
| Knowledge types | 14 (10 original + `sop`, `playbook`, `faq`, `documentation`) |
| Query methods | 11 (`MemoryQueries` contract) + 8 (`KnowledgeRuntimeQueries`, real) |
| Domain event sets | 11 (contracts) + 1 (`InstitutionalMemoryEventMap`, real — 8 required events) |
