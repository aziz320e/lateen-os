/**
 * Projects REST API (`/api/v1/projects`). Every route reaches the real,
 * hosted `project-management-engine` runtime exclusively through
 * `RuntimeRegistryService` → the runtime's own `queries` port or its
 * lifecycle services.
 *
 * Route ordering note: every static single-segment path (`milestones`,
 * `tasks`, `budgets`, `risks`, `deliverables`, `schedules`, `search`, …)
 * must be declared before the generic `GET/PATCH :id` project routes —
 * Nest/Fastify matches routes in declaration order, so `:id` would
 * otherwise greedily swallow those static paths as a project id.
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
import type {
  ProjectRuntime,
  queries as projectQueries,
} from '@lateen-os/project-management-engine';
import { CurrentUser, RequirePermission } from '../../../auth/decorators.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard.js';
import type { AccessTokenPayload } from '../../../auth/token.service.js';
import { RuntimeRegistryService } from '../../../runtime-registry/runtime-registry.service.js';
import { DomainExceptionFilter } from '../common/domain-exception.filter.js';
import { LoggingInterceptor } from '../common/logging.interceptor.js';
import { toPagedResult } from '../common/pagination.util.js';
import { requireRuntime } from '../common/require-runtime.util.js';
import { ResponseInterceptor } from '../common/response.interceptor.js';
import {
  ListProjectBudgetsDto,
  ListProjectRisksDto,
  ListDeliverablesDto,
  CreateProjectBudgetDto,
  RecordCostDto,
  ReviseProjectBudgetDto,
  CreateProjectRiskDto,
  UpdateProjectRiskDto,
  CreateDeliverableDto,
  UpdateDeliverableDto,
  ApproveDeliverableDto,
} from './dto/budget-risk-deliverable.dto.js';
import {
  CancelProjectDto,
  CreateMilestoneDto,
  CreatePhaseDto,
  CreatePortfolioDto,
  CreateProgramDto,
  CreateProjectDto,
  ListMilestonesDto,
  ListProjectsDto,
  ReachMilestoneDto,
  UpdateProjectDto,
} from './dto/project.dto.js';
import {
  AssignResourceDto,
  ListAssignmentsDto,
  LogWorkDto,
  UpdateAllocationDto,
} from './dto/resource.dto.js';
import { ComputeScheduleDto } from './dto/schedule.dto.js';
import {
  CreateProjectTaskDto,
  DependencyDto,
  ListProjectTasksDto,
  UpdateProjectTaskDto,
} from './dto/task.dto.js';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): ProjectRuntime {
    return requireRuntime<ProjectRuntime>(this.registry, 'project-management-engine');
  }

  // ---- Portfolios & Programs (static paths — must precede `:id`) ----

  @Get('portfolios')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listPortfolios(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().projects.listPortfolios(user.organizationId);
  }

  @Post('portfolios')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async createPortfolio(@CurrentUser() user: AccessTokenPayload, @Body() body: CreatePortfolioDto) {
    return this.runtime().projects.createPortfolio(user.organizationId, body);
  }

  @Get('programs')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listPrograms(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().projects.listPrograms(user.organizationId);
  }

  @Post('programs')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async createProgram(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateProgramDto) {
    return this.runtime().projects.createProgram(user.organizationId, body);
  }

  // ---- Phases (static prefix) ----

  @Post('phases')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async createPhase(@CurrentUser() user: AccessTokenPayload, @Body() body: CreatePhaseDto) {
    return this.runtime().projects.createPhase(user.organizationId, body);
  }

  @Post('phases/:phaseId/start')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async startPhase(@CurrentUser() user: AccessTokenPayload, @Param('phaseId') phaseId: string) {
    return this.runtime().projects.startPhase(user.organizationId, phaseId);
  }

  @Post('phases/:phaseId/complete')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async completePhase(@CurrentUser() user: AccessTokenPayload, @Param('phaseId') phaseId: string) {
    return this.runtime().projects.completePhase(user.organizationId, phaseId);
  }

  // ---- Milestones ----

  @Get('milestones')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listMilestones(@CurrentUser() user: AccessTokenPayload, @Query() query: ListMilestonesDto) {
    const result = await this.runtime().queries.findMilestones({
      organizationId: user.organizationId,
      projectId: query.projectId,
      status: query.status as projectQueries.FindMilestonesQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.milestones, result.total, query);
  }

  @Post('milestones')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async createMilestone(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateMilestoneDto) {
    return this.runtime().projects.createMilestone(user.organizationId, body);
  }

  @Post('milestones/:milestoneId/reach')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async reachMilestone(
    @CurrentUser() user: AccessTokenPayload,
    @Param('milestoneId') milestoneId: string,
    @Body() body: ReachMilestoneDto,
  ) {
    return this.runtime().projects.reachMilestone(
      user.organizationId,
      milestoneId,
      body.actualDate,
    );
  }

  @Post('milestones/:milestoneId/miss')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async missMilestone(
    @CurrentUser() user: AccessTokenPayload,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.runtime().projects.missMilestone(user.organizationId, milestoneId);
  }

  // ---- Tasks ----

  @Get('tasks')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listTasks(@CurrentUser() user: AccessTokenPayload, @Query() query: ListProjectTasksDto) {
    const result = await this.runtime().queries.findTasks({
      organizationId: user.organizationId,
      projectId: query.projectId,
      status: query.status as projectQueries.FindTasksQuery['status'],
      priority: query.priority as projectQueries.FindTasksQuery['priority'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.tasks, result.total, query);
  }

  @Get('tasks/:taskId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async getTask(@CurrentUser() user: AccessTokenPayload, @Param('taskId') taskId: string) {
    return this.runtime().tasks.get(user.organizationId, taskId);
  }

  @Post('tasks')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async createTask(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateProjectTaskDto) {
    return this.runtime().tasks.create(user.organizationId, body);
  }

  @Patch('tasks/:taskId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async updateTask(
    @CurrentUser() user: AccessTokenPayload,
    @Param('taskId') taskId: string,
    @Body() body: UpdateProjectTaskDto,
  ) {
    return this.runtime().tasks.update(user.organizationId, taskId, body);
  }

  @Post('tasks/:taskId/dependencies')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async addDependency(
    @CurrentUser() user: AccessTokenPayload,
    @Param('taskId') taskId: string,
    @Body() body: DependencyDto,
  ) {
    return this.runtime().tasks.addDependency(user.organizationId, taskId, body.dependsOnTaskId);
  }

  @Post('tasks/:taskId/ready')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async markTaskReady(@CurrentUser() user: AccessTokenPayload, @Param('taskId') taskId: string) {
    return this.runtime().tasks.markReady(user.organizationId, taskId);
  }

  @Post('tasks/:taskId/start')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async startTask(@CurrentUser() user: AccessTokenPayload, @Param('taskId') taskId: string) {
    return this.runtime().tasks.start(user.organizationId, taskId);
  }

  @Post('tasks/:taskId/block')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async blockTask(@CurrentUser() user: AccessTokenPayload, @Param('taskId') taskId: string) {
    return this.runtime().tasks.block(user.organizationId, taskId);
  }

  @Post('tasks/:taskId/complete')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async completeTask(@CurrentUser() user: AccessTokenPayload, @Param('taskId') taskId: string) {
    return this.runtime().tasks.complete(user.organizationId, taskId);
  }

  @Post('tasks/:taskId/cancel')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async cancelTask(@CurrentUser() user: AccessTokenPayload, @Param('taskId') taskId: string) {
    return this.runtime().tasks.cancel(user.organizationId, taskId);
  }

  // ---- Resources ----

  @Get('resources/assignments')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listAssignments(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListAssignmentsDto,
  ) {
    const result = await this.runtime().queries.findAssignments({
      organizationId: user.organizationId,
      projectId: query.projectId,
      assigneeId: query.assigneeId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.assignments, result.total, query);
  }

  @Post('resources/assignments')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async assignResource(@CurrentUser() user: AccessTokenPayload, @Body() body: AssignResourceDto) {
    return this.runtime().resources.assign(user.organizationId, body);
  }

  @Patch('resources/assignments/:assignmentId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async updateAllocation(
    @CurrentUser() user: AccessTokenPayload,
    @Param('assignmentId') assignmentId: string,
    @Body() body: UpdateAllocationDto,
  ) {
    return this.runtime().resources.updateAllocation(
      user.organizationId,
      assignmentId,
      body.allocationPercentage,
      body.capacityPercentage,
    );
  }

  @Post('resources/assignments/:assignmentId/complete')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async completeAssignment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.runtime().resources.complete(user.organizationId, assignmentId);
  }

  @Post('resources/assignments/:assignmentId/cancel')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async cancelAssignment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.runtime().resources.cancel(user.organizationId, assignmentId);
  }

  @Get('resources/workload/:assigneeId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async getWorkload(
    @CurrentUser() user: AccessTokenPayload,
    @Param('assigneeId') assigneeId: string,
  ) {
    const workload = await this.runtime().resources.getWorkload(user.organizationId, assigneeId);
    return { workload };
  }

  // ---- Scheduling ----

  @Get('schedules')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listSchedules(
    @CurrentUser() user: AccessTokenPayload,
    @Query('projectId') projectId?: string,
  ) {
    const result = await this.runtime().queries.findSchedules({
      organizationId: user.organizationId,
      projectId,
    });
    return { data: result.schedules, meta: { total: result.total } };
  }

  @Post('schedules/compute')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async computeSchedule(@CurrentUser() user: AccessTokenPayload, @Body() body: ComputeScheduleDto) {
    return this.runtime().scheduling.computeSchedule(user.organizationId, body);
  }

  @Post('schedules/:scheduleId/baseline')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async setBaseline(
    @CurrentUser() user: AccessTokenPayload,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.runtime().scheduling.setBaseline(user.organizationId, scheduleId);
  }

  @Get('schedules/:scheduleId/critical-path')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async getCriticalPath(
    @CurrentUser() user: AccessTokenPayload,
    @Param('scheduleId') scheduleId: string,
  ) {
    return this.runtime().scheduling.getCriticalPath(user.organizationId, scheduleId);
  }

  // ---- Time Tracking ----

  @Post('work-logs')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async logWork(@CurrentUser() user: AccessTokenPayload, @Body() body: LogWorkDto) {
    return this.runtime().timeTracking.logWork(user.organizationId, body);
  }

  // ---- Budgets ----

  @Get('budgets')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listBudgets(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListProjectBudgetsDto,
  ) {
    const result = await this.runtime().queries.findBudgets({
      organizationId: user.organizationId,
      projectId: query.projectId,
      status: query.status as projectQueries.FindBudgetsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.budgets, result.total, query);
  }

  @Get('budgets/:budgetId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async getBudget(@CurrentUser() user: AccessTokenPayload, @Param('budgetId') budgetId: string) {
    return this.runtime().budgets.get(user.organizationId, budgetId);
  }

  @Post('budgets')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async createBudget(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateProjectBudgetDto,
  ) {
    return this.runtime().budgets.createBudget(user.organizationId, body);
  }

  @Post('budgets/:budgetId/costs')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async recordCost(
    @CurrentUser() user: AccessTokenPayload,
    @Param('budgetId') budgetId: string,
    @Body() body: RecordCostDto,
  ) {
    return this.runtime().budgets.recordCost(user.organizationId, budgetId, body.amount);
  }

  @Patch('budgets/:budgetId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async reviseBudget(
    @CurrentUser() user: AccessTokenPayload,
    @Param('budgetId') budgetId: string,
    @Body() body: ReviseProjectBudgetDto,
  ) {
    return this.runtime().budgets.reviseBudget(user.organizationId, budgetId, body.plannedBudget);
  }

  @Post('budgets/:budgetId/close')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async closeBudget(@CurrentUser() user: AccessTokenPayload, @Param('budgetId') budgetId: string) {
    return this.runtime().budgets.close(user.organizationId, budgetId);
  }

  @Get('budgets/:budgetId/variance')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async getBudgetVariance(
    @CurrentUser() user: AccessTokenPayload,
    @Param('budgetId') budgetId: string,
  ) {
    const variance = await this.runtime().budgets.getCostVariance(user.organizationId, budgetId);
    return { variance };
  }

  // ---- Risks ----

  @Get('risks')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listRisks(@CurrentUser() user: AccessTokenPayload, @Query() query: ListProjectRisksDto) {
    const result = await this.runtime().queries.findRisks({
      organizationId: user.organizationId,
      projectId: query.projectId,
      status: query.status as projectQueries.FindRisksQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.risks, result.total, query);
  }

  @Get('risks/:riskId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async getRisk(@CurrentUser() user: AccessTokenPayload, @Param('riskId') riskId: string) {
    return this.runtime().risks.get(user.organizationId, riskId);
  }

  @Post('risks')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async createRisk(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateProjectRiskDto) {
    return this.runtime().risks.create(user.organizationId, body);
  }

  @Patch('risks/:riskId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async updateRisk(
    @CurrentUser() user: AccessTokenPayload,
    @Param('riskId') riskId: string,
    @Body() body: UpdateProjectRiskDto,
  ) {
    return this.runtime().risks.update(user.organizationId, riskId, body);
  }

  @Post('risks/:riskId/start-mitigation')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async startMitigation(@CurrentUser() user: AccessTokenPayload, @Param('riskId') riskId: string) {
    return this.runtime().risks.startMitigation(user.organizationId, riskId);
  }

  @Post('risks/:riskId/resolve')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async resolveRisk(@CurrentUser() user: AccessTokenPayload, @Param('riskId') riskId: string) {
    return this.runtime().risks.resolve(user.organizationId, riskId);
  }

  @Post('risks/:riskId/accept')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async acceptRisk(@CurrentUser() user: AccessTokenPayload, @Param('riskId') riskId: string) {
    return this.runtime().risks.accept(user.organizationId, riskId);
  }

  @Post('risks/:riskId/mark-occurred')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async markRiskOccurred(@CurrentUser() user: AccessTokenPayload, @Param('riskId') riskId: string) {
    return this.runtime().risks.markOccurred(user.organizationId, riskId);
  }

  // ---- Deliverables ----

  @Get('deliverables')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listDeliverables(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListDeliverablesDto,
  ) {
    const result = await this.runtime().queries.findDeliverables({
      organizationId: user.organizationId,
      projectId: query.projectId,
      status: query.status as projectQueries.FindDeliverablesQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.deliverables, result.total, query);
  }

  @Get('deliverables/:deliverableId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async getDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('deliverableId') deliverableId: string,
  ) {
    return this.runtime().deliverables.get(user.organizationId, deliverableId);
  }

  @Post('deliverables')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async createDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateDeliverableDto,
  ) {
    return this.runtime().deliverables.create(user.organizationId, body);
  }

  @Patch('deliverables/:deliverableId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async updateDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('deliverableId') deliverableId: string,
    @Body() body: UpdateDeliverableDto,
  ) {
    return this.runtime().deliverables.update(user.organizationId, deliverableId, body);
  }

  @Post('deliverables/:deliverableId/submit-for-review')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async submitDeliverableForReview(
    @CurrentUser() user: AccessTokenPayload,
    @Param('deliverableId') deliverableId: string,
  ) {
    return this.runtime().deliverables.submitForReview(user.organizationId, deliverableId);
  }

  @Post('deliverables/:deliverableId/approve')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async approveDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('deliverableId') deliverableId: string,
    @Body() body: ApproveDeliverableDto,
  ) {
    return this.runtime().deliverables.approve(user.organizationId, deliverableId, body);
  }

  @Post('deliverables/:deliverableId/reject')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async rejectDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('deliverableId') deliverableId: string,
  ) {
    return this.runtime().deliverables.reject(user.organizationId, deliverableId);
  }

  @Post('deliverables/:deliverableId/resubmit')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async resubmitDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('deliverableId') deliverableId: string,
  ) {
    return this.runtime().deliverables.resubmit(user.organizationId, deliverableId);
  }

  @Post('deliverables/:deliverableId/complete')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async completeDeliverable(
    @CurrentUser() user: AccessTokenPayload,
    @Param('deliverableId') deliverableId: string,
  ) {
    return this.runtime().deliverables.complete(user.organizationId, deliverableId);
  }

  // ---- Search (static path) ----

  @Get('search')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchProjects({
      organizationId: user.organizationId,
      keyword,
      limit,
    });
  }

  // ---- Projects (list/create are unambiguous; :id routes must come last) ----

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listProjects(@CurrentUser() user: AccessTokenPayload, @Query() query: ListProjectsDto) {
    const result = await this.runtime().queries.findProjects({
      organizationId: user.organizationId,
      portfolioId: query.portfolioId,
      programId: query.programId,
      status: query.status as projectQueries.FindProjectsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.projects, result.total, query);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async createProject(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateProjectDto) {
    return this.runtime().projects.create(user.organizationId, body);
  }

  @Get(':id/phases')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listPhases(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().projects.listPhasesForProject(user.organizationId, id);
  }

  @Get(':id/work-logs')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async listWorkLogsForProject(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().timeTracking.findByProject(user.organizationId, id);
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:read')
  async getProject(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().projects.get(user.organizationId, id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async updateProject(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateProjectDto,
  ) {
    return this.runtime().projects.update(user.organizationId, id, body);
  }

  @Post(':id/start')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async startProject(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().projects.start(user.organizationId, id);
  }

  @Post(':id/pause')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async pauseProject(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().projects.pause(user.organizationId, id);
  }

  @Post(':id/resume')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async resumeProject(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().projects.resume(user.organizationId, id);
  }

  @Post(':id/complete')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async completeProject(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().projects.complete(user.organizationId, id);
  }

  @Post(':id/cancel')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async cancelProject(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: CancelProjectDto,
  ) {
    return this.runtime().projects.cancel(user.organizationId, id, body);
  }

  @Post(':id/archive')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async archiveProject(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().projects.archive(user.organizationId, id);
  }

  @Post(':id/restore')
  @UseGuards(PermissionsGuard)
  @RequirePermission('projects:write')
  async restoreProject(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().projects.restore(user.organizationId, id);
  }
}
