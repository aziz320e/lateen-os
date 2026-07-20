/** @module product/events */
import type { DomainEvent, DomainEventName } from '../shared/domain-event.js';

export type ProductEventName =
  | DomainEventName<'product', 'created'>
  | DomainEventName<'product', 'activated'>
  | DomainEventName<'product', 'seasonal_activated'>
  | DomainEventName<'product', 'seasonal_ended'>
  | DomainEventName<'product', 'discontinued'>
  | DomainEventName<'product', 'archived'>
  | DomainEventName<'product', 'price_changed'>
  | DomainEventName<'product', 'margin_calculated'>
  | DomainEventName<'product', 'margin_below_target'>
  | DomainEventName<'product', 'trend_updated'>
  | DomainEventName<'product', 'ai_analyzed'>
  | DomainEventName<'product', 'production_risk_detected'>
  | DomainEventName<'product', 'updated'>;

export type ProductDomainEvent =
  | DomainEvent<'product.created', { readonly code: string }>
  | DomainEvent<'product.activated', Record<string, unknown>>
  | DomainEvent<'product.seasonal_activated', Record<string, unknown>>
  | DomainEvent<'product.seasonal_ended', Record<string, unknown>>
  | DomainEvent<'product.discontinued', Record<string, unknown>>
  | DomainEvent<'product.archived', Record<string, unknown>>
  | DomainEvent<'product.price_changed', { readonly previousPrice?: string }>
  | DomainEvent<'product.margin_calculated', Record<string, unknown>>
  | DomainEvent<'product.margin_below_target', Record<string, unknown>>
  | DomainEvent<'product.trend_updated', Record<string, unknown>>
  | DomainEvent<'product.ai_analyzed', Record<string, unknown>>
  | DomainEvent<'product.production_risk_detected', Record<string, unknown>>
  | DomainEvent<'product.updated', Record<string, unknown>>;
