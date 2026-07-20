/** @module events/provider-events */
import type { ModelId, ProviderId } from '../shared/identifiers.js';
import type { FallbackTrigger } from '../fallback/types.js';
import type { TokenUsage } from '../telemetry/types.js';

export const PROVIDER_EVENT_NAMES = {
  PROVIDER_SELECTED: 'provider.selected',
  PROVIDER_FAILED: 'provider.failed',
  PROVIDER_FALLBACK: 'provider.fallback',
  REQUEST_COMPLETED: 'provider.request.completed',
  REQUEST_FAILED: 'provider.request.failed',
  BUDGET_EXCEEDED: 'provider.budget.exceeded',
  POLICY_VIOLATED: 'provider.policy.violated',
} as const;

export type ProviderEventName = (typeof PROVIDER_EVENT_NAMES)[keyof typeof PROVIDER_EVENT_NAMES];

export interface ProviderDomainEvent {
  readonly name: ProviderEventName;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly organizationId?: string;
}

export interface ProviderSelected extends ProviderDomainEvent {
  readonly name: typeof PROVIDER_EVENT_NAMES.PROVIDER_SELECTED;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly strategy: string;
}

export interface ProviderFailed extends ProviderDomainEvent {
  readonly name: typeof PROVIDER_EVENT_NAMES.PROVIDER_FAILED;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly error: string;
}

export interface ProviderFallback extends ProviderDomainEvent {
  readonly name: typeof PROVIDER_EVENT_NAMES.PROVIDER_FALLBACK;
  readonly trigger: FallbackTrigger;
  readonly fromProviderId: ProviderId;
  readonly toProviderId: ProviderId;
}

export interface RequestCompleted extends ProviderDomainEvent {
  readonly name: typeof PROVIDER_EVENT_NAMES.REQUEST_COMPLETED;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly tokenUsage: TokenUsage;
  readonly costUsd: string;
  readonly latencyMs: number;
}

export interface BudgetExceeded extends ProviderDomainEvent {
  readonly name: typeof PROVIDER_EVENT_NAMES.BUDGET_EXCEEDED;
  readonly organizationId: string;
  readonly currentCostUsd: string;
  readonly maxCostUsd: string;
}

export type ProviderHubEvent =
  | ProviderSelected
  | ProviderFailed
  | ProviderFallback
  | RequestCompleted
  | BudgetExceeded;
