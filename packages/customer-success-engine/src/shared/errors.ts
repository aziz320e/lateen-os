/** Typed errors used consistently across the Customer Success Engine runtime implementations. @module shared/errors */

export class CustomerSuccessRecordNotFoundError extends Error {
  constructor(readonly customerSuccessRecordId: string) {
    super(`Customer success record "${customerSuccessRecordId}" not found`);
    this.name = 'CustomerSuccessRecordNotFoundError';
  }
}

export class InvalidCustomerSuccessTransitionError extends Error {
  constructor(
    readonly customerSuccessRecordId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Customer success record "${customerSuccessRecordId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidCustomerSuccessTransitionError';
  }
}

export class DuplicateCustomerSuccessRecordError extends Error {
  constructor(readonly customerId: string) {
    super(`A customer success record already exists for customer "${customerId}" in this organization`);
    this.name = 'DuplicateCustomerSuccessRecordError';
  }
}

export class HealthSnapshotNotFoundError extends Error {
  constructor(readonly healthSnapshotId: string) {
    super(`Health snapshot "${healthSnapshotId}" not found`);
    this.name = 'HealthSnapshotNotFoundError';
  }
}

export class SuccessPlanNotFoundError extends Error {
  constructor(readonly planId: string) {
    super(`Success plan "${planId}" not found`);
    this.name = 'SuccessPlanNotFoundError';
  }
}

export class InvalidSuccessPlanTransitionError extends Error {
  constructor(
    readonly planId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Success plan "${planId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidSuccessPlanTransitionError';
  }
}

export class PlanObjectiveNotFoundError extends Error {
  constructor(readonly objectiveId: string) {
    super(`Plan objective "${objectiveId}" not found`);
    this.name = 'PlanObjectiveNotFoundError';
  }
}

export class PlanMilestoneNotFoundError extends Error {
  constructor(readonly milestoneId: string) {
    super(`Plan milestone "${milestoneId}" not found`);
    this.name = 'PlanMilestoneNotFoundError';
  }
}

export class InvalidPlanMilestoneTransitionError extends Error {
  constructor(
    readonly milestoneId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Plan milestone "${milestoneId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidPlanMilestoneTransitionError';
  }
}

export class PlanTaskNotFoundError extends Error {
  constructor(readonly taskId: string) {
    super(`Plan task "${taskId}" not found`);
    this.name = 'PlanTaskNotFoundError';
  }
}

export class InvalidPlanTaskTransitionError extends Error {
  constructor(
    readonly taskId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Plan task "${taskId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidPlanTaskTransitionError';
  }
}

export class RenewalNotFoundError extends Error {
  constructor(readonly renewalId: string) {
    super(`Renewal "${renewalId}" not found`);
    this.name = 'RenewalNotFoundError';
  }
}

export class InvalidRenewalTransitionError extends Error {
  constructor(
    readonly renewalId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Renewal "${renewalId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidRenewalTransitionError';
  }
}

export class ExpansionOpportunityNotFoundError extends Error {
  constructor(readonly expansionOpportunityId: string) {
    super(`Expansion opportunity "${expansionOpportunityId}" not found`);
    this.name = 'ExpansionOpportunityNotFoundError';
  }
}

export class InvalidExpansionTransitionError extends Error {
  constructor(
    readonly expansionOpportunityId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Expansion opportunity "${expansionOpportunityId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidExpansionTransitionError';
  }
}

export class CustomerRiskNotFoundError extends Error {
  constructor(readonly riskId: string) {
    super(`Customer risk "${riskId}" not found`);
    this.name = 'CustomerRiskNotFoundError';
  }
}

export class InvalidCustomerRiskTransitionError extends Error {
  constructor(
    readonly riskId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Customer risk "${riskId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidCustomerRiskTransitionError';
  }
}

export class FeedbackEntryNotFoundError extends Error {
  constructor(readonly feedbackEntryId: string) {
    super(`Feedback entry "${feedbackEntryId}" not found`);
    this.name = 'FeedbackEntryNotFoundError';
  }
}
