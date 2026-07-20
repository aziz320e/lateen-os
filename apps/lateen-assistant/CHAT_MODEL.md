# Chat Model

## Message flow

```
POST /api/chat { message, conversationId?, stream? }
  → detectCommand(message)
  → orchestrateMessage() → downstream service APIs
  → appendMessage(conversation)
  → return markdown + metadata (chart, table, code, traceId)
```

## Streaming

Set `stream: true` to receive Server-Sent Events with token chunks. The final event includes the complete message and `conversationId`.

## Rich content

| Type | Source | Rendering |
| ---- | ------ | ----------- |
| Markdown | Orchestrator response | react-markdown + remark-gfm |
| Tables | `metadata.table` | Custom table component |
| Charts | `metadata.chart` | Recharts bar chart |
| Code | `metadata.code` | Monospace pre block |

## Conversation features

- **History** — in-memory store keyed by organization
- **Pinned** — `PATCH /api/chat` with `{ pinned: true }`
- **Search** — `GET /api/chat?q=keyword`

## Context

`GET /api/context` returns:

- Organization ID and user ID
- Permissions list
- Current mission/workflow IDs
- AI workforce agent IDs
- Memory snippet count

## Future

- Image attachments (placeholder in architecture)
- Identity Service cookie auth for production
- Real LLM routing via AI Runtime (still through service APIs)
