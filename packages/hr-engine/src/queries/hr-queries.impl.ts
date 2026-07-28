/**
 * Real {@link HrQueries} implementation — a CQRS read layer composed
 * over the HR Engine repositories. Repositories are taken as
 * constructor dependencies but never returned to callers.
 *
 * @module queries/hr-queries.impl
 */
import type { WorkSessionRepository } from '../attendance/repository.js';
import type { DepartmentRepository } from '../department/repository.js';
import type { EmployeeRepository } from '../employee/repository.js';
import type { LeaveRequestRepository } from '../leave/repository.js';
import type { PayrollRunRepository } from '../payroll/repository.js';
import type { EvaluationRepository } from '../performance/repository.js';
import type { CourseRepository, TrainingCompletionRepository } from '../training/repository.js';
import type { HrQueries } from './hr-queries.js';
import type {
  FindAttendanceQuery,
  FindAttendanceResult,
  FindDepartmentsQuery,
  FindDepartmentsResult,
  FindEmployeesQuery,
  FindEmployeesResult,
  FindLeaveRequestsQuery,
  FindLeaveRequestsResult,
  FindPayrollDataQuery,
  FindPayrollDataResult,
  FindPerformanceQuery,
  FindPerformanceResult,
  FindTrainingQuery,
  FindTrainingResult,
  SearchHrMatch,
  SearchHrQuery,
  SearchHrResult,
} from './types.js';

export interface HrQueriesDeps {
  readonly employeeRepository: EmployeeRepository;
  readonly departmentRepository: DepartmentRepository;
  readonly workSessionRepository: WorkSessionRepository;
  readonly leaveRequestRepository: LeaveRequestRepository;
  readonly payrollRunRepository: PayrollRunRepository;
  readonly evaluationRepository: EvaluationRepository;
  readonly trainingCompletionRepository: TrainingCompletionRepository;
  readonly courseRepository: CourseRepository;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link HrQueries} read port over the given repositories. */
export function createHrQueries(deps: HrQueriesDeps): HrQueries {
  return {
    async findEmployees(query: FindEmployeesQuery): Promise<FindEmployeesResult> {
      let employees = query.departmentId
        ? await deps.employeeRepository.findByDepartment(query.organizationId, query.departmentId)
        : await deps.employeeRepository.findAll(query.organizationId);
      if (query.employmentStatus) employees = employees.filter((employee) => employee.employmentStatus === query.employmentStatus);
      return { employees: paginate(employees, query.offset, query.limit), total: employees.length };
    },

    async findDepartments(query: FindDepartmentsQuery): Promise<FindDepartmentsResult> {
      let departments = query.unitType
        ? await deps.departmentRepository.findByUnitType(query.organizationId, query.unitType)
        : await deps.departmentRepository.findAll(query.organizationId);
      if (query.status) departments = departments.filter((department) => department.status === query.status);
      return { departments: paginate(departments, query.offset, query.limit), total: departments.length };
    },

    async findAttendance(query: FindAttendanceQuery): Promise<FindAttendanceResult> {
      const sessions = query.employeeId
        ? await deps.workSessionRepository.findByEmployee(query.organizationId, query.employeeId)
        : await deps.workSessionRepository.findAll(query.organizationId);
      return { sessions: paginate(sessions, query.offset, query.limit), total: sessions.length };
    },

    async findLeaveRequests(query: FindLeaveRequestsQuery): Promise<FindLeaveRequestsResult> {
      let requests = query.employeeId
        ? await deps.leaveRequestRepository.findByEmployee(query.organizationId, query.employeeId)
        : await deps.leaveRequestRepository.findAll(query.organizationId);
      if (query.status) requests = requests.filter((request) => request.status === query.status);
      return { requests: paginate(requests, query.offset, query.limit), total: requests.length };
    },

    async findPayrollData(query: FindPayrollDataQuery): Promise<FindPayrollDataResult> {
      const runs = query.status
        ? await deps.payrollRunRepository.findByStatus(query.organizationId, query.status)
        : await deps.payrollRunRepository.findAll(query.organizationId);
      return { runs: paginate(runs, query.offset, query.limit), total: runs.length };
    },

    async findPerformance(query: FindPerformanceQuery): Promise<FindPerformanceResult> {
      const evaluations = query.employeeId
        ? await deps.evaluationRepository.findByEmployee(query.organizationId, query.employeeId)
        : await deps.evaluationRepository.findAll(query.organizationId);
      return { evaluations: paginate(evaluations, query.offset, query.limit), total: evaluations.length };
    },

    async findTraining(query: FindTrainingQuery): Promise<FindTrainingResult> {
      let completions = query.employeeId
        ? await deps.trainingCompletionRepository.findByEmployee(query.organizationId, query.employeeId)
        : await deps.trainingCompletionRepository.findAll(query.organizationId);
      if (query.courseId) completions = completions.filter((completion) => completion.courseId === query.courseId);
      return { completions: paginate(completions, query.offset, query.limit), total: completions.length };
    },

    async searchHr(query: SearchHrQuery): Promise<SearchHrResult> {
      const [employees, departments, courses] = await Promise.all([
        deps.employeeRepository.findAll(query.organizationId),
        deps.departmentRepository.findAll(query.organizationId),
        deps.courseRepository.findAll(query.organizationId),
      ]);

      const matches: SearchHrMatch[] = [];
      for (const employee of employees) {
        const label = `${employee.firstName} ${employee.lastName}`;
        const score = Math.max(scoreLabel(label, query.keyword), scoreLabel(employee.employeeNumber, query.keyword));
        if (score > 0) matches.push({ recordType: 'employee', id: employee.id, label, score });
      }
      for (const department of departments) {
        const score = scoreLabel(department.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'department', id: department.id, label: department.name, score });
      }
      for (const course of courses) {
        const score = scoreLabel(course.title, query.keyword);
        if (score > 0) matches.push({ recordType: 'course', id: course.id, label: course.title, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
