# AI Brain — Reasoning Model

Contracts only. Describes how enterprise reasoning is modeled — not how it is implemented.

## Reasoning pipeline

```
Input
  │
  ├─► IntentRecognizer.recognize()
  │     └─► Intent (type, entities, parameters, confidence)
  │
  ├─► EnterpriseContextAssembler.assemble()
  │     └─► EnterpriseContext (business + conversation + mission + graph + memory refs)
  │
  ├─► WorkingMemory.retrieve()
  │     └─► WorkingContext (knowledge + entities + hypotheses)
  │
  ├─► EnterpriseReasoner.reason()
  │     └─► ReasoningResult (steps + explanation)
  │
  ├─► PlatformRouter.route()
  │     └─► RoutingDecision (service/workflow/mission/worker routes)
  │
  ├─► BrainReflector.reflect()
  │     └─► ReflectionResult (self-evaluation + improvements)
  │
  └─► BrainPlanner.createPlan()
        └─► ExecutionPlan
```

## ReasoningContext

Active context during a reasoning session:

| Field | Source |
| ----- | ------ |
| `enterprise` | Assembled from Business DNA, Domain Graph, Institutional Memory |
| `working` | Short-lived retrieval for current session |
| `focusAreas` | Topics the reasoner prioritizes |

## ReasoningStep kinds

| Kind | Purpose |
| ---- | ------- |
| `context_retrieval` | Load enterprise and working context |
| `intent_analysis` | Classify and extract intent |
| `graph_traversal` | Walk Domain Graph for related entities |
| `memory_lookup` | Query Institutional Memory |
| `decision_evaluation` | Reference Decision Engine outcomes |
| `route_selection` | Choose platform targets |
| `plan_synthesis` | Compose orchestration plan |
| `validation` | Pre-check permissions and policies |
| `reflection` | Self-evaluate reasoning quality |

## ReasoningExplanation

Every `ReasoningResult` includes a human-readable explanation:

- **summary** — one-line outcome
- **steps** — ordered reasoning narrative
- **confidence** — 0–1 score
- **caveats** — known limitations or assumptions
- **sourceReferences** — IDs of knowledge/decision/graph sources used

## Context assembly

### BusinessContext

References Business DNA entities without embedding full aggregates:

- Project, customer, product references
- Active policies and KPIs

### ConversationContext

Multi-turn session state:

- Recent message summaries
- Active intent summary
- Correlation ID for tracing

### MissionContext

When reasoning involves multi-agent missions:

- Mission type and objective
- Related decision IDs

## Memory model

| Layer | Package | Brain usage |
| ----- | ------- | ----------- |
| Long-term | institutional-memory | Retrieved via `RetrievedKnowledge` |
| Graph | domain-graph | Entity relationships via `RelevantEntities` |
| Working | ai-brain/memory | Session-scoped `WorkingContext` |

## Events

| Event | When |
| ----- | ---- |
| `intent.recognized` | Intent parsed from input |
| `reasoning.completed` | Reasoning session finished |

## Port: EnterpriseReasoner

```typescript
interface EnterpriseReasoner {
  reason(input: ReasoningInput): Promise<ReasoningResult>;
}
```

Implementations live in services — may use AI Runtime agents, graph traversal adapters, and memory query adapters. This package defines the contract only.
