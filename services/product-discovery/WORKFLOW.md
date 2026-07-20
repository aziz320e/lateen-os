# Product Discovery Workflow

Seven-stage pipeline — each stage is independently testable.

## Pipeline

```
Collect Signals → Normalize → Rank → Match Capabilities → Estimate Profit → Submit Decision → Produce Recommendation
```

## Stages

| # | Stage | Input | Output | Persistence |
| - | ----- | ----- | ------ | ----------- |
| 1 | Collect Signals | keywords, org | `CollectSignalsResult` | `Signal` (market) |
| 2 | Normalize | market signals | `NormalizeSignalsResult` | `Signal` (normalized) |
| 3 | Rank | normalized signals | `RankOpportunitiesResult` | `Opportunity` |
| 4 | Match Capabilities | ranked opportunities | `CapabilityMatchingResult` | `CapabilityMatchRecord` |
| 5 | Estimate Profit | capability matches | `ProfitEstimationResult` | `ProfitEstimateRecord` |
| 6 | Submit Decision | profit estimates | `DecisionSubmissionResult` | run stageResults |
| 7 | Produce Recommendation | decision + matches | `RecommendationResult` | `RecommendationRecord` |

## Workflow execution tracking

Each stage creates a `WorkflowExecution` record with status (`pending` → `running` → `completed` | `failed`).

## Platform integration

| Stage | Platform |
| ----- | -------- |
| Collect | 8 mock signal adapters |
| Match | Business DNA API + derived capabilities |
| Submit | Intelligence Engine (stub) + Decision Engine (stub) |
| Recommend | Intelligence Engine (stub) |

## Caching (Redis)

| Key pattern | Content |
| ----------- | ------- |
| `signals:{orgId}:{keywords}` | Collected signals |
| `capabilities:{orgId}` | Derived capability catalog |
| `business-dna:{orgId}:{resource}` | Business DNA list responses |

## Testing

Stage unit tests: `tests/unit/workflow-stages.test.ts`

Mock adapter tests: `tests/unit/mock-adapters.test.ts`
