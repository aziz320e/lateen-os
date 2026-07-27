/** Typed errors used consistently across the Sales Engine runtime implementations. @module shared/errors */

export class SalesOpportunityNotFoundError extends Error {
  constructor(readonly opportunityId: string) {
    super(`Sales opportunity "${opportunityId}" not found`);
    this.name = 'SalesOpportunityNotFoundError';
  }
}

export class InvalidSalesStageTransitionError extends Error {
  constructor(
    readonly opportunityId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Sales opportunity "${opportunityId}" cannot move from stage "${from}" to "${to}"`);
    this.name = 'InvalidSalesStageTransitionError';
  }
}

export class QuoteNotFoundError extends Error {
  constructor(readonly quoteId: string) {
    super(`Quote "${quoteId}" not found`);
    this.name = 'QuoteNotFoundError';
  }
}

export class InvalidQuoteTransitionError extends Error {
  constructor(
    readonly quoteId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Quote "${quoteId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidQuoteTransitionError';
  }
}

export class ForecastSnapshotNotFoundError extends Error {
  constructor(readonly forecastId: string) {
    super(`Forecast snapshot "${forecastId}" not found`);
    this.name = 'ForecastSnapshotNotFoundError';
  }
}

export class CommissionPlanNotFoundError extends Error {
  constructor(readonly commissionPlanId: string) {
    super(`Commission plan "${commissionPlanId}" not found`);
    this.name = 'CommissionPlanNotFoundError';
  }
}

export class SalesActivityNotFoundError extends Error {
  constructor(readonly activityId: string) {
    super(`Sales activity "${activityId}" not found`);
    this.name = 'SalesActivityNotFoundError';
  }
}

export class SalesTaskNotFoundError extends Error {
  constructor(readonly taskId: string) {
    super(`Sales task "${taskId}" not found`);
    this.name = 'SalesTaskNotFoundError';
  }
}

export class InvalidSalesTaskTransitionError extends Error {
  constructor(
    readonly taskId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Sales task "${taskId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidSalesTaskTransitionError';
  }
}
