/** Typed errors used consistently across the Business DNA runtime implementations. @module shared/errors */

export class OrganizationNotFoundError extends Error {
  constructor(readonly organizationId: string) {
    super(`Organization "${organizationId}" not found`);
    this.name = 'OrganizationNotFoundError';
  }
}

export class InvalidOrganizationTransitionError extends Error {
  constructor(
    readonly organizationId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Organization "${organizationId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidOrganizationTransitionError';
  }
}

export class OrganizationCodeConflictError extends Error {
  constructor(readonly code: string) {
    super(`Organization code "${code}" is already in use`);
    this.name = 'OrganizationCodeConflictError';
  }
}

export class ProductNotFoundError extends Error {
  constructor(readonly productId: string) {
    super(`Product "${productId}" not found`);
    this.name = 'ProductNotFoundError';
  }
}

export class InvalidProductTransitionError extends Error {
  constructor(
    readonly productId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Product "${productId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidProductTransitionError';
  }
}

export class ProductBundleNotFoundError extends Error {
  constructor(readonly bundleId: string) {
    super(`Product bundle "${bundleId}" not found`);
    this.name = 'ProductBundleNotFoundError';
  }
}

export class PolicyNotFoundError extends Error {
  constructor(readonly policyId: string) {
    super(`Policy "${policyId}" not found`);
    this.name = 'PolicyNotFoundError';
  }
}

export class InvalidPolicyTransitionError extends Error {
  constructor(
    readonly policyId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Policy "${policyId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidPolicyTransitionError';
  }
}

export class InvalidObjectiveTransitionError extends Error {
  constructor(
    readonly objectiveId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Strategic objective "${objectiveId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidObjectiveTransitionError';
  }
}

export class OperatingMarketNotFoundError extends Error {
  constructor(readonly marketId: string) {
    super(`Operating market "${marketId}" not found`);
    this.name = 'OperatingMarketNotFoundError';
  }
}

export class DuplicateOperatingMarketError extends Error {
  constructor(readonly countryCode: string) {
    super(`Operating market for country "${countryCode}" already exists`);
    this.name = 'DuplicateOperatingMarketError';
  }
}

export class CompetitorNotFoundError extends Error {
  constructor(readonly competitorId: string) {
    super(`Competitor "${competitorId}" not found`);
    this.name = 'CompetitorNotFoundError';
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
