/** @module provider/types */
import type { ProviderId } from '../shared/identifiers.js';

export type ProviderKind =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure-openai'
  | 'ollama'
  | 'deepseek'
  | 'mistral'
  | 'qwen'
  | 'llama-cpp'
  | 'openrouter';

export type ProviderCapability =
  | 'chat-completion'
  | 'streaming'
  | 'embeddings'
  | 'vision'
  | 'image-generation'
  | 'speech-to-text'
  | 'text-to-speech'
  | 'tool-calling'
  | 'structured-output'
  | 'json-mode'
  | 'reasoning';

export type ProviderStatus = 'active' | 'degraded' | 'unavailable' | 'disabled';

export interface ProviderMetadata {
  readonly id: ProviderId;
  readonly kind: ProviderKind;
  readonly displayName: string;
  readonly description: string;
  readonly capabilities: readonly ProviderCapability[];
  readonly defaultBaseUrl?: string;
  readonly supportsLocalDeployment: boolean;
  readonly supportsReasoningModels: boolean;
}

export interface ProviderConfiguration {
  readonly apiKeyRef?: string;
  readonly baseUrl?: string;
  readonly organization?: string;
  readonly deploymentName?: string;
  readonly region?: string;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
}

export interface ProviderRegistration {
  readonly metadata: ProviderMetadata;
  readonly configuration: ProviderConfiguration;
  readonly status: ProviderStatus;
  readonly priority: number;
}

export interface ProviderHealthSnapshot {
  readonly providerId: ProviderId;
  readonly kind: ProviderKind;
  readonly status: ProviderStatus;
  readonly latencyMs?: number;
  readonly errorRate?: number;
  readonly lastCheckedAt: string;
  readonly message?: string;
}
