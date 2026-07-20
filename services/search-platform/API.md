# API Reference

Base URL: `http://localhost:4010`

## POST /api/search

```json
{
  "query": "security policy",
  "mode": "hybrid",
  "filters": {
    "organizationId": "org-1",
    "department": "Legal",
    "tags": ["compliance"]
  },
  "limit": 20,
  "offset": 0,
  "userId": "user-1"
}
```

Response:

```json
{
  "query": "security policy",
  "mode": "hybrid",
  "intent": "general",
  "total": 5,
  "hits": [{ "id": "...", "source": "knowledge-platform", "title": "...", "score": 0.92, "highlights": [] }],
  "sourcesQueried": ["business-dna", "knowledge-platform"],
  "latencyMs": 45,
  "correlationId": "..."
}
```

## GET /api/search/suggestions?q=sec&organizationId=org-1

Returns autocomplete suggestions from recent searches.

## GET /api/search/recent?organizationId=org-1&userId=user-1

Returns recent search history.

## GET /api/search/saved?organizationId=org-1&userId=user-1

Returns saved/pinned searches.

## GET /api/search/indexes

Returns index registry with document counts per source.

## GET /api/search/modes

Returns available search modes and sources.

## GET /health

Service health check.
