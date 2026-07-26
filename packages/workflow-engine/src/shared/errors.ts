/** Typed errors used consistently across the Workflow Engine's implementations. @module shared/errors */

export class WorkflowDefinitionNotFoundError extends Error {
  constructor(readonly definitionId: string) {
    super(`Workflow definition "${definitionId}" not found`);
    this.name = 'WorkflowDefinitionNotFoundError';
  }
}

export class WorkflowVersionNotFoundError extends Error {
  constructor(readonly versionId: string) {
    super(`Workflow version "${versionId}" not found`);
    this.name = 'WorkflowVersionNotFoundError';
  }
}

export class WorkflowInstanceNotFoundError extends Error {
  constructor(readonly instanceId: string) {
    super(`Workflow instance "${instanceId}" not found`);
    this.name = 'WorkflowInstanceNotFoundError';
  }
}

export class StepInstanceNotFoundError extends Error {
  constructor(readonly stepInstanceId: string) {
    super(`Step instance "${stepInstanceId}" not found`);
    this.name = 'StepInstanceNotFoundError';
  }
}

export class WorkflowStepNotFoundError extends Error {
  constructor(
    readonly stepId: string,
    readonly versionId: string,
  ) {
    super(`Step "${stepId}" not found in workflow version "${versionId}"`);
    this.name = 'WorkflowStepNotFoundError';
  }
}

export class InvalidWorkflowTransitionError extends Error {
  constructor(
    readonly instanceId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Workflow instance "${instanceId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidWorkflowTransitionError';
  }
}

export class InvalidStepTransitionError extends Error {
  constructor(
    readonly stepInstanceId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Step instance "${stepInstanceId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidStepTransitionError';
  }
}

export class UnsupportedExpressionLanguageError extends Error {
  constructor(readonly language: string) {
    super(`Expression language "${language}" is not supported — bring your own evaluator for it`);
    this.name = 'UnsupportedExpressionLanguageError';
  }
}

export class ConditionEvaluationError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ConditionEvaluationError';
  }
}

export class WaitNotElapsedError extends Error {
  constructor(
    readonly stepInstanceId: string,
    readonly resumeAt: string,
  ) {
    super(`Step instance "${stepInstanceId}" cannot resume before "${resumeAt}"`);
    this.name = 'WaitNotElapsedError';
  }
}

export class NoOutgoingTransitionError extends Error {
  constructor(readonly stepId: string) {
    super(`Step "${stepId}" has no matching outgoing transition and is not a terminal step`);
    this.name = 'NoOutgoingTransitionError';
  }
}
