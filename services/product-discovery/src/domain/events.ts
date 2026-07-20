/** @module domain/events */
import type { DomainEvent } from '@lateen-os/shared-kernel/core';

export type ProductDiscoveryEventName =
  | 'product_discovery.run_started'
  | 'product_discovery.signals_collected'
  | 'product_discovery.signals_normalized'
  | 'product_discovery.opportunities_ranked'
  | 'product_discovery.capabilities_matched'
  | 'product_discovery.profit_estimated'
  | 'product_discovery.decision_submitted'
  | 'product_discovery.recommendation_produced'
  | 'product_discovery.run_completed'
  | 'product_discovery.run_failed';

export type ProductDiscoveryDomainEvent =
  | DomainEvent<'product_discovery.run_started', { readonly runId: string }>
  | DomainEvent<'product_discovery.signals_collected', { readonly signalCount: number }>
  | DomainEvent<'product_discovery.signals_normalized', { readonly signalCount: number }>
  | DomainEvent<'product_discovery.opportunities_ranked', { readonly opportunityCount: number }>
  | DomainEvent<'product_discovery.capabilities_matched', { readonly matchCount: number }>
  | DomainEvent<'product_discovery.profit_estimated', { readonly estimateCount: number }>
  | DomainEvent<'product_discovery.decision_submitted', { readonly decisionId: string }>
  | DomainEvent<
      'product_discovery.recommendation_produced',
      { readonly recommendationCount: number }
    >
  | DomainEvent<'product_discovery.run_completed', { readonly runId: string }>
  | DomainEvent<'product_discovery.run_failed', { readonly errorMessage: string }>;
