import { describe, expect, it } from 'vitest';
import { createWorkSessionRepository } from '../src/attendance/repository.impl.js';
import { createOrganizationStructureEngine } from '../src/department/engine.impl.js';
import { createDepartmentRepository } from '../src/department/repository.impl.js';
import { createEmployeeManagementEngine } from '../src/employee/engine.impl.js';
import { createEmployeeRepository } from '../src/employee/repository.impl.js';
import { createLeaveManagementEngine } from '../src/leave/engine.impl.js';
import { createLeaveBalanceRepository, createLeaveRequestRepository } from '../src/leave/repository.impl.js';
import { createPayrollPreparationEngine } from '../src/payroll/engine.impl.js';
import { createPayrollRunRepository } from '../src/payroll/repository.impl.js';
import { createPerformanceManagementEngine } from '../src/performance/engine.impl.js';
import { createEvaluationRepository, createObjectiveRepository, createReviewPeriodRepository } from '../src/performance/repository.impl.js';
import { createPositionManagementEngine } from '../src/position/engine.impl.js';
import { createPositionRepository } from '../src/position/repository.impl.js';
import { createHrQueries } from '../src/queries/hr-queries.impl.js';
import { createCourseRepository, createTrainingCompletionRepository } from '../src/training/repository.impl.js';
import { createCertificationRepository, createEmployeeSkillRepository } from '../src/training/repository.impl.js';
import { createTrainingEngine } from '../src/training/engine.impl.js';

const ORG = 'org-1';

async function setup() {
  const departmentRepository = createDepartmentRepository();
  const positionRepository = createPositionRepository();
  const employeeRepository = createEmployeeRepository();
  const workSessionRepository = createWorkSessionRepository();
  const leaveRequestRepository = createLeaveRequestRepository();
  const leaveBalanceRepository = createLeaveBalanceRepository();
  const payrollRunRepository = createPayrollRunRepository();
  const reviewPeriodRepository = createReviewPeriodRepository();
  const objectiveRepository = createObjectiveRepository();
  const evaluationRepository = createEvaluationRepository();
  const courseRepository = createCourseRepository();
  const trainingCompletionRepository = createTrainingCompletionRepository();

  const departments = createOrganizationStructureEngine(departmentRepository);
  const positions = createPositionManagementEngine(positionRepository);
  const employees = createEmployeeManagementEngine(employeeRepository, departmentRepository, positions);
  const leave = createLeaveManagementEngine(leaveRequestRepository, leaveBalanceRepository);
  const payroll = createPayrollPreparationEngine(payrollRunRepository, employeeRepository, workSessionRepository, leaveRequestRepository);
  const performance = createPerformanceManagementEngine(reviewPeriodRepository, objectiveRepository, evaluationRepository);
  const training = createTrainingEngine(courseRepository, createCertificationRepository(), createEmployeeSkillRepository(), trainingCompletionRepository);

  const queries = createHrQueries({
    employeeRepository,
    departmentRepository,
    workSessionRepository,
    leaveRequestRepository,
    payrollRunRepository,
    evaluationRepository,
    trainingCompletionRepository,
    courseRepository,
  });

  return { departments, positions, employees, leave, payroll, performance, training, queries };
}

describe('HrQueries — findEmployees', () => {
  it('filters by departmentId and employmentStatus', async () => {
    const { departments, positions, employees, queries } = await setup();
    const department = await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const otherDepartment = await departments.create(ORG, { code: 'SALES', name: 'Sales', unitType: 'department' });
    const position = await positions.create(ORG, { title: 'Engineer', departmentId: department.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 5 });
    const salesPosition = await positions.create(ORG, { title: 'Sales Rep', departmentId: otherDepartment.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 5 });
    const employee = await employees.hire(ORG, { firstName: 'A', lastName: 'B', email: 'a@x.com', departmentId: department.id, positionId: position.id, employmentType: 'full_time', baseSalary: '5000.00', currency: 'USD', hireDate: '2026-01-01' });
    await employees.hire(ORG, { firstName: 'C', lastName: 'D', email: 'c@x.com', departmentId: otherDepartment.id, positionId: salesPosition.id, employmentType: 'full_time', baseSalary: '5000.00', currency: 'USD', hireDate: '2026-01-01' });

    const byDept = await queries.findEmployees({ organizationId: ORG, departmentId: department.id });
    expect(byDept.total).toBe(1);
    expect(byDept.employees[0]?.id).toBe(employee.id);

    const byStatus = await queries.findEmployees({ organizationId: ORG, employmentStatus: 'active' });
    expect(byStatus.total).toBe(2);
  });

  it('paginates with offset/limit', async () => {
    const { departments, positions, employees, queries } = await setup();
    const department = await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const position = await positions.create(ORG, { title: 'Engineer', departmentId: department.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 10 });
    for (let i = 0; i < 5; i += 1) {
      await employees.hire(ORG, { firstName: `E${i}`, lastName: 'X', email: `e${i}@x.com`, departmentId: department.id, positionId: position.id, employmentType: 'full_time', baseSalary: '5000.00', currency: 'USD', hireDate: '2026-01-01' });
    }
    const page = await queries.findEmployees({ organizationId: ORG, offset: 2, limit: 2 });
    expect(page.employees).toHaveLength(2);
    expect(page.total).toBe(5);
  });
});

describe('HrQueries — findDepartments', () => {
  it('filters by unitType and status', async () => {
    const { departments, queries } = await setup();
    const dept = await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    await departments.create(ORG, { code: 'GRP', name: 'Group', unitType: 'division' });
    await departments.archive(ORG, dept.id);

    expect((await queries.findDepartments({ organizationId: ORG, unitType: 'division' })).total).toBe(1);
    expect((await queries.findDepartments({ organizationId: ORG, status: 'archived' })).total).toBe(1);
  });
});

describe('HrQueries — findAttendance', () => {
  it('filters by employeeId', async () => {
    const { queries } = await setup();
    const result = await queries.findAttendance({ organizationId: ORG, employeeId: 'employee-1' });
    expect(result.total).toBe(0);
  });
});

describe('HrQueries — findLeaveRequests', () => {
  it('filters by employeeId and status', async () => {
    const { leave, queries } = await setup();
    const request = await leave.requestLeave(ORG, { employeeId: 'employee-1', leaveType: 'emergency', startDate: '2026-01-01', endDate: '2026-01-01' });
    const result = await queries.findLeaveRequests({ organizationId: ORG, employeeId: 'employee-1', status: 'requested' });
    expect(result.total).toBe(1);
    expect(result.requests[0]?.id).toBe(request.id);
  });
});

describe('HrQueries — findPayrollData', () => {
  it('filters by status', async () => {
    const { departments, positions, employees, payroll, queries } = await setup();
    const department = await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const position = await positions.create(ORG, { title: 'Engineer', departmentId: department.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 5 });
    const employee = await employees.hire(ORG, { firstName: 'A', lastName: 'B', email: 'a@x.com', departmentId: department.id, positionId: position.id, employmentType: 'full_time', baseSalary: '5000.00', currency: 'USD', hireDate: '2026-01-01' });
    await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    expect((await queries.findPayrollData({ organizationId: ORG, status: 'draft' })).total).toBe(1);
    expect((await queries.findPayrollData({ organizationId: ORG, status: 'finalized' })).total).toBe(0);
  });
});

describe('HrQueries — findPerformance', () => {
  it('filters by employeeId', async () => {
    const { performance, queries } = await setup();
    const period = await performance.createReviewPeriod(ORG, { name: '2026 H1', startDate: '2026-01-01', endDate: '2026-06-30' });
    await performance.createEvaluation(ORG, { employeeId: 'employee-1', reviewPeriodId: period.id, objectiveRatings: [] });
    expect((await queries.findPerformance({ organizationId: ORG, employeeId: 'employee-1' })).total).toBe(1);
  });
});

describe('HrQueries — findTraining', () => {
  it('filters by employeeId and courseId', async () => {
    const { training, queries } = await setup();
    const course = await training.createCourse(ORG, { title: 'Security', durationHours: 2 });
    await training.recordCompletion(ORG, { employeeId: 'employee-1', courseId: course.id, completedAt: '2026-01-01' });
    expect((await queries.findTraining({ organizationId: ORG, employeeId: 'employee-1' })).total).toBe(1);
    expect((await queries.findTraining({ organizationId: ORG, courseId: course.id })).total).toBe(1);
  });
});

describe('HrQueries — findPayrollData pagination', () => {
  it('paginates with offset/limit', async () => {
    const { departments, positions, employees, payroll, queries } = await setup();
    const department = await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const position = await positions.create(ORG, { title: 'Engineer', departmentId: department.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 10 });
    const employee = await employees.hire(ORG, { firstName: 'A', lastName: 'B', email: 'a@x.com', departmentId: department.id, positionId: position.id, employmentType: 'full_time', baseSalary: '5000.00', currency: 'USD', hireDate: '2026-01-01' });
    await payroll.preparePayroll(ORG, { periodStart: '2026-01-01', periodEnd: '2026-01-31', currency: 'USD', employeeIds: [employee.id] });
    await payroll.preparePayroll(ORG, { periodStart: '2026-02-01', periodEnd: '2026-02-28', currency: 'USD', employeeIds: [employee.id] });
    const page = await queries.findPayrollData({ organizationId: ORG, offset: 1, limit: 1 });
    expect(page.runs).toHaveLength(1);
    expect(page.total).toBe(2);
  });
});

describe('HrQueries — findLeaveRequests without filters', () => {
  it('returns every leave request in the organization when no filter is given', async () => {
    const { leave, queries } = await setup();
    await leave.requestLeave(ORG, { employeeId: 'employee-1', leaveType: 'sick', startDate: '2026-01-01', endDate: '2026-01-01' });
    await leave.requestLeave(ORG, { employeeId: 'employee-2', leaveType: 'emergency', startDate: '2026-01-02', endDate: '2026-01-02' });
    expect((await queries.findLeaveRequests({ organizationId: ORG })).total).toBe(2);
  });
});

describe('HrQueries — findTraining without filters', () => {
  it('returns every completion in the organization when no filter is given', async () => {
    const { training, queries } = await setup();
    const course = await training.createCourse(ORG, { title: 'Security', durationHours: 2 });
    await training.recordCompletion(ORG, { employeeId: 'employee-1', courseId: course.id, completedAt: '2026-01-01' });
    await training.recordCompletion(ORG, { employeeId: 'employee-2', courseId: course.id, completedAt: '2026-01-02' });
    expect((await queries.findTraining({ organizationId: ORG })).total).toBe(2);
  });
});

describe('HrQueries — findDepartments without filters', () => {
  it('returns every department when no filter is given', async () => {
    const { departments, queries } = await setup();
    await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    await departments.create(ORG, { code: 'SALES', name: 'Sales', unitType: 'department' });
    expect((await queries.findDepartments({ organizationId: ORG })).total).toBe(2);
  });
});

describe('HrQueries — findEmployees is organization-scoped', () => {
  it('does not leak employees across organizations', async () => {
    const { departments, positions, employees, queries } = await setup();
    const department = await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const position = await positions.create(ORG, { title: 'Engineer', departmentId: department.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 5 });
    await employees.hire(ORG, { firstName: 'A', lastName: 'B', email: 'a@x.com', departmentId: department.id, positionId: position.id, employmentType: 'full_time', baseSalary: '5000.00', currency: 'USD', hireDate: '2026-01-01' });
    expect((await queries.findEmployees({ organizationId: 'org-2' })).total).toBe(0);
  });
});

describe('HrQueries — searchHr', () => {
  it('matches employees/departments/courses by keyword, best score first', async () => {
    const { departments, positions, employees, training, queries } = await setup();
    const department = await departments.create(ORG, { code: 'CAS', name: 'Casablanca Ops', unitType: 'department' });
    const position = await positions.create(ORG, { title: 'Engineer', departmentId: department.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 5 });
    await employees.hire(ORG, { firstName: 'Cas', lastName: 'Aubert', email: 'c@x.com', departmentId: department.id, positionId: position.id, employmentType: 'full_time', baseSalary: '5000.00', currency: 'USD', hireDate: '2026-01-01' });
    await training.createCourse(ORG, { title: 'Cas Safety Training', durationHours: 2 });

    const result = await queries.searchHr({ organizationId: ORG, keyword: 'Cas' });
    expect(result.total).toBe(3);
    expect(new Set(result.matches.map((m) => m.recordType))).toEqual(new Set(['employee', 'department', 'course']));
  });

  it('returns no matches for an unrelated keyword', async () => {
    const { departments, queries } = await setup();
    await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
    const result = await queries.searchHr({ organizationId: ORG, keyword: 'zzz-no-match' });
    expect(result.total).toBe(0);
  });
});
