/** @module model/catalog */
import type { ModelMetadata } from './types.js';

function model(
  id: string,
  providerId: string,
  providerKind: ModelMetadata['providerKind'],
  displayName: string,
  modelCode: string,
  contextWindow: number,
  capabilities: ModelMetadata['capabilities'],
  tier: ModelMetadata['tier'],
  quality: ModelMetadata['quality'],
  promptTokenUsd: string,
  completionTokenUsd: string,
  supportsReasoning = false,
): ModelMetadata {
  return {
    id,
    providerId,
    providerKind,
    displayName,
    modelCode,
    contextWindow,
    maxOutputTokens: Math.min(contextWindow / 4, 128_000),
    capabilities,
    tier,
    quality,
    supportsReasoning,
    pricing: { promptTokenUsd, completionTokenUsd },
  };
}

/** Canonical model catalog — representative models per provider. */
export const MODEL_CATALOG: readonly ModelMetadata[] = [
  model('gpt-4o', 'openai', 'openai', 'GPT-4o', 'gpt-4o', 128_000, ['chat-completion', 'streaming', 'vision', 'tool-calling', 'structured-output', 'json-mode'], 'frontier', 'highest', '0.0025', '0.01'),
  model('gpt-4o-mini', 'openai', 'openai', 'GPT-4o Mini', 'gpt-4o-mini', 128_000, ['chat-completion', 'streaming', 'tool-calling', 'structured-output', 'json-mode'], 'economy', 'fast', '0.00015', '0.0006'),
  model('text-embedding-3-large', 'openai', 'openai', 'Embedding 3 Large', 'text-embedding-3-large', 8191, ['embeddings'], 'standard', 'high', '0.00013', '0'),
  model('claude-sonnet-4', 'anthropic', 'anthropic', 'Claude Sonnet 4', 'claude-sonnet-4-20250514', 200_000, ['chat-completion', 'streaming', 'vision', 'tool-calling', 'structured-output', 'json-mode', 'reasoning'], 'frontier', 'highest', '0.003', '0.015', true),
  model('claude-haiku', 'anthropic', 'anthropic', 'Claude Haiku', 'claude-3-5-haiku-20241022', 200_000, ['chat-completion', 'streaming', 'tool-calling', 'structured-output'], 'economy', 'fast', '0.0008', '0.004'),
  model('gemini-2-flash', 'google', 'google', 'Gemini 2.0 Flash', 'gemini-2.0-flash', 1_000_000, ['chat-completion', 'streaming', 'vision', 'tool-calling', 'structured-output', 'json-mode', 'reasoning'], 'standard', 'balanced', '0.0001', '0.0004', true),
  model('gemini-embedding', 'google', 'google', 'Gemini Embedding', 'text-embedding-004', 2048, ['embeddings'], 'standard', 'high', '0.00001', '0'),
  model('azure-gpt-4o', 'azure-openai', 'azure-openai', 'Azure GPT-4o', 'gpt-4o', 128_000, ['chat-completion', 'streaming', 'vision', 'tool-calling', 'structured-output'], 'frontier', 'highest', '0.0025', '0.01'),
  model('llama3-local', 'ollama', 'ollama', 'Llama 3 Local', 'llama3', 8192, ['chat-completion', 'streaming', 'structured-output'], 'local', 'balanced', '0', '0'),
  model('deepseek-r1', 'deepseek', 'deepseek', 'DeepSeek R1', 'deepseek-reasoner', 64_000, ['chat-completion', 'streaming', 'reasoning', 'structured-output'], 'frontier', 'highest', '0.00055', '0.00219', true),
  model('mistral-large', 'mistral', 'mistral', 'Mistral Large', 'mistral-large-latest', 128_000, ['chat-completion', 'streaming', 'tool-calling', 'structured-output'], 'standard', 'high', '0.002', '0.006'),
  model('qwen-max', 'qwen', 'qwen', 'Qwen Max', 'qwen-max', 32_768, ['chat-completion', 'streaming', 'tool-calling', 'reasoning'], 'frontier', 'high', '0.0016', '0.0064', true),
  model('llama-cpp-default', 'llama-cpp', 'llama-cpp', 'Llama.cpp Default', 'default', 4096, ['chat-completion', 'streaming'], 'local', 'fast', '0', '0'),
  model('openrouter-auto', 'openrouter', 'openrouter', 'OpenRouter Auto', 'openrouter/auto', 128_000, ['chat-completion', 'streaming', 'tool-calling'], 'standard', 'balanced', '0.001', '0.003'),
];

export function getModelsByProvider(providerId: string): readonly ModelMetadata[] {
  return MODEL_CATALOG.filter((m) => m.providerId === providerId);
}

export function getModelsByCapability(capability: ModelMetadata['capabilities'][number]): readonly ModelMetadata[] {
  return MODEL_CATALOG.filter((m) => m.capabilities.includes(capability));
}
