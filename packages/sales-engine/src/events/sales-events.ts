/** @module events/sales-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type OpportunityEventName =
  | DomainEventName<'opportunity', 'created'>
  | DomainEventName<'opportunity', 'qualified'>;

export type OpportunityDomainEvent =
  | DomainEvent<'opportunity.created', { readonly opportunityId: string; readonly organizationId: string; readonly name: string }>
  | DomainEvent<'opportunity.qualified', { readonly opportunityId: string; readonly organizationId: string }>;

export type ProposalEventName = DomainEventName<'proposal', 'created'> | DomainEventName<'proposal', 'approved'>;

export type ProposalDomainEvent =
  | DomainEvent<'proposal.created', { readonly opportunityId: string; readonly organizationId: string }>
  | DomainEvent<'proposal.approved', { readonly opportunityId: string; readonly organizationId: string; readonly taskId: string }>;

export type NegotiationEventName = DomainEventName<'negotiation', 'started'>;

export type NegotiationDomainEvent = DomainEvent<'negotiation.started', { readonly opportunityId: string; readonly organizationId: string }>;

export type DealEventName = DomainEventName<'deal', 'won'> | DomainEventName<'deal', 'lost'>;

export type DealDomainEvent =
  | DomainEvent<'deal.won', { readonly opportunityId: string; readonly organizationId: string; readonly amount?: string }>
  | DomainEvent<'deal.lost', { readonly opportunityId: string; readonly organizationId: string; readonly reason?: string }>;

export type QuoteEventName = DomainEventName<'quote', 'created'>;

export type QuoteDomainEvent = DomainEvent<
  'quote.created',
  { readonly quoteId: string; readonly organizationId: string; readonly opportunityId?: string }
>;

export type ForecastEventName = DomainEventName<'forecast', 'updated'>;

export type ForecastDomainEvent = DomainEvent<
  'forecast.updated',
  { readonly forecastId: string; readonly organizationId: string; readonly weightedPipelineValue: string }
>;

/** Canonical event names for external subscribers. */
export const SALES_EVENT_NAMES = {
  OpportunityCreated: 'opportunity.created',
  OpportunityQualified: 'opportunity.qualified',
  ProposalCreated: 'proposal.created',
  ProposalApproved: 'proposal.approved',
  NegotiationStarted: 'negotiation.started',
  DealWon: 'deal.won',
  DealLost: 'deal.lost',
  QuoteCreated: 'quote.created',
  ForecastUpdated: 'forecast.updated',
} as const;

/** Union of all Sales Engine domain events. */
export type SalesDomainEvent =
  | OpportunityDomainEvent
  | ProposalDomainEvent
  | NegotiationDomainEvent
  | DealDomainEvent
  | QuoteDomainEvent
  | ForecastDomainEvent;
