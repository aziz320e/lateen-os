# Institutional Memory — Package Architecture

> **Lateen OS Architecture v1.0 (Locked)**

## Purpose

`@lateen-os/institutional-memory` is the **canonical Institutional Memory model** for Lateen OS — long-term organizational knowledge consumed by Proactive AI (Architecture v1.0 § Proactive AI monitoring inputs).

The package defines domain models and contracts only. No persistence, vector database, embeddings, or AI logic.

---

## Design principles

1. **Curated knowledge, not raw streams** — Memory is intentional artifacts, not chat or logs.
2. **Evidence-backed** — Confidence scores and evidence sources support trustworthiness.
3. **Classified and scoped** — Category, importance, visibility, and retention policies govern access and lifecycle.
4. **Entity-linked** — Memory connects to Business DNA via domain graph entity references.
5. **Ports only** — Repositories and queries are interfaces; implementations live in infrastructure.

---

## Module map

| Module | Responsibility |
| ------ | -------------- |
| `shared/` | IDs, primitives, entity base, events, repository ports |
| `classification/` | MemoryCategory, ImportanceLevel, Visibility, RetentionPolicy |
| `confidence/` | ConfidenceScore, Evidence, EvidenceSource |
| `memory/` | InstitutionalMemory aggregate |
| `knowledge/` | KnowledgeEntry + KnowledgeType taxonomy |
| `decision/` | DecisionRecord |
| `lesson/` | LessonLearned |
| `meeting/` | MeetingRecord + ActionItem |
| `incident/` | IncidentRecord |
| `playbook/` | Playbook + PlaybookStep |
| `research/` | ResearchRecord |
| `template/` | Template + TemplateVariable |
| `document/` | DocumentReference + RelatedEntityRef |
| `timeline/` | TimelineEvent, MemoryTimeline |
| `queries/` | MemoryQueries port |

Each aggregate module: `types`, `value-objects`, `events`, `repository`, `index`.

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
| Aggregates | 11 |
| Knowledge types | 10 |
| Query methods | 11 |
| Domain event sets | 11 |
