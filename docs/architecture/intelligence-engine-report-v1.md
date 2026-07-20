# Intelligence Engine — Architecture Report (Sprint 7)

> **Date:** 2026-07-18  
> **Status:** Complete  
> **Architecture:** Lateen OS v1.0 (Locked) — Layer 3

## Executive summary

Sprint 7 introduces `@lateen-os/intelligence-engine`, the canonical Intelligence layer for Lateen OS. The package defines 15 capability modules covering trend discovery, market research, competitor intelligence, product/machine discovery, pricing, customer insights, knowledge mining, forecasting, recommendations, scoring, ranking, signals, and opportunities — with domain events, repository ports, and query interfaces. No AI, LLM, persistence, or decision execution.

## Deliverables

| Item | Status |
| ---- | ------ |
| `packages/intelligence-engine` package | Done |
| 15 capability modules | Done |
| 14 aggregates with events & repositories | Done |
| IntelligenceQueries (8 methods) | Done |
| README, ARCHITECTURE, INTELLIGENCE_MODEL | Done |
| Trend + recommendation flow diagrams | Done |
| Typecheck | Passed |

## Architectural boundary

- **Intelligence Engine** — produces intelligence
- **Decision Engine** — consumes `RecommendationCandidate` and decides
- **AI Workforce** — consumes intelligence for proactive surfacing (no direct decisions)

## Modules (15)

trend-discovery, market-research, competitor-intelligence, product-discovery, machine-discovery, pricing-intelligence, customer-insights, knowledge-mining, forecasting, recommendation-engine, scoring, ranking, signals, opportunities, queries

## Key types per sprint spec

All requested types implemented across modules, including:

- Trend: Trend, TrendSignal, TrendSource, TrendScore, TrendCategory
- Scoring: DemandScore, ScoringTrendScore (avoids root conflict with trend TrendScore), ProfitScore, ComplexityScore, RiskScore, ROIScore
- Recommendation: RecommendationCandidate → Decision Engine via `DecisionCategory`
- Knowledge mining: FindingEvidence (distinct from institutional-memory Evidence)

## Query port

`IntelligenceQueries`: findTrendingProducts, findTrendingCapabilities, findMachineOpportunities, findBusinessOpportunities, findCompetitorThreats, findPriceGaps, findMarketDemand, findRecommendedProducts

## Dependencies

shared-kernel, business-dna, capability-engine, domain-graph, institutional-memory, decision-engine

No upstream packages modified. Acyclic dependency graph.

## Verification

```
pnpm typecheck — all packages pass
```

## References

- [Lateen OS Architecture v1.0](./lateen-os-v1.md)
- [Intelligence ARCHITECTURE.md](../packages/intelligence-engine/ARCHITECTURE.md)
- [Decision Engine](../packages/decision-engine/ARCHITECTURE.md)
