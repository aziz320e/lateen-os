# Reports

Report definitions are available via `GET /api/reports`.

## Periods

| Period | Description |
| ------ | ----------- |
| daily | Previous 24 hours |
| weekly | Previous 7 days |
| monthly | Previous 30 days |
| quarterly | Previous quarter |
| yearly | Previous year |
| custom | User-defined date range |

## Report Structure

Each report includes:
- `id` — unique identifier
- `name` — display name
- `period` — report period
- `domain` — analytics domain
- `metrics` — included metric IDs

Reports are generated from aggregated pipeline data — no raw business data is stored.

## Exports

Reports can be exported via `POST /api/exports` in PDF, Excel, CSV, or JSON format.
