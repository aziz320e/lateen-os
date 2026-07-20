# @lateen-os/intelligence-engine

Intelligence Engine — discovery, analysis, forecasting, and recommendations for Lateen OS.

Aligned with **Lateen OS Architecture v1.0 (Locked)**.

## Purpose

The Intelligence Engine **produces intelligence only** — it does not execute decisions.

It discovers opportunities, analyzes markets, detects trends, ranks products, evaluates machines, forecasts demand, and generates recommendations.

**Consumers:**

- **Decision Engine** — evaluates and approves intelligence outputs
- **AI Workforce** — surfaces proactive insights (recommendations only)

## Scope

| Included | Excluded |
| -------- | -------- |
| 15 capability modules | LLM / AI implementation |
| Trends, forecasts, signals | Decision execution |
| Scoring & ranking models | UI / API / HTTP |
| Recommendation candidates | Database / ORM |
| Query ports | Business logic |
| Domain events & repositories | Persistence |

## Capabilities (Architecture v1.0 Layer 3)

| Module | Focus |
| ------ | ----- |
| `trend-discovery` | Trend detection |
| `market-research` | Markets, demand, supply |
| `competitor-intelligence` | Competitor tracking |
| `product-discovery` | Product opportunities |
| `machine-discovery` | Machine ROI opportunities |
| `pricing-intelligence` | Price & margin analysis |
| `customer-insights` | Customer segments & patterns |
| `knowledge-mining` | Institutional memory mining |
| `forecasting` | Demand forecasts |
| `recommendation-engine` | Recommendation candidates |
| `scoring` | Multi-dimensional scores |
| `ranking` | Ranked results |
| `signals` | Intelligence signals |
| `opportunities` | Business opportunities |

## Usage

```typescript
import {
  trendDiscovery,
  queries,
  type IntelligenceQueries,
  type RecommendationCandidate,
} from '@lateen-os/intelligence-engine';

declare const intelligenceQueries: IntelligenceQueries;
await intelligenceQueries.findTrendingProducts({ organizationId: orgId });
await intelligenceQueries.findRecommendedProducts({ organizationId: orgId });
```

See [INTELLIGENCE_MODEL.md](./INTELLIGENCE_MODEL.md) and [ARCHITECTURE.md](./ARCHITECTURE.md).

## Dependencies

- `@lateen-os/shared-kernel`
- `@lateen-os/business-dna`
- `@lateen-os/capability-engine`
- `@lateen-os/domain-graph`
- `@lateen-os/institutional-memory`
- `@lateen-os/decision-engine`

## Build

```bash
pnpm --filter @lateen-os/intelligence-engine build
pnpm --filter @lateen-os/intelligence-engine typecheck
```
