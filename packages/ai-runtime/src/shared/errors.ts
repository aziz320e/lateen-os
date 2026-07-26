/** Typed runtime errors used consistently across ai-runtime's implementations. @module shared/errors */

export class ProviderError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class TaskExecutionError extends Error {
  constructor(
    message: string,
    readonly taskId: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TaskExecutionError';
  }
}

export class ToolExecutionError extends Error {
  constructor(
    message: string,
    readonly toolId: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

export class PlanningError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PlanningError';
  }
}
