/** Typed errors used consistently across the Project Management Engine runtime implementations. @module shared/errors */

export class PortfolioNotFoundError extends Error {
  constructor(readonly portfolioId: string) {
    super(`Portfolio "${portfolioId}" not found`);
    this.name = 'PortfolioNotFoundError';
  }
}

export class ProgramNotFoundError extends Error {
  constructor(readonly programId: string) {
    super(`Program "${programId}" not found`);
    this.name = 'ProgramNotFoundError';
  }
}

export class ProjectNotFoundError extends Error {
  constructor(readonly projectId: string) {
    super(`Project "${projectId}" not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export class DuplicateProjectCodeError extends Error {
  constructor(readonly code: string) {
    super(`Project code "${code}" already exists in this organization`);
    this.name = 'DuplicateProjectCodeError';
  }
}

export class InvalidPhaseTransitionError extends Error {
  constructor(
    readonly phaseId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Phase "${phaseId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidPhaseTransitionError';
  }
}

export class InvalidMilestoneTransitionError extends Error {
  constructor(
    readonly milestoneId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Milestone "${milestoneId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidMilestoneTransitionError';
  }
}

export class InvalidProjectTransitionError extends Error {
  constructor(
    readonly projectId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Project "${projectId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidProjectTransitionError';
  }
}

export class MilestoneNotFoundError extends Error {
  constructor(readonly milestoneId: string) {
    super(`Milestone "${milestoneId}" not found`);
    this.name = 'MilestoneNotFoundError';
  }
}

export class PhaseNotFoundError extends Error {
  constructor(readonly phaseId: string) {
    super(`Phase "${phaseId}" not found`);
    this.name = 'PhaseNotFoundError';
  }
}

export class ProjectTaskNotFoundError extends Error {
  constructor(readonly taskId: string) {
    super(`Task "${taskId}" not found`);
    this.name = 'ProjectTaskNotFoundError';
  }
}

export class InvalidTaskTransitionError extends Error {
  constructor(
    readonly taskId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Task "${taskId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidTaskTransitionError';
  }
}

export class TaskBlockedByDependencyError extends Error {
  constructor(
    readonly taskId: string,
    readonly incompleteDependencyIds: readonly string[],
  ) {
    super(`Task "${taskId}" cannot start — incomplete dependencies: ${incompleteDependencyIds.join(', ')}`);
    this.name = 'TaskBlockedByDependencyError';
  }
}

export class CircularTaskDependencyError extends Error {
  constructor(
    readonly taskId: string,
    readonly dependsOnTaskId: string,
  ) {
    super(`Task "${taskId}" cannot depend on "${dependsOnTaskId}" — this would create a circular dependency`);
    this.name = 'CircularTaskDependencyError';
  }
}

export class ResourceAssignmentNotFoundError extends Error {
  constructor(readonly assignmentId: string) {
    super(`Resource assignment "${assignmentId}" not found`);
    this.name = 'ResourceAssignmentNotFoundError';
  }
}

export class OverAllocationError extends Error {
  constructor(
    readonly assigneeId: string,
    readonly requestedPercentage: number,
    readonly availablePercentage: number,
  ) {
    super(`Assignee "${assigneeId}" cannot be allocated ${requestedPercentage}% — only ${availablePercentage}% capacity remains`);
    this.name = 'OverAllocationError';
  }
}

export class ScheduleNotFoundError extends Error {
  constructor(readonly scheduleId: string) {
    super(`Schedule "${scheduleId}" not found`);
    this.name = 'ScheduleNotFoundError';
  }
}

export class WorkLogNotFoundError extends Error {
  constructor(readonly workLogId: string) {
    super(`Work log "${workLogId}" not found`);
    this.name = 'WorkLogNotFoundError';
  }
}

export class ProjectBudgetNotFoundError extends Error {
  constructor(readonly budgetId: string) {
    super(`Project budget "${budgetId}" not found`);
    this.name = 'ProjectBudgetNotFoundError';
  }
}

export class MaterialRequirementNotFoundError extends Error {
  constructor(readonly requirementId: string) {
    super(`Material requirement "${requirementId}" not found`);
    this.name = 'MaterialRequirementNotFoundError';
  }
}

export class ProjectRiskNotFoundError extends Error {
  constructor(readonly riskId: string) {
    super(`Project risk "${riskId}" not found`);
    this.name = 'ProjectRiskNotFoundError';
  }
}

export class InvalidRiskTransitionError extends Error {
  constructor(
    readonly riskId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Risk "${riskId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidRiskTransitionError';
  }
}

export class DeliverableNotFoundError extends Error {
  constructor(readonly deliverableId: string) {
    super(`Deliverable "${deliverableId}" not found`);
    this.name = 'DeliverableNotFoundError';
  }
}

export class InvalidDeliverableTransitionError extends Error {
  constructor(
    readonly deliverableId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Deliverable "${deliverableId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidDeliverableTransitionError';
  }
}
