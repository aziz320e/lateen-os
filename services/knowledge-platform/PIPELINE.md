# Pipeline

## Flow

```
Import → Validate → Extract Text → OCR → Normalize → Language Detection
  → Metadata Extraction → Entity Extraction
  → Business DNA Linking → Domain Graph Linking → Institutional Memory Linking
  → Chunking → Embedding Request → Vector Index Request → Knowledge Published
```

## Steps

| Step | Module | Description |
| ---- | ------ | ----------- |
| import | ingestion | Import source document |
| validate | ingestion | Validate request and source type |
| extract-text | extractors | Apache Tika adapter contract |
| ocr | extractors | OCR adapter contract (skipped when text sufficient) |
| normalize | classifiers | Normalize extracted text |
| language-detection | classifiers | Detect document language |
| metadata-extraction | metadata | Extract title, author, tags |
| entity-extraction | classifiers | Extract named entities |
| business-dna-linking | linking | Link to Business DNA entities |
| domain-graph-linking | linking | Link to Domain Graph nodes |
| institutional-memory-linking | linking | Create memory entries |
| chunking | chunking | Split text into chunks |
| embedding-request | indexing | AI Provider Hub embedding contract |
| vector-index-request | indexing | Qdrant index request contract |
| knowledge-published | pipelines | Publish knowledge document |

## Events

Each major stage emits domain events:

- `knowledge.document.imported`
- `knowledge.extraction.completed`
- `knowledge.linked`
- `knowledge.indexed`
- `knowledge.updated`
- `knowledge.deleted`

## Queue

Pipeline jobs are enqueued via BullMQ (`knowledge-pipeline-jobs`). In-memory queue used for tests.
