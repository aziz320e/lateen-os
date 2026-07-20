# Search

The **Search** capability within Core provides unified indexing and querying across Lateen OS.

## Responsibility

- Index entities and documents from all domains into a searchable layer
- Expose full-text, faceted, and structured query interfaces
- Maintain index freshness as Business DNA and domain data change
- Support scoped search respecting authorization boundaries

## Boundaries

Search owns _finding data_. Business DNA and domain services own the canonical records. Search indexes copies for discovery; it does not replace source-of-truth stores.
