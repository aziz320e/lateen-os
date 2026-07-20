# Enterprise Knowledge Platform

Import, extract, classify, link, index, and publish enterprise knowledge for Lateen OS.

**No AI reasoning.** Prepares knowledge for Business DNA, Domain Graph, Institutional Memory, AI Brain, and Enterprise Search.

## Quick Start

```bash
pnpm --filter @lateen-os/knowledge-platform-service dev
```

Service listens on **http://localhost:4009**.

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | Service health |
| GET | `/api/pipeline` | Pipeline step registry |
| POST | `/api/knowledge/import` | Import and process knowledge |
| GET | `/api/knowledge/:id` | Get pipeline job |
| GET | `/api/knowledge/documents/:id` | Get published document |
| GET | `/api/knowledge/status` | Pipeline status summary |
| GET | `/api/knowledge/types` | Knowledge and source types |
| GET | `/api/knowledge/search` | Search knowledge |
| GET | `/api/knowledge/search/recent` | Recent knowledge |
| GET | `/api/knowledge/search/department` | By department |
| GET | `/api/knowledge/search/tags` | By tags |

## Technology

NestJS · Fastify · BullMQ · Redis · OpenTelemetry · Prisma · Zod

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [PIPELINE.md](./PIPELINE.md)
- [SECURITY.md](./SECURITY.md)
- [KNOWLEDGE_MODEL.md](./KNOWLEDGE_MODEL.md)

## Verification

```bash
pnpm --filter @lateen-os/knowledge-platform-service build
pnpm --filter @lateen-os/knowledge-platform-service typecheck
pnpm --filter @lateen-os/knowledge-platform-service test
```
