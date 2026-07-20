# Architecture

## Overview

The Enterprise Knowledge Platform orchestrates the full knowledge lifecycle — import through publish — without performing AI reasoning. It prepares structured, linked, indexed knowledge for downstream platform consumers.

## Consumers

| Consumer | Integration |
| -------- | ----------- |
| Business DNA | Entity linking (orchestration stub) |
| Domain Graph | Node/edge linking (orchestration stub) |
| Institutional Memory | Entry/document reference linking |
| AI Brain | Indexed knowledge retrieval (future) |
| Enterprise Search | Vector index (future) |
| AI Provider Hub | Embedding request contracts |

## Module Structure

```
src/
├── application/       KnowledgeService — pipeline orchestration
├── domain/            Types, pipeline steps, knowledge model
├── ingestion/         Import and validation
├── extractors/        Tika + OCR adapter contracts
├── classifiers/       Language, entity, classification
├── linking/           Business DNA, Domain Graph, Memory
├── normalization/     Text normalization (via classifiers module)
├── chunking/          Text chunking contracts
├── metadata/          Metadata extraction
├── indexing/          Embedding + vector index contracts
├── pipelines/         Pipeline orchestrator (stub)
├── repositories/      Job and document persistence
├── events/            Domain events
├── workers/           BullMQ queue
├── queries/           KnowledgeQueries read port
├── security/          Access control, PII, redaction contracts
└── api/               REST controllers
```

## Constraints

- No AI reasoning
- No LLM SDK
- No OCR implementation
- No vector database implementation
- Business DNA, AI Brain, Institutional Memory, Domain Graph packages unchanged
