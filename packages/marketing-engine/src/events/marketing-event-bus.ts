/**
 * Real, typed event bus for the Marketing Engine runtime, built on
 * shared-kernel's generic {@link createEventBus}.
 *
 * @module events/marketing-event-bus
 */
import { createEventBus, type EventBus } from '@lateen-os/shared-kernel/events';

// A `type` alias (not `interface`) is required for createEventBus's
// `Record<string, unknown>` constraint.
export type MarketingEventMap = {
  'campaign.created': { readonly campaignId: string; readonly organizationId: string; readonly name: string };
  'campaign.launched': { readonly campaignId: string; readonly organizationId: string };
  'campaign.paused': { readonly campaignId: string; readonly organizationId: string };
  'campaign.completed': { readonly campaignId: string; readonly organizationId: string };
  'lead.generated': { readonly leadId: string; readonly organizationId: string; readonly source: string };
  'lead.scored': { readonly leadId: string; readonly organizationId: string; readonly score: number };
  'content.created': { readonly contentItemId: string; readonly organizationId: string; readonly contentType: string };
  'workflow.requested': { readonly workflowRequestId: string; readonly organizationId: string; readonly requestType: string };
  'metrics.updated': { readonly campaignId: string; readonly organizationId: string };
};

export type MarketingEventBus = EventBus<MarketingEventMap>;

/** Creates an in-memory {@link MarketingEventBus}. */
export function createMarketingEventBus(): MarketingEventBus {
  return createEventBus<MarketingEventMap>();
}
