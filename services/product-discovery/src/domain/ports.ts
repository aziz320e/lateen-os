import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export interface DiscoveryEventPublisher {
  publish(event: DomainEvent<string, Record<string, unknown>>): Promise<void>;
}

export type DiscoveryEventName =
  | 'DiscoveryStarted'
  | 'SignalsCollected'
  | 'CapabilitiesMatched'
  | 'RecommendationCreated'
  | 'DecisionRequested';
