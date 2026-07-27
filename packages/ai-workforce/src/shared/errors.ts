/** Typed errors used consistently across the AI Workforce runtime implementations. @module shared/errors */

export class WorkerNotFoundError extends Error {
  constructor(readonly workerId: string) {
    super(`Worker "${workerId}" not found`);
    this.name = 'WorkerNotFoundError';
  }
}

export class InvalidWorkerTransitionError extends Error {
  constructor(
    readonly workerId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Worker "${workerId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidWorkerTransitionError';
  }
}

export class WorkerAlreadyRegisteredError extends Error {
  constructor(readonly workerId: string) {
    super(`Worker "${workerId}" is already registered`);
    this.name = 'WorkerAlreadyRegisteredError';
  }
}

export class CapacityExceededError extends Error {
  constructor(
    readonly workerId: string,
    readonly maxConcurrentTasks: number,
  ) {
    super(`Worker "${workerId}" has no remaining capacity (max ${maxConcurrentTasks})`);
    this.name = 'CapacityExceededError';
  }
}

export class NoSuitableWorkerError extends Error {
  constructor(readonly role: string) {
    super(`No available worker found for role "${role}"`);
    this.name = 'NoSuitableWorkerError';
  }
}

export class AssignmentNotFoundError extends Error {
  constructor(readonly assignmentId: string) {
    super(`Assignment "${assignmentId}" not found`);
    this.name = 'AssignmentNotFoundError';
  }
}

export class InvalidAssignmentTransitionError extends Error {
  constructor(
    readonly assignmentId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Assignment "${assignmentId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidAssignmentTransitionError';
  }
}

export class PermissionDeniedError extends Error {
  constructor(
    readonly workerId: string,
    readonly reason: string,
  ) {
    super(`Worker "${workerId}" does not satisfy capability requirement: ${reason}`);
    this.name = 'PermissionDeniedError';
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
