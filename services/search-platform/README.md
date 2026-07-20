# Enterprise Search Platform

Unified search layer for Lateen OS — one search interface across the entire enterprise.

**No AI reasoning.** Consumes existing platform services only.

## Quick Start

```bash
pnpm --filter @lateen-os/search-platform-service dev   # http://localhost:4010
pnpm --filter @lateen-os/search-center dev             # http://localhost:3008
```

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/search` | Execute search |
| GET | `/api/search/suggestions` | Query suggestions |
| GET | `/api/search/recent` | Recent searches |
| GET | `/api/search/saved` | Saved searches |
| GET | `/api/search/indexes` | Index registry |
| GET | `/api/search/modes` | Modes and sources |

## Search Sources (18)

Business DNA · Institutional Memory · Knowledge Platform · Marketplace · Projects · Customers · Products · Orders · Invoices · Workflows · Missions · AI Conversations · Extensions · Connectors · Reports · Files · Emails · Documents

## Search Modes (9)

Keyword · Semantic · Hybrid · Vector · Metadata · Graph · Recent · Saved

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SEARCH_MODEL.md](./SEARCH_MODEL.md)
- [RANKING.md](./RANKING.md)
- [API.md](./API.md)

## Verification

```bash
pnpm --filter @lateen-os/search-platform-service build
pnpm --filter @lateen-os/search-platform-service typecheck
pnpm --filter @lateen-os/search-platform-service test
pnpm --filter @lateen-os/search-center build
pnpm --filter @lateen-os/search-center typecheck
pnpm --filter @lateen-os/search-center test
```
