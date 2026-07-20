# Intelligence Engine — Package Architecture

> **Lateen OS Architecture v1.0 (Locked)** — Layer 3: Intelligence

## Purpose

`@lateen-os/intelligence-engine` is the **canonical Intelligence layer** for Lateen OS. It discovers, analyzes, forecasts, and recommends — without executing decisions or implementing AI/LLM logic.

---

## Architectural boundary

```
┌─────────────────────────────────────────────────────────┐
│  Data sources: Business DNA, Capabilities, Graph,       │
│  Institutional Memory, KPIs, external feeds             │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Intelligence Engine   │
              │  (analyze & recommend)  │
              └────────────┬───────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
   Decision Engine                 AI Workforce
   (decides)                        (surfaces insights)
```

---

## Module map

| Module | Primary aggregate |
| ------ | ----------------- |
| `trend-discovery` | Trend |
| `market-research` | Market |
| `competitor-intelligence` | Competitor |
| `product-discovery` | ProductOpportunity |
| `machine-discovery` | MachineOpportunity |
| `pricing-intelligence` | PriceAnalysis |
| `customer-insights` | CustomerInsight |
| `knowledge-mining` | KnowledgeFinding |
| `forecasting` | Forecast |
| `recommendation-engine` | RecommendationCandidate |
| `scoring` | IntelligenceScore |
| `ranking` | RankingResult |
| `signals` | Signal |
| `opportunities` | BusinessOpportunity |
| `queries` | IntelligenceQueries |

---

## Dependency diagram

```mermaid
flowchart BT
  subgraph consumers [Consumers]
    DE[Decision Engine]
    AI[AI Workforce]
    APP[Applications]
  end

  subgraph ie ["@lateen-os/intelligence-engine"]
    IDX[index.ts]
    TD[trend-discovery]
    RE[recommendation-engine]
    Q[queries]
  end

  subgraph upstream [Upstream]
    SK[shared-kernel]
    BD[business-dna]
    CE[capability-engine]
    DG[domain-graph]
    IM[institutional-memory]
    DEC[decision-engine]
  end

  DE --> IDX
  AI --> IDX
  APP --> IDX

  IDX --> TD & RE & Q
  RE --> DEC
  TD --> BD & IM

  BD --> SK
  CE --> BD
  DG --> CE
  IM --> DG
  DEC --> IM
```

---

## Trend flow diagram

```mermaid
flowchart LR
  DATA[Sales KPIs Memory] --> SIG[Signal detection]
  SIG --> TS[TrendSignal]
  TS --> TR[Trend aggregate]
  TR --> SC[IntelligenceScore]
  SC --> RK[RankingResult]
  RK --> PO[ProductOpportunity]
  PO --> RC[RecommendationCandidate]
  RC --> DE[Decision Engine]
```

---

## Recommendation flow diagram

```mermaid
flowchart TD
  AN[Analysis modules] --> SC[Scoring]
  SC --> RK[Ranking]
  RK --> RC[RecommendationCandidate]
  RC -->|submitted_to_decision_engine| DE[Decision Engine]
  DE --> EV[Evaluation]
  EV --> AP[ApprovalFlow]
  AP --> EX[Execution]
  AI[AI Workforce] -.->|proactive surface| RC
```

---

## Forbidden

- LLM / AI model integration in this package
- Decision execution (Decision Engine only)
- Persistence, ORM, UI, HTTP
- Business logic implementations

---

## Public API

```typescript
import {
  trendDiscovery,
  recommendationEngine,
  type IntelligenceQueries,
} from '@lateen-os/intelligence-engine';
```

---

## Version alignment

| Artifact | Count |
| -------- | ----- |
| Capability modules | 15 |
| Aggregates with events/repos | 14 |
| Query methods | 8 |
| Upstream dependencies | 6 |
