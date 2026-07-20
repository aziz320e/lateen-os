# AI Provider Hub Report v1.0

**Date:** 2026-07-20  
**Architecture:** v1.0 (locked)  
**Epic:** 28 — AI Provider Hub

## Executive Summary

The AI Provider Hub provides the canonical LLM abstraction layer for Lateen OS. All provider interactions flow through this hub — AI Brain consumes it, applications never call providers directly. The package defines contracts, catalogs, routing, cost, telemetry, and policy without any provider SDK implementations.

## Deliverables

| Area | Status |
| ---- | ------ |
| `packages/ai-provider-hub` | ✅ |
| 18 modules (provider, model, routing, embedding, vision, speech, image, streaming, tool-calling, structured-output, fallback, cache, telemetry, cost, policy, queries, events, hub) | ✅ |
| 10 supported provider catalog entries | ✅ |
| 14 representative model catalog entries | ✅ |
| 6 routing strategies | ✅ |
| 5 fallback triggers | ✅ |
| Public API ports (ProviderRegistry, ModelRegistry, ProviderSelector, ProviderHealth, CostCalculator, EmbeddingProvider, VisionProvider, SpeechProvider, ImageProvider) | ✅ |
| Zod validation schemas | ✅ |
| OpenTelemetry span attribute contracts | ✅ |
| Documentation (README, ARCHITECTURE, MODEL_CATALOG, PROVIDER_GUIDE) | ✅ |

## Module Matrix

| Module | Purpose |
| ------ | ------- |
| `provider/` | Provider registry, catalog, health |
| `model/` | Model registry, catalog, selection |
| `routing/` | ProviderSelector, 6 strategies |
| `embedding/` | EmbeddingProvider port |
| `vision/` | VisionProvider port |
| `speech/` | SpeechProvider port (STT/TTS) |
| `image/` | ImageProvider port |
| `streaming/` | Chat completion + streaming |
| `tool-calling/` | Tool definitions |
| `structured-output/` | JSON/schema output |
| `fallback/` | Fallback chains |
| `cache/` | Response caching |
| `telemetry/` | Token/latency/cost tracking |
| `cost/` | CostCalculator |
| `policy/` | Cost/token/PII policies |
| `queries/` | Read-side queries |
| `events/` | Domain events |

## Supported Providers

OpenAI · Anthropic Claude · Google Gemini · Azure OpenAI · Ollama · DeepSeek · Mistral · Qwen · Llama.cpp · OpenRouter

## Verification

```bash
pnpm --filter @lateen-os/ai-provider-hub build
pnpm --filter @lateen-os/ai-provider-hub typecheck
pnpm --filter @lateen-os/ai-provider-hub test
```

## Constraints

- No provider SDK implementations — contracts only
- AI Brain, AI Runtime, and SDK unchanged
- Applications must never call providers directly
- AI Brain MUST consume Provider Hub (integration in future epic)

## Integration Path

```
AI Brain (future wiring) → AiProviderHub → Provider Adapters (future)
```
