# Search Model

## SearchRequest

```typescript
{
  query: string;
  mode: SearchMode;
  filters: {
    organizationId: string;
    department?: string;
    entityType?: string;
    tags?: string[];
    owner?: string;
    dateFrom?: string;
    dateTo?: string;
    knowledgeType?: string;
    workflow?: string;
    mission?: string;
    aiWorker?: string;
    extension?: string;
    marketplace?: boolean;
    sources?: SearchSource[];
  };
  limit?: number;
  offset?: number;
}
```

## SearchResponse

```typescript
{
  query: string;
  mode: SearchMode;
  intent: SearchIntent;
  total: number;
  hits: SearchHit[];
  sourcesQueried: SearchSource[];
  latencyMs: number;
  correlationId: string;
}
```

## SearchHit

| Field | Description |
| ----- | ----------- |
| id | Unique hit identifier |
| source | Platform source |
| title | Result title |
| description | Summary text |
| entityType | Entity classification |
| score | Rank score (0–1) |
| highlights | Highlighted snippets |
| metadata | Source-specific metadata |

## Intents

| Intent | Trigger |
| ------ | ------- |
| general | Default |
| entity-lookup | org:/customer/product queries |
| document-find | doc: prefix |
| knowledge-query | semantic/vector mode |
| marketplace-browse | marketplace/ext: prefix |
| workflow-find | workflow: prefix |
| mission-find | mission: prefix |

## Saved Searches & Collections

- **Recent searches** — last 50 per user
- **Saved searches** — named, pinned queries
- **Collections** — grouped saved searches
