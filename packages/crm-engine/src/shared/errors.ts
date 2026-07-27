/** Typed errors used consistently across the CRM Engine runtime implementations. @module shared/errors */

export class CustomerNotFoundError extends Error {
  constructor(readonly customerId: string) {
    super(`Customer "${customerId}" not found`);
    this.name = 'CustomerNotFoundError';
  }
}

export class InvalidCustomerTransitionError extends Error {
  constructor(
    readonly customerId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Customer "${customerId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidCustomerTransitionError';
  }
}

export class LeadNotFoundError extends Error {
  constructor(readonly leadId: string) {
    super(`Lead "${leadId}" not found`);
    this.name = 'LeadNotFoundError';
  }
}

export class InvalidLeadTransitionError extends Error {
  constructor(
    readonly leadId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Lead "${leadId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidLeadTransitionError';
  }
}

export class ContactNotFoundError extends Error {
  constructor(readonly contactId: string) {
    super(`Contact "${contactId}" not found`);
    this.name = 'ContactNotFoundError';
  }
}

export class AccountNotFoundError extends Error {
  constructor(readonly accountId: string) {
    super(`Account "${accountId}" not found`);
    this.name = 'AccountNotFoundError';
  }
}

export class InvalidRecordTransitionError extends Error {
  constructor(
    readonly entity: string,
    readonly id: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`${entity} "${id}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidRecordTransitionError';
  }
}

export class OpportunityNotFoundError extends Error {
  constructor(readonly opportunityId: string) {
    super(`Opportunity "${opportunityId}" not found`);
    this.name = 'OpportunityNotFoundError';
  }
}

export class InvalidDealStageTransitionError extends Error {
  constructor(
    readonly opportunityId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Opportunity "${opportunityId}" cannot move from stage "${from}" to "${to}"`);
    this.name = 'InvalidDealStageTransitionError';
  }
}

export class ActivityNotFoundError extends Error {
  constructor(readonly activityId: string) {
    super(`Activity "${activityId}" not found`);
    this.name = 'ActivityNotFoundError';
  }
}

export class NotFoundError extends Error {
  constructor(
    readonly entity: string,
    readonly id: string,
  ) {
    super(`${entity} "${id}" not found`);
    this.name = 'NotFoundError';
  }
}
