/** Typed errors used consistently across the Institutional Memory runtime implementations. @module shared/errors */

export class KnowledgeEntryNotFoundError extends Error {
  constructor(readonly knowledgeEntryId: string) {
    super(`Knowledge entry "${knowledgeEntryId}" not found`);
    this.name = 'KnowledgeEntryNotFoundError';
  }
}

export class InvalidKnowledgeTransitionError extends Error {
  constructor(
    readonly knowledgeEntryId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Knowledge entry "${knowledgeEntryId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidKnowledgeTransitionError';
  }
}

export class KnowledgeEntryVersionNotFoundError extends Error {
  constructor(
    readonly knowledgeEntryId: string,
    readonly revisionNumber: number,
  ) {
    super(`Knowledge entry "${knowledgeEntryId}" has no revision ${revisionNumber}`);
    this.name = 'KnowledgeEntryVersionNotFoundError';
  }
}

export class CircularRelationshipError extends Error {
  constructor(readonly knowledgeEntryId: string) {
    super(`Relationship would create a cycle involving knowledge entry "${knowledgeEntryId}"`);
    this.name = 'CircularRelationshipError';
  }
}

export class OwnershipValidationError extends Error {
  constructor(
    readonly knowledgeEntryId: string,
    readonly reason: string,
  ) {
    super(`Knowledge entry "${knowledgeEntryId}" failed ownership validation: ${reason}`);
    this.name = 'OwnershipValidationError';
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
