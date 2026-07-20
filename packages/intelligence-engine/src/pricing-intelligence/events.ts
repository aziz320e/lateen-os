/** @module pricing-intelligence/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type PriceAnalysisEventName =
  | DomainEventName<'price_analysis', 'created'>
  | DomainEventName<'price_analysis', 'gap_detected'>
  | DomainEventName<'price_analysis', 'updated'>
  | DomainEventName<'price_analysis', 'archived'>;

export type PriceAnalysisDomainEvent =
  | DomainEvent<'price_analysis.created', Record<string, unknown>>
  | DomainEvent<'price_analysis.gap_detected', Record<string, unknown>>
  | DomainEvent<'price_analysis.updated', Record<string, unknown>>
  | DomainEvent<'price_analysis.archived', Record<string, unknown>>;
