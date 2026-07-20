# Intelligence Model

> Canonical intelligence model for Lateen OS v1.0

## Principle

**Intelligence analyzes; Decision Engine decides; Business Domains execute.**

The Intelligence Engine produces typed artifacts — trends, forecasts, signals, scores, rankings, and recommendation candidates. It never executes business decisions.

## Output consumers

```
Intelligence Engine
        │
        ├──▶ Decision Engine (RecommendationCandidate → Decision)
        └──▶ AI Workforce (proactive insight surfacing)
```

## Capability modules

### Trend Discovery

| Type | Description |
| ---- | ----------- |
| `Trend` | Discovered trend aggregate |
| `TrendSignal` | Supporting signal observation |
| `TrendSource` | Data provenance |
| `TrendScore` | Trend strength & direction |
| `TrendCategory` | product_demand, market_shift, seasonal, … |

### Market Research

`Market`, `MarketSegment`, `Demand`, `Supply`, `Opportunity` (market-level)

### Competitor Intelligence

`Competitor`, `CompetitorProduct`, `CompetitorPrice`, `CompetitorCapability`

### Product Discovery

`ProductOpportunity`, `ProductIdea`, `ProductScore`, `RequiredCapability`

### Machine Discovery

`MachineOpportunity`, `MachineRecommendation`, `ROI`, `PaybackPeriod`

### Pricing Intelligence

`PriceAnalysis`, `MarginAnalysis`, `CompetitivePrice`, `TargetPrice`

### Customer Insights

`CustomerInsight`, `CustomerSegment`, `BuyingPattern`

### Knowledge Mining

`KnowledgeFinding`, `FindingEvidence`, `FindingScore`

### Forecasting

`Forecast`, `ForecastModel`, `ForecastConfidence`, `ForecastPeriod`

### Recommendation Engine

| Type | Description |
| ---- | ----------- |
| `RecommendationCandidate` | Intelligence output for Decision Engine |
| `RecommendationRank` | Rank among candidates |
| `RecommendationReason` | Explainable reason codes |

Status includes `submitted_to_decision_engine` when forwarded for decision.

### Scoring

`DemandScore`, `ScoringTrendScore`, `ProfitScore`, `ComplexityScore`, `RiskScore`, `ROIScore` — bundled in `IntelligenceScore`

### Ranking

`RankingStrategy`, `RankingResult`, `RankedItem`

### Signals

`Signal`, `SignalType`, `SignalStrength`

### Opportunities

`BusinessOpportunity`, `OpportunityScore`, `OpportunityCategory`

## Query port

`IntelligenceQueries`:

- `findTrendingProducts`
- `findTrendingCapabilities`
- `findMachineOpportunities`
- `findBusinessOpportunities`
- `findCompetitorThreats`
- `findPriceGaps`
- `findMarketDemand`
- `findRecommendedProducts`

## Domain events

Every aggregate emits `{aggregate}.{action}` events on lifecycle transitions (types only).

## Aggregates with repositories

Trend, Market, Competitor, ProductOpportunity, MachineOpportunity, PriceAnalysis, CustomerInsight, KnowledgeFinding, Forecast, RecommendationCandidate, IntelligenceScore, RankingResult, Signal, BusinessOpportunity
