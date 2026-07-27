/** @module events/marketing-events */
import type { DomainEvent, DomainEventName } from '@lateen-os/shared-kernel/core';

export type CampaignEventName =
  | DomainEventName<'campaign', 'created'>
  | DomainEventName<'campaign', 'launched'>
  | DomainEventName<'campaign', 'paused'>
  | DomainEventName<'campaign', 'completed'>;

export type CampaignDomainEvent =
  | DomainEvent<'campaign.created', { readonly campaignId: string; readonly organizationId: string; readonly name: string }>
  | DomainEvent<'campaign.launched', { readonly campaignId: string; readonly organizationId: string }>
  | DomainEvent<'campaign.paused', { readonly campaignId: string; readonly organizationId: string }>
  | DomainEvent<'campaign.completed', { readonly campaignId: string; readonly organizationId: string }>;

export type LeadEventName = DomainEventName<'lead', 'generated'> | DomainEventName<'lead', 'scored'>;

export type LeadDomainEvent =
  | DomainEvent<'lead.generated', { readonly leadId: string; readonly organizationId: string; readonly source: string }>
  | DomainEvent<'lead.scored', { readonly leadId: string; readonly organizationId: string; readonly score: number }>;

export type ContentEventName = DomainEventName<'content', 'created'>;

export type ContentDomainEvent = DomainEvent<
  'content.created',
  { readonly contentItemId: string; readonly organizationId: string; readonly contentType: string }
>;

export type WorkflowEventName = DomainEventName<'workflow', 'requested'>;

export type WorkflowDomainEvent = DomainEvent<
  'workflow.requested',
  { readonly workflowRequestId: string; readonly organizationId: string; readonly requestType: string }
>;

export type MetricsEventName = DomainEventName<'metrics', 'updated'>;

export type MetricsDomainEvent = DomainEvent<
  'metrics.updated',
  { readonly campaignId: string; readonly organizationId: string }
>;

/** Canonical event names for external subscribers. */
export const MARKETING_EVENT_NAMES = {
  CampaignCreated: 'campaign.created',
  CampaignLaunched: 'campaign.launched',
  CampaignPaused: 'campaign.paused',
  CampaignCompleted: 'campaign.completed',
  LeadGenerated: 'lead.generated',
  LeadScored: 'lead.scored',
  ContentCreated: 'content.created',
  WorkflowRequested: 'workflow.requested',
  MetricsUpdated: 'metrics.updated',
} as const;

/** Union of all Marketing Engine domain events. */
export type MarketingDomainEvent = CampaignDomainEvent | LeadDomainEvent | ContentDomainEvent | WorkflowDomainEvent | MetricsDomainEvent;
