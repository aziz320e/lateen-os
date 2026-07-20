# Architecture

## Overview

The AI Provider Hub is the canonical abstraction layer for all LLM providers in Lateen OS. It defines contracts, catalogs, routing, cost, telemetry, and policy — without embedding any provider SDK.

## Layer Model

```
┌─────────────────────────────────────────────────────────┐
│  Applications (CEO Cockpit, Assistant, etc.)            │
└───────────────────────────┬─────────────────────────────┘
                            │ never direct
┌───────────────────────────▼─────────────────────────────┐
│  AI Brain (@lateen-os/ai-brain)                         │
│  Intent → Reasoning → Planning                          │
└───────────────────────────┬─────────────────────────────┘
                            │ MUST consume
┌───────────────────────────▼─────────────────────────────┐
│  AI Provider Hub (@lateen-os/ai-provider-hub)           │
│  Routing · Policy · Cost · Telemetry · Fallback         │
└───────────────────────────┬─────────────────────────────┘
                            │ future adapters
┌───────────────────────────▼─────────────────────────────┐
│  Provider Adapters (NOT in this package)                │
│  OpenAI · Claude · Gemini · Ollama · ...                │
└─────────────────────────────────────────────────────────┘
```

## Module Structure

```
packages/ai-provider-hub/src/
├── provider/          Provider registry, catalog, health
├── model/             Model registry, catalog, selection
├── routing/           ProviderSelector, strategies
├── embedding/         EmbeddingProvider port
├── vision/            VisionProvider port
├── speech/            SpeechProvider port (STT/TTS)
├── image/             ImageProvider port
├── streaming/         Chat completion + streaming
├── tool-calling/      Tool definitions and results
├── structured-output/ JSON/schema output contracts
├── fallback/          Fallback chains and triggers
├── cache/             Response caching contracts
├── telemetry/         Token, latency, cost tracking
├── cost/              CostCalculator, budgets
├── policy/            Cost/token/PII policies
├── queries/           Read-side query port
├── events/            Domain events
└── hub.ts             AiProviderHub composition port
```

## Routing Flow

1. AI Brain submits `RoutingRequest` with capability and policy
2. `ProviderSelector` evaluates strategy against `RoutingContext`
3. Returns `RoutingDecision` with provider + model
4. On failure, `FallbackPolicy` triggers alternate providers
5. `ProviderTelemetry` records tokens, latency, cost

## Fallback Triggers

| Trigger | Action |
| ------- | ------ |
| Provider unavailable | Next fallback step |
| Rate limited | Retry with delay or fallback |
| Timeout | Retry or fallback |
| Quota exceeded | Fallback to cheaper provider |
| Error | Retry then fallback |

## Observability

OpenTelemetry-compatible span attributes via `TelemetrySpanAttributes`:

- `lateen.provider.id`
- `lateen.model.id`
- `lateen.tokens.prompt` / `lateen.tokens.completion`
- `lateen.cost.usd`
- `lateen.latency.ms`

## Constraints

- No provider SDK implementations in this package
- No modifications to AI Brain, AI Runtime, or SDK
- Contracts and pure functions only
