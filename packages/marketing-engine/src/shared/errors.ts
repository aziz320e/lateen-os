/** Typed errors used consistently across the Marketing Engine runtime implementations. @module shared/errors */

export class CampaignNotFoundError extends Error {
  constructor(readonly campaignId: string) {
    super(`Campaign "${campaignId}" not found`);
    this.name = 'CampaignNotFoundError';
  }
}

export class InvalidCampaignTransitionError extends Error {
  constructor(
    readonly campaignId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Campaign "${campaignId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidCampaignTransitionError';
  }
}

export class AudienceNotFoundError extends Error {
  constructor(readonly audienceId: string) {
    super(`Audience "${audienceId}" not found`);
    this.name = 'AudienceNotFoundError';
  }
}

export class MarketingLeadNotFoundError extends Error {
  constructor(readonly leadId: string) {
    super(`Marketing lead "${leadId}" not found`);
    this.name = 'MarketingLeadNotFoundError';
  }
}

export class ContentItemNotFoundError extends Error {
  constructor(readonly contentItemId: string) {
    super(`Content item "${contentItemId}" not found`);
    this.name = 'ContentItemNotFoundError';
  }
}

export class InvalidContentTransitionError extends Error {
  constructor(
    readonly contentItemId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Content item "${contentItemId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidContentTransitionError';
  }
}

export class CalendarEntryNotFoundError extends Error {
  constructor(readonly calendarEntryId: string) {
    super(`Calendar entry "${calendarEntryId}" not found`);
    this.name = 'CalendarEntryNotFoundError';
  }
}

export class WorkflowRequestNotFoundError extends Error {
  constructor(readonly workflowRequestId: string) {
    super(`Workflow request "${workflowRequestId}" not found`);
    this.name = 'WorkflowRequestNotFoundError';
  }
}

export class InvalidWorkflowRequestTransitionError extends Error {
  constructor(
    readonly workflowRequestId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Workflow request "${workflowRequestId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidWorkflowRequestTransitionError';
  }
}
