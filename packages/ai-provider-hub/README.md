# @lateen-os/ai-provider-hub

Canonical AI Provider Hub for Lateen OS. Abstracts every LLM provider behind one unified interface.

## Principles

- **AI Brain MUST consume Provider Hub** — never call providers directly
- **Applications MUST NEVER call providers directly**
- **Contracts only** — no provider SDK implementations
- Architecture v1.0 (locked)

## Supported Providers

OpenAI · Anthropic Claude · Google Gemini · Azure OpenAI · Ollama · DeepSeek · Mistral · Qwen · Llama.cpp · OpenRouter

## Capabilities

| Capability | Module |
| ---------- | ------ |
| Chat Completion | `streaming` |
| Streaming | `streaming` |
| Embeddings | `embedding` |
| Vision | `vision` |
| Image Generation | `image` |
| Speech To Text / TTS | `speech` |
| Tool Calling | `tool-calling` |
| Structured Output | `structured-output` |
| Fallback / Retry | `fallback` |
| Cache | `cache` |
| Telemetry / Cost | `telemetry`, `cost` |
| Policies | `policy` |
| Routing | `routing` |

## Public API

```typescript
import {
  PROVIDER_CATALOG,
  MODEL_CATALOG,
  calculateTokenCost,
  applyRoutingStrategy,
  providerPolicySchema,
} from '@lateen-os/ai-provider-hub';

import type {
  AiProviderHub,
  ProviderRegistry,
  ModelRegistry,
  ProviderSelector,
  ProviderHealth,
  CostCalculator,
  EmbeddingProvider,
  VisionProvider,
  SpeechProvider,
  ImageProvider,
} from '@lateen-os/ai-provider-hub';
```

## Routing Strategies

`cheapest` · `fastest` · `highest-quality` · `policy-based` · `manual` · `weighted`

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [MODEL_CATALOG.md](./MODEL_CATALOG.md)
- [PROVIDER_GUIDE.md](./PROVIDER_GUIDE.md)

## Verification

```bash
pnpm --filter @lateen-os/ai-provider-hub build
pnpm --filter @lateen-os/ai-provider-hub typecheck
pnpm --filter @lateen-os/ai-provider-hub test
```

## Integration

```
Application → AI Brain → AI Provider Hub → Provider Adapters (future)
                ↑
         Never direct to OpenAI/Claude/etc.
```
