# Institutional Memory — Architecture Report (Sprint 5)

> **Date:** 2026-07-18  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked)

## Executive summary

Sprint 5 introduces `@lateen-os/institutional-memory`, the canonical model for long-term organizational knowledge in Lateen OS. The package defines 11 aggregates, classification and confidence models, domain events, repository ports, and a unified query port — with no persistence, vector database, embeddings, or AI logic.

## Deliverables

| Item | Status |
| ---- | ------ |
| `packages/institutional-memory` package | Done |
| InstitutionalMemory aggregate | Done |
| KnowledgeEntry + 10 knowledge types | Done |
| DecisionRecord, LessonLearned, MeetingRecord | Done |
| IncidentRecord, Playbook, ResearchRecord | Done |
| Template, DocumentReference | Done |
| TimelineEvent, MemoryTimeline | Done |
| Classification module | Done |
| Confidence module | Done |
| Domain events (all aggregates) | Done |
| Repository ports (all aggregates) | Done |
| MemoryQueries port (11 methods) | Done |
| README.md, ARCHITECTURE.md, MEMORY_MODEL.md | Done |
| Relationship + dependency diagrams | Done |
| Typecheck | Passed |

## Package structure

```
packages/institutional-memory/
├── README.md
├── ARCHITECTURE.md
├── MEMORY_MODEL.md
└── src/
    ├── shared/
    ├── classification/
    ├── confidence/
    ├── memory/ … timeline/
    ├── queries/
    └── index.ts
```

## Aggregates (11)

| Aggregate | Key fields |
| --------- | ---------- |
| `InstitutionalMemory` | title, summary, source, category, importance, confidence, visibility, tags |
| `KnowledgeEntry` | content, knowledgeType (10 types) |
| `DecisionRecord` | decision, reason, alternatives, outcome, owner, reviewDate |
| `LessonLearned` | situation, problem, rootCause, resolution, recommendation |
| `MeetingRecord` | attendees, topics, notes, actionItems, decisions |
| `IncidentRecord` | severity, impact, cause, resolution, prevention |
| `Playbook` | purpose, steps, expectedOutcome, kpiIds |
| `ResearchRecord` | topic, source, summary, confidence, recommendations |
| `Template` | category, content, variables |
| `DocumentReference` | documentType, source, owner, relatedEntities |
| `MemoryTimeline` | events (TimelineEvent[]) |

## Supporting modules

- **Classification:** MemoryCategory, ImportanceLevel, Visibility, RetentionPolicy
- **Confidence:** ConfidenceScore, Evidence, EvidenceSource (10 sources)

## Query port

`MemoryQueries`: findMemories, findLessons, findResearch, findDecisions, findIncidents, findKnowledge, findPlaybooks, findTemplates, findByEntity, findByTags, findByTimeRange

## Dependencies

| Package | Usage |
| ------- | ----- |
| `@lateen-os/shared-kernel` | Entity, Timestamp, TimeRange, Identifier |
| `@lateen-os/business-dna` | OrganizationId, EmployeeId, KpiId, … |
| `@lateen-os/domain-graph` | GraphNodeType for entity linking |

No upstream packages modified. No circular dependencies.

## Constraints honored

- Pure TypeScript DDD
- Not chat history, not logs
- No UI, API, ORM, database, persistence
- No vector database, embeddings, AI implementation
- No business logic — types and ports only

## Verification

```
pnpm typecheck — all packages pass (including institutional-memory)
```

## Architecture alignment

Institutional Memory is documented in Architecture v1.0 as a primary input to **Proactive AI monitoring** (`domains/memory/`). This package is the TypeScript SDK equivalent at the packages layer.

## Next steps (out of scope)

- Event-sourced memory projection in infrastructure
- Intelligence layer query implementations
- AI agent context assembly from MemoryQueries + ContextResolver (domain-graph)

## References

- [Lateen OS Architecture v1.0](./lateen-os-v1.md)
- [Institutional Memory ARCHITECTURE.md](../packages/institutional-memory/ARCHITECTURE.md)
- [MEMORY_MODEL.md](../packages/institutional-memory/MEMORY_MODEL.md)
- [Domain Graph](../packages/domain-graph/ARCHITECTURE.md)
- [Business DNA](../packages/business-dna/ARCHITECTURE.md)
