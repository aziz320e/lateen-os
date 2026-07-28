/** @module queries/hr-queries */
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
  SearchHrQuery,
  SearchHrResult,
} from './types.js';

/** Real, read-only HR Engine query port. */
export interface HrQueries {
  findEmployees(query: FindEmployeesQuery): Promise<FindEmployeesResult>;
  findDepartments(query: FindDepartmentsQuery): Promise<FindDepartmentsResult>;
  findAttendance(query: FindAttendanceQuery): Promise<FindAttendanceResult>;
  findLeaveRequests(query: FindLeaveRequestsQuery): Promise<FindLeaveRequestsResult>;
  findPayrollData(query: FindPayrollDataQuery): Promise<FindPayrollDataResult>;
  findPerformance(query: FindPerformanceQuery): Promise<FindPerformanceResult>;
  findTraining(query: FindTrainingQuery): Promise<FindTrainingResult>;
  searchHr(query: SearchHrQuery): Promise<SearchHrResult>;
}
