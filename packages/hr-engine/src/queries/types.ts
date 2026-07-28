/** @module queries/types */
import type { Department, DepartmentId, DepartmentStatus, UnitType } from '../department/types.js';
import type { AbsenceRecordId, WorkSession, WorkSessionId } from '../attendance/types.js';
import type { Employee, EmployeeId, EmploymentStatus } from '../employee/types.js';
import type { LeaveRequest, LeaveRequestId, LeaveRequestStatus } from '../leave/types.js';
import type { PayrollRun, PayrollRunId, PayrollRunStatus } from '../payroll/types.js';
import type { Evaluation, EvaluationId } from '../performance/types.js';
import type { CourseId, TrainingCompletion, TrainingCompletionId } from '../training/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';

export interface FindEmployeesQuery extends OrganizationScopedQuery {
  readonly departmentId?: DepartmentId;
  readonly employmentStatus?: EmploymentStatus;
}

export interface FindEmployeesResult {
  readonly employees: readonly Employee[];
  readonly total: number;
}

export interface FindDepartmentsQuery extends OrganizationScopedQuery {
  readonly unitType?: UnitType;
  readonly status?: DepartmentStatus;
}

export interface FindDepartmentsResult {
  readonly departments: readonly Department[];
  readonly total: number;
}

export interface FindAttendanceQuery extends OrganizationScopedQuery {
  readonly employeeId?: EmployeeId;
}

export interface FindAttendanceResult {
  readonly sessions: readonly WorkSession[];
  readonly total: number;
}

export interface FindLeaveRequestsQuery extends OrganizationScopedQuery {
  readonly employeeId?: EmployeeId;
  readonly status?: LeaveRequestStatus;
}

export interface FindLeaveRequestsResult {
  readonly requests: readonly LeaveRequest[];
  readonly total: number;
}

export interface FindPayrollDataQuery extends OrganizationScopedQuery {
  readonly status?: PayrollRunStatus;
}

export interface FindPayrollDataResult {
  readonly runs: readonly PayrollRun[];
  readonly total: number;
}

export interface FindPerformanceQuery extends OrganizationScopedQuery {
  readonly employeeId?: EmployeeId;
}

export interface FindPerformanceResult {
  readonly evaluations: readonly Evaluation[];
  readonly total: number;
}

export interface FindTrainingQuery extends OrganizationScopedQuery {
  readonly employeeId?: EmployeeId;
  readonly courseId?: CourseId;
}

export interface FindTrainingResult {
  readonly completions: readonly TrainingCompletion[];
  readonly total: number;
}

export interface SearchHrQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export type SearchHrRecordType = 'employee' | 'department' | 'course';

export interface SearchHrMatch {
  readonly recordType: SearchHrRecordType;
  readonly id: EmployeeId | DepartmentId | CourseId | WorkSessionId | AbsenceRecordId | LeaveRequestId | PayrollRunId | EvaluationId | TrainingCompletionId;
  readonly label: string;
  readonly score: number;
}

export interface SearchHrResult {
  readonly matches: readonly SearchHrMatch[];
  readonly total: number;
}

export type { OrganizationId };
