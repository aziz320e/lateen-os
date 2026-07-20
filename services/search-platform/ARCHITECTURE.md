# Architecture

## Overview

The Enterprise Search Platform is the canonical search layer for Lateen OS. It federates queries across all platform sources, ranks and filters results, and returns unified search responses.

## Search Pipeline

```
Receive Query → Intent Detection → Source Selection
  → Business DNA / Knowledge / Memory / Graph / Marketplace Search
  → Merge Results → Ranking → Permission Filtering → Highlight → Return
```

## Module Structure

```
src/
├── application/     SearchService — pipeline orchestration
├── domain/          Types, schemas, sources, modes
├── sources/         SourceSearchAdapter per platform source
├── ranking/         Intent detection, source selection, ranking
├── permissions/     Tenant isolation, access control
├── highlight/       Snippet highlighting
├── indexing/        Qdrant + AI Provider Hub contracts
├── repositories/    Recent, saved, collections
├── workers/         BullMQ index queue
└── api/             REST controllers
```

## Integrations (orchestration stubs)

| Service | Role |
| ------- | ---- |
| Business DNA | Entity search |
| Knowledge Platform | Document search |
| Institutional Memory | Memory search |
| Domain Graph | Graph search |
| Marketplace | Extension search |
| AI Provider Hub | Embedding contract (semantic/vector) |
| Qdrant | Vector search contract |

## Constraints

- No AI reasoning
- No vector DB implementation
- Business DNA, Knowledge Platform, Institutional Memory, AI Brain, Domain Graph unchanged
