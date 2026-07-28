/** Typed errors used consistently across the HR Engine runtime implementations. @module shared/errors */

export class DepartmentNotFoundError extends Error {
  constructor(readonly departmentId: string) {
    super(`Department "${departmentId}" not found`);
    this.name = 'DepartmentNotFoundError';
  }
}

export class InvalidDepartmentTransitionError extends Error {
  constructor(
    readonly departmentId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Department "${departmentId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidDepartmentTransitionError';
  }
}

export class PositionNotFoundError extends Error {
  constructor(readonly positionId: string) {
    super(`Position "${positionId}" not found`);
    this.name = 'PositionNotFoundError';
  }
}

export class InvalidPositionTransitionError extends Error {
  constructor(
    readonly positionId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Position "${positionId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidPositionTransitionError';
  }
}

export class NoVacancyError extends Error {
  constructor(readonly positionId: string) {
    super(`Position "${positionId}" has no remaining vacancy`);
    this.name = 'NoVacancyError';
  }
}

export class EmployeeNotFoundError extends Error {
  constructor(readonly employeeId: string) {
    super(`Employee "${employeeId}" not found`);
    this.name = 'EmployeeNotFoundError';
  }
}

export class InvalidEmployeeTransitionError extends Error {
  constructor(
    readonly employeeId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Employee "${employeeId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidEmployeeTransitionError';
  }
}

export class WorkSessionNotFoundError extends Error {
  constructor(readonly workSessionId: string) {
    super(`Work session "${workSessionId}" not found`);
    this.name = 'WorkSessionNotFoundError';
  }
}

export class OpenWorkSessionExistsError extends Error {
  constructor(readonly employeeId: string) {
    super(`Employee "${employeeId}" already has an open work session`);
    this.name = 'OpenWorkSessionExistsError';
  }
}

export class WorkSessionAlreadyClosedError extends Error {
  constructor(readonly workSessionId: string) {
    super(`Work session "${workSessionId}" is already closed`);
    this.name = 'WorkSessionAlreadyClosedError';
  }
}

export class LeaveRequestNotFoundError extends Error {
  constructor(readonly leaveRequestId: string) {
    super(`Leave request "${leaveRequestId}" not found`);
    this.name = 'LeaveRequestNotFoundError';
  }
}

export class InvalidLeaveTransitionError extends Error {
  constructor(
    readonly leaveRequestId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Leave request "${leaveRequestId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidLeaveTransitionError';
  }
}

export class InsufficientLeaveBalanceError extends Error {
  constructor(
    readonly employeeId: string,
    readonly requested: number,
    readonly remaining: number,
  ) {
    super(`Employee "${employeeId}" requested ${requested} day(s) but only has ${remaining} remaining`);
    this.name = 'InsufficientLeaveBalanceError';
  }
}

export class PayrollRunNotFoundError extends Error {
  constructor(readonly payrollRunId: string) {
    super(`Payroll run "${payrollRunId}" not found`);
    this.name = 'PayrollRunNotFoundError';
  }
}

export class PayrollRunFinalizedError extends Error {
  constructor(readonly payrollRunId: string) {
    super(`Payroll run "${payrollRunId}" is already finalized`);
    this.name = 'PayrollRunFinalizedError';
  }
}

export class ReviewPeriodNotFoundError extends Error {
  constructor(readonly reviewPeriodId: string) {
    super(`Review period "${reviewPeriodId}" not found`);
    this.name = 'ReviewPeriodNotFoundError';
  }
}

export class ObjectiveNotFoundError extends Error {
  constructor(readonly objectiveId: string) {
    super(`Objective "${objectiveId}" not found`);
    this.name = 'ObjectiveNotFoundError';
  }
}

export class EvaluationNotFoundError extends Error {
  constructor(readonly evaluationId: string) {
    super(`Evaluation "${evaluationId}" not found`);
    this.name = 'EvaluationNotFoundError';
  }
}

export class CourseNotFoundError extends Error {
  constructor(readonly courseId: string) {
    super(`Course "${courseId}" not found`);
    this.name = 'CourseNotFoundError';
  }
}

export class CertificationNotFoundError extends Error {
  constructor(readonly certificationId: string) {
    super(`Certification "${certificationId}" not found`);
    this.name = 'CertificationNotFoundError';
  }
}
