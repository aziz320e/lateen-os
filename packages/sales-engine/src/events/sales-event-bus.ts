/**
 * Real, typed event bus for the Sales Engine runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/sales-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type SalesEventMap = {
  'opportunity.created': { readonly opportunityId: string; readonly organizationId: string; readonly name: string };
  'opportunity.qualified': { readonly opportunityId: string; readonly organizationId: string };
  'proposal.created': { readonly opportunityId: string; readonly organizationId: string };
  'proposal.approved': { readonly opportunityId: string; readonly organizationId: string; readonly taskId: string };
  'negotiation.started': { readonly opportunityId: string; readonly organizationId: string };
  'deal.won': { readonly opportunityId: string; readonly organizationId: string; readonly amount?: string };
  'deal.lost': { readonly opportunityId: string; readonly organizationId: string; readonly reason?: string };
  'quote.created': { readonly quoteId: string; readonly organizationId: string; readonly opportunityId?: string };
  'forecast.updated': { readonly forecastId: string; readonly organizationId: string; readonly weightedPipelineValue: string };
};

export type SalesEventBus = EventBus<SalesEventMap>;

/** Creates an in-memory {@link SalesEventBus}. */
export function createSalesEventBus(): SalesEventBus {
  return createEventBus<SalesEventMap>();
}
