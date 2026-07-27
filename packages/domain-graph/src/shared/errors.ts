/** Typed errors used consistently across the Domain Graph runtime implementations. @module shared/errors */

export class DomainGraphNotFoundError extends Error {
  constructor(readonly graphId: string) {
    super(`Domain graph "${graphId}" not found`);
    this.name = 'DomainGraphNotFoundError';
  }
}

export class InvalidGraphTransitionError extends Error {
  constructor(
    readonly graphId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Domain graph "${graphId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidGraphTransitionError';
  }
}

export class GraphEntityNotFoundError extends Error {
  constructor(readonly nodeId: string) {
    super(`Graph entity "${nodeId}" not found`);
    this.name = 'GraphEntityNotFoundError';
  }
}

export class DanglingRelationshipError extends Error {
  constructor(
    readonly nodeId: string,
    readonly role: 'source' | 'target',
  ) {
    super(`Relationship ${role} node "${nodeId}" does not exist`);
    this.name = 'DanglingRelationshipError';
  }
}

export class GraphRelationshipNotFoundError extends Error {
  constructor(readonly relationshipId: string) {
    super(`Graph relationship "${relationshipId}" not found`);
    this.name = 'GraphRelationshipNotFoundError';
  }
}

export class CyclicDependencyError extends Error {
  constructor(readonly cycle: readonly string[]) {
    super(`Dependency ordering is impossible — cycle detected: ${cycle.join(' -> ')}`);
    this.name = 'CyclicDependencyError';
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
