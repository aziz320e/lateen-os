/** @module provider/catalog */
import type { ProviderMetadata } from './types.js';

const CAP_ALL: ProviderMetadata['capabilities'] = [
  'chat-completion',
  'streaming',
  'embeddings',
  'vision',
  'image-generation',
  'speech-to-text',
  'text-to-speech',
  'tool-calling',
  'structured-output',
  'json-mode',
  'reasoning',
];

function provider(
  id: string,
  kind: ProviderMetadata['kind'],
  displayName: string,
  description: string,
  capabilities: ProviderMetadata['capabilities'],
  options: Partial<Pick<ProviderMetadata, 'defaultBaseUrl' | 'supportsLocalDeployment' | 'supportsReasoningModels'>> = {},
): ProviderMetadata {
  return {
    id,
    kind,
    displayName,
    description,
    capabilities,
    supportsLocalDeployment: options.supportsLocalDeployment ?? false,
    supportsReasoningModels: options.supportsReasoningModels ?? false,
    defaultBaseUrl: options.defaultBaseUrl,
  };
}

/** Canonical supported provider catalog (contracts only — no SDK). */
export const PROVIDER_CATALOG: readonly ProviderMetadata[] = [
  provider('openai', 'openai', 'OpenAI', 'OpenAI GPT and embedding models', CAP_ALL, {
    defaultBaseUrl: 'https://api.openai.com/v1',
    supportsReasoningModels: true,
  }),
  provider('anthropic', 'anthropic', 'Anthropic Claude', 'Claude family models', [
    'chat-completion',
    'streaming',
    'vision',
    'tool-calling',
    'structured-output',
    'json-mode',
    'reasoning',
  ], { defaultBaseUrl: 'https://api.anthropic.com', supportsReasoningModels: true }),
  provider('google', 'google', 'Google Gemini', 'Gemini multimodal models', [
    'chat-completion',
    'streaming',
    'embeddings',
    'vision',
    'tool-calling',
    'structured-output',
    'json-mode',
    'reasoning',
  ], { defaultBaseUrl: 'https://generativelanguage.googleapis.com', supportsReasoningModels: true }),
  provider('azure-openai', 'azure-openai', 'Azure OpenAI', 'Azure-hosted OpenAI models', [
    'chat-completion',
    'streaming',
    'embeddings',
    'vision',
    'tool-calling',
    'structured-output',
    'json-mode',
  ]),
  provider('ollama', 'ollama', 'Ollama', 'Local model runtime', [
    'chat-completion',
    'streaming',
    'embeddings',
    'vision',
    'tool-calling',
    'structured-output',
    'json-mode',
  ], { defaultBaseUrl: 'http://localhost:11434', supportsLocalDeployment: true }),
  provider('deepseek', 'deepseek', 'DeepSeek', 'DeepSeek reasoning models', [
    'chat-completion',
    'streaming',
    'embeddings',
    'tool-calling',
    'structured-output',
    'json-mode',
    'reasoning',
  ], { defaultBaseUrl: 'https://api.deepseek.com', supportsReasoningModels: true }),
  provider('mistral', 'mistral', 'Mistral', 'Mistral open and commercial models', [
    'chat-completion',
    'streaming',
    'embeddings',
    'vision',
    'tool-calling',
    'structured-output',
    'json-mode',
  ], { defaultBaseUrl: 'https://api.mistral.ai' }),
  provider('qwen', 'qwen', 'Qwen', 'Alibaba Qwen models', [
    'chat-completion',
    'streaming',
    'embeddings',
    'vision',
    'tool-calling',
    'structured-output',
    'json-mode',
    'reasoning',
  ], { supportsReasoningModels: true }),
  provider('llama-cpp', 'llama-cpp', 'Llama.cpp', 'Local llama.cpp inference', [
    'chat-completion',
    'streaming',
    'embeddings',
    'structured-output',
    'json-mode',
  ], { supportsLocalDeployment: true }),
  provider('openrouter', 'openrouter', 'OpenRouter', 'Multi-provider routing gateway', [
    'chat-completion',
    'streaming',
    'embeddings',
    'vision',
    'tool-calling',
    'structured-output',
    'json-mode',
    'reasoning',
  ], { defaultBaseUrl: 'https://openrouter.ai/api/v1', supportsReasoningModels: true }),
];

export const SUPPORTED_PROVIDER_KINDS = PROVIDER_CATALOG.map((p) => p.kind);
