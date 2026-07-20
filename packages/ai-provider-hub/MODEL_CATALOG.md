# Model Catalog

Representative models registered in the Provider Hub catalog. Pricing is indicative for cost estimation contracts.

## OpenAI

| Model | Code | Context | Capabilities | Tier |
| ----- | ---- | ------- | ------------ | ---- |
| GPT-4o | `gpt-4o` | 128K | chat, streaming, vision, tools, structured | frontier |
| GPT-4o Mini | `gpt-4o-mini` | 128K | chat, streaming, tools, structured | economy |
| Embedding 3 Large | `text-embedding-3-large` | 8K | embeddings | standard |

## Anthropic

| Model | Code | Context | Capabilities | Tier |
| ----- | ---- | ------- | ------------ | ---- |
| Claude Sonnet 4 | `claude-sonnet-4-20250514` | 200K | chat, vision, tools, reasoning | frontier |
| Claude Haiku | `claude-3-5-haiku-20241022` | 200K | chat, tools, structured | economy |

## Google

| Model | Code | Context | Capabilities | Tier |
| ----- | ---- | ------- | ------------ | ---- |
| Gemini 2.0 Flash | `gemini-2.0-flash` | 1M | chat, vision, tools, reasoning | standard |
| Gemini Embedding | `text-embedding-004` | 2K | embeddings | standard |

## Other Providers

| Provider | Model | Tier |
| -------- | ----- | ---- |
| Azure OpenAI | Azure GPT-4o | frontier |
| Ollama | Llama 3 Local | local |
| DeepSeek | DeepSeek R1 | frontier |
| Mistral | Mistral Large | standard |
| Qwen | Qwen Max | frontier |
| Llama.cpp | Default | local |
| OpenRouter | Auto | standard |

## Selection Criteria

Use `ModelSelectionCriteria` to filter by:

- Capability (chat, embeddings, vision, etc.)
- Minimum context window
- Maximum cost per 1K tokens
- Preferred provider kinds
- Reasoning requirement

## Cost Estimation

```typescript
import { calculateTokenCost } from '@lateen-os/ai-provider-hub';

const cost = calculateTokenCost({
  providerId: 'openai',
  modelId: 'gpt-4o-mini',
  promptTokens: 1000,
  completionTokens: 500,
});
```
