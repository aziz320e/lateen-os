/**
 * HR REST API (`/api/v1/hr`). Every route reaches the real, hosted
 * `hr-engine` runtime exclusively through `RuntimeRegistryService` → the
 * runtime's own `queries` port or its lifecycle services.
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { HrRuntime, queries as hrQueries } from '@lateen-os/hr-engine';
import { CurrentUser } from '../../../auth/decorators.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import type { AccessTokenPayload } from '../../../auth/token.service.js';
import { RuntimeRegistryService } from '../../../runtime-registry/runtime-registry.service.js';
import { DomainExceptionFilter } from '../common/domain-exception.filter.js';
import { LoggingInterceptor } from '../common/logging.interceptor.js';
import { toPagedResult } from '../common/pagination.util.js';
import { requireRuntime } from '../common/require-runtime.util.js';
import { ResponseInterceptor } from '../common/response.interceptor.js';
import {
  ClockInDto,
  ClockOutDto,
  ListAttendanceDto,
  ListLeaveRequestsDto,
  RecordAbsenceDto,
  RegisterHolidayDto,
  RequestLeaveDto,
  UpsertLeaveBalanceDto,
} from './dto/attendance-leave.dto.js';
import {
  CreateDepartmentDto,
  CreatePositionDto,
  ListDepartmentsDto,
  UpdateDepartmentDto,
  UpdatePositionDto,
} from './dto/department-position.dto.js';
import {
  HireEmployeeDto,
  ListEmployeesDto,
  PromoteEmployeeDto,
  RehireEmployeeDto,
  TerminateEmployeeDto,
  TransferEmployeeDto,
} from './dto/employee.dto.js';
import {
  CreateCertificationDto,
  CreateCourseDto,
  CreateEvaluationDto,
  CreateObjectiveDto,
  CreateReviewPeriodDto,
  ListPayrollRunsDto,
  ListPerformanceDto,
  ListTrainingDto,
  PreparePayrollDto,
  RecordCompletionDto,
  RecordSkillDto,
  UpdateObjectiveStatusDto,
} from './dto/payroll-performance-training.dto.js';

@ApiTags('HR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/hr')
export class HrController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): HrRuntime {
    return requireRuntime<HrRuntime>(this.registry, 'hr-engine');
  }

  // ---- Departments ----

  @Get('departments')
  async listDepartments(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListDepartmentsDto,
  ) {
    const result = await this.runtime().queries.findDepartments({
      organizationId: user.organizationId,
      unitType: query.unitType as hrQueries.FindDepartmentsQuery['unitType'],
      status: query.status as hrQueries.FindDepartmentsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.departments, result.total, query);
  }

  @Get('departments/:id')
  async getDepartment(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().organizationStructure.get(user.organizationId, id);
  }

  @Post('departments')
  async createDepartment(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateDepartmentDto,
  ) {
    return this.runtime().organizationStructure.create(user.organizationId, body);
  }

  @Patch('departments/:id')
  async updateDepartment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateDepartmentDto,
  ) {
    return this.runtime().organizationStructure.update(user.organizationId, id, body);
  }

  @Post('departments/:id/archive')
  async archiveDepartment(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().organizationStructure.archive(user.organizationId, id);
  }

  @Post('departments/:id/restore')
  async restoreDepartment(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().organizationStructure.restore(user.organizationId, id);
  }

  // ---- Positions ----

  @Get('positions')
  async listPositions(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().positions.list(user.organizationId);
  }

  @Get('positions/vacancies')
  async listVacancies(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().positions.listVacancies(user.organizationId);
  }

  @Get('positions/:id')
  async getPosition(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().positions.get(user.organizationId, id);
  }

  @Post('positions')
  async createPosition(@CurrentUser() user: AccessTokenPayload, @Body() body: CreatePositionDto) {
    return this.runtime().positions.create(user.organizationId, body);
  }

  @Patch('positions/:id')
  async updatePosition(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdatePositionDto,
  ) {
    return this.runtime().positions.update(user.organizationId, id, body);
  }

  @Post('positions/:id/archive')
  async archivePosition(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().positions.archive(user.organizationId, id);
  }

  // ---- Employees ----

  @Get('employees')
  async listEmployees(@CurrentUser() user: AccessTokenPayload, @Query() query: ListEmployeesDto) {
    const result = await this.runtime().queries.findEmployees({
      organizationId: user.organizationId,
      departmentId: query.departmentId,
      employmentStatus: query.employmentStatus as hrQueries.FindEmployeesQuery['employmentStatus'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.employees, result.total, query);
  }

  @Get('employees/:id')
  async getEmployee(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().employees.get(user.organizationId, id);
  }

  @Get('employees/:id/direct-reports')
  async getDirectReports(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().employees.findDirectReports(user.organizationId, id);
  }

  @Get('employees/:id/management-chain')
  async getManagementChain(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().employees.getManagementChain(user.organizationId, id);
  }

  @Post('employees')
  async hireEmployee(@CurrentUser() user: AccessTokenPayload, @Body() body: HireEmployeeDto) {
    return this.runtime().employees.hire(user.organizationId, body);
  }

  @Post('employees/:id/transfer')
  async transferEmployee(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: TransferEmployeeDto,
  ) {
    return this.runtime().employees.transfer(user.organizationId, id, body);
  }

  @Post('employees/:id/promote')
  async promoteEmployee(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: PromoteEmployeeDto,
  ) {
    return this.runtime().employees.promote(user.organizationId, id, body);
  }

  @Post('employees/:id/terminate')
  async terminateEmployee(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: TerminateEmployeeDto,
  ) {
    return this.runtime().employees.terminate(user.organizationId, id, body);
  }

  @Post('employees/:id/rehire')
  async rehireEmployee(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: RehireEmployeeDto,
  ) {
    return this.runtime().employees.rehire(user.organizationId, id, body);
  }

  @Post('employees/:id/set-on-leave')
  async setEmployeeOnLeave(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().employees.setOnLeave(user.organizationId, id);
  }

  @Post('employees/:id/suspend')
  async suspendEmployee(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().employees.suspend(user.organizationId, id);
  }

  @Post('employees/:id/reactivate')
  async reactivateEmployee(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().employees.reactivate(user.organizationId, id);
  }

  // ---- Attendance ----

  @Get('attendance/sessions')
  async listAttendanceSessions(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListAttendanceDto,
  ) {
    const result = await this.runtime().queries.findAttendance({
      organizationId: user.organizationId,
      employeeId: query.employeeId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.sessions, result.total, query);
  }

  @Post('attendance/:employeeId/clock-in')
  async clockIn(
    @CurrentUser() user: AccessTokenPayload,
    @Param('employeeId') employeeId: string,
    @Body() body: ClockInDto,
  ) {
    return this.runtime().attendance.clockIn(user.organizationId, employeeId, body);
  }

  @Post('attendance/sessions/:sessionId/clock-out')
  async clockOut(
    @CurrentUser() user: AccessTokenPayload,
    @Param('sessionId') sessionId: string,
    @Body() body: ClockOutDto,
  ) {
    return this.runtime().attendance.clockOut(user.organizationId, sessionId, body);
  }

  @Post('attendance/:employeeId/absences')
  async recordAbsence(
    @CurrentUser() user: AccessTokenPayload,
    @Param('employeeId') employeeId: string,
    @Body() body: RecordAbsenceDto,
  ) {
    return this.runtime().attendance.recordAbsence(user.organizationId, employeeId, body);
  }

  @Get('attendance/holidays')
  async listHolidays(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().attendance.listHolidays(user.organizationId);
  }

  @Post('attendance/holidays')
  async registerHoliday(@CurrentUser() user: AccessTokenPayload, @Body() body: RegisterHolidayDto) {
    return this.runtime().attendance.registerHoliday(user.organizationId, body);
  }

  // ---- Leave ----

  @Get('leave/requests')
  async listLeaveRequests(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListLeaveRequestsDto,
  ) {
    const result = await this.runtime().queries.findLeaveRequests({
      organizationId: user.organizationId,
      employeeId: query.employeeId,
      status: query.status as hrQueries.FindLeaveRequestsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.requests, result.total, query);
  }

  @Get('leave/requests/:id')
  async getLeaveRequest(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().leave.getLeaveRequest(user.organizationId, id);
  }

  @Post('leave/requests')
  async requestLeave(@CurrentUser() user: AccessTokenPayload, @Body() body: RequestLeaveDto) {
    return this.runtime().leave.requestLeave(user.organizationId, body);
  }

  @Post('leave/requests/:id/approve')
  async approveLeave(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().leave.approveLeave(user.organizationId, id);
  }

  @Post('leave/requests/:id/reject')
  async rejectLeave(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().leave.rejectLeave(user.organizationId, id);
  }

  @Post('leave/requests/:id/cancel')
  async cancelLeave(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().leave.cancelLeave(user.organizationId, id);
  }

  @Post('leave/requests/:id/complete')
  async completeLeave(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().leave.completeLeave(user.organizationId, id);
  }

  @Get('leave/balances/:employeeId')
  async listLeaveBalances(
    @CurrentUser() user: AccessTokenPayload,
    @Param('employeeId') employeeId: string,
  ) {
    return this.runtime().leave.listLeaveBalances(user.organizationId, employeeId);
  }

  @Post('leave/balances')
  async upsertLeaveBalance(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: UpsertLeaveBalanceDto,
  ) {
    return this.runtime().leave.upsertLeaveBalance(user.organizationId, body);
  }

  // ---- Payroll ----

  @Get('payroll/runs')
  async listPayrollRuns(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListPayrollRunsDto,
  ) {
    const result = await this.runtime().queries.findPayrollData({
      organizationId: user.organizationId,
      status: query.status as hrQueries.FindPayrollDataQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.runs, result.total, query);
  }

  @Get('payroll/runs/:id')
  async getPayrollRun(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().payroll.getPayrollRun(user.organizationId, id);
  }

  @Post('payroll/runs')
  async preparePayroll(@CurrentUser() user: AccessTokenPayload, @Body() body: PreparePayrollDto) {
    return this.runtime().payroll.preparePayroll(user.organizationId, body);
  }

  @Post('payroll/runs/:id/finalize')
  async finalizePayrollRun(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().payroll.finalizePayrollRun(user.organizationId, id);
  }

  // ---- Performance ----

  @Get('performance/review-periods')
  async listReviewPeriods(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().performance.listReviewPeriods(user.organizationId);
  }

  @Post('performance/review-periods')
  async createReviewPeriod(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateReviewPeriodDto,
  ) {
    return this.runtime().performance.createReviewPeriod(user.organizationId, body);
  }

  @Post('performance/review-periods/:id/close')
  async closeReviewPeriod(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().performance.closeReviewPeriod(user.organizationId, id);
  }

  @Post('performance/objectives')
  async createObjective(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateObjectiveDto) {
    return this.runtime().performance.createObjective(user.organizationId, body);
  }

  @Patch('performance/objectives/:id/status')
  async updateObjectiveStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateObjectiveStatusDto,
  ) {
    return this.runtime().performance.updateObjectiveStatus(user.organizationId, id, body.status);
  }

  @Get('performance/evaluations')
  async listEvaluations(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListPerformanceDto,
  ) {
    const result = await this.runtime().queries.findPerformance({
      organizationId: user.organizationId,
      employeeId: query.employeeId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.evaluations, result.total, query);
  }

  @Get('performance/evaluations/:id')
  async getEvaluation(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().performance.getEvaluation(user.organizationId, id);
  }

  @Post('performance/evaluations')
  async createEvaluation(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateEvaluationDto,
  ) {
    return this.runtime().performance.createEvaluation(user.organizationId, body);
  }

  @Post('performance/evaluations/:id/complete')
  async completeEvaluation(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().performance.completeEvaluation(user.organizationId, id);
  }

  // ---- Training ----

  @Get('training/courses')
  async listCourses(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().training.listCourses(user.organizationId);
  }

  @Post('training/courses')
  async createCourse(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateCourseDto) {
    return this.runtime().training.createCourse(user.organizationId, body);
  }

  @Post('training/courses/:id/archive')
  async archiveCourse(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().training.archiveCourse(user.organizationId, id);
  }

  @Get('training/certifications')
  async listCertifications(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().training.listCertifications(user.organizationId);
  }

  @Post('training/certifications')
  async createCertification(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateCertificationDto,
  ) {
    return this.runtime().training.createCertification(user.organizationId, body);
  }

  @Post('training/skills')
  async recordSkill(@CurrentUser() user: AccessTokenPayload, @Body() body: RecordSkillDto) {
    return this.runtime().training.recordSkill(user.organizationId, body);
  }

  @Get('training/skills/:employeeId')
  async listSkills(
    @CurrentUser() user: AccessTokenPayload,
    @Param('employeeId') employeeId: string,
  ) {
    return this.runtime().training.findSkillsByEmployee(user.organizationId, employeeId);
  }

  @Get('training/completions')
  async listCompletions(@CurrentUser() user: AccessTokenPayload, @Query() query: ListTrainingDto) {
    const result = await this.runtime().queries.findTraining({
      organizationId: user.organizationId,
      employeeId: query.employeeId,
      courseId: query.courseId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.completions, result.total, query);
  }

  @Post('training/completions')
  async recordCompletion(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: RecordCompletionDto,
  ) {
    return this.runtime().training.recordCompletion(user.organizationId, body);
  }

  // ---- Search ----

  @Get('search')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchHr({ organizationId: user.organizationId, keyword, limit });
  }
}
