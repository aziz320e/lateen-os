# Ranking

## Signals

| Signal | Weight | Description |
| ------ | ------ | ----------- |
| exact-match | 0.30 | Query matches title |
| semantic-similarity | 0.20 | Vector/semantic score |
| business-importance | 0.15 | Entity importance |
| popularity | 0.10 | Access frequency |
| freshness | 0.10 | Recency of content |
| relationship-distance | 0.05 | Graph proximity |
| confidence | 0.10 | Source confidence |

## Source Selection by Intent

| Intent | Primary Sources |
| ------ | --------------- |
| entity-lookup | business-dna, products, customers, projects |
| document-find | knowledge-platform, documents, files, emails |
| knowledge-query | knowledge-platform, institutional-memory, documents |
| marketplace-browse | marketplace, extensions |
| workflow-find | workflows, missions |
| mission-find | missions, workflows |

## Permission Filtering

Results filtered by:
- Tenant isolation (`organizationId`)
- Classification level (restricted requires admin role)
- Department filter

## Highlighting

Query terms wrapped in `<em>` tags in result snippets.
