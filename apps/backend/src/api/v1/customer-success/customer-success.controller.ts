/**
 * Customer Success REST API (`/api/v1/customer-success`). Every route
 * reaches the real, hosted `customer-success-engine` runtime exclusively
 * through `RuntimeRegistryService` → the runtime's own `queries` port or
 * its lifecycle services.
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
  CustomerSuccessRuntime,
  queries as csQueries,
} from '@lateen-os/customer-success-engine';
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
  ListCustomerSuccessDto,
  ListHealthDto,
  OnboardCustomerDto,
  RecordHealthSnapshotDto,
} from './dto/customer-success.dto.js';
import {
  CreatePlanMilestoneDto,
  CreatePlanObjectiveDto,
  CreatePlanTaskDto,
  CreateSuccessPlanDto,
  ListSuccessPlansDto,
  ReachPlanMilestoneDto,
} from './dto/plan.dto.js';
import {
  CompleteRenewalDto,
  CreateCustomerRiskDto,
  CreateRenewalDto,
  IdentifyExpansionDto,
  ListCustomerRisksDto,
  ListExpansionDto,
  ListFeedbackDto,
  ListRenewalsDto,
  RecordFeedbackDto,
  UpdateCustomerRiskDto,
  UpdateProbabilityDto,
} from './dto/renewal-expansion-risk-feedback.dto.js';

@ApiTags('Customer Success')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/customer-success')
export class CustomerSuccessController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): CustomerSuccessRuntime {
    return requireRuntime<CustomerSuccessRuntime>(this.registry, 'customer-success-engine');
  }

  // ---- Customer Success Records ----

  @Get('records')
  async listRecords(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListCustomerSuccessDto,
  ) {
    const result = await this.runtime().queries.findCustomers({
      organizationId: user.organizationId,
      customerId: query.customerId,
      status: query.status as csQueries.FindCustomersQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.records, result.total, query);
  }

  @Get('records/:id')
  async getRecord(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.get(user.organizationId, id);
  }

  @Post('records')
  async onboardCustomer(@CurrentUser() user: AccessTokenPayload, @Body() body: OnboardCustomerDto) {
    return this.runtime().customers.onboard(user.organizationId, body);
  }

  @Post('records/:id/activate')
  async activateRecord(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.activate(user.organizationId, id);
  }

  @Post('records/:id/progress-to-adoption')
  async progressToAdoption(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.progressToAdoption(user.organizationId, id);
  }

  @Post('records/:id/expand')
  async expandRecord(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.expand(user.organizationId, id);
  }

  @Post('records/:id/renew')
  async renewRecord(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.renew(user.organizationId, id);
  }

  @Post('records/:id/churn')
  async churnRecord(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.churn(user.organizationId, id);
  }

  @Post('records/:id/reactivate')
  async reactivateRecord(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.reactivate(user.organizationId, id);
  }

  @Post('records/:id/restart-onboarding')
  async restartOnboarding(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.restartOnboarding(user.organizationId, id);
  }

  // ---- Health ----

  @Get('health')
  async listHealth(@CurrentUser() user: AccessTokenPayload, @Query() query: ListHealthDto) {
    const result = await this.runtime().queries.findHealth({
      organizationId: user.organizationId,
      customerId: query.customerId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.snapshots, result.total, query);
  }

  @Get('health/:customerId/latest')
  async getLatestHealth(
    @CurrentUser() user: AccessTokenPayload,
    @Param('customerId') customerId: string,
  ) {
    return this.runtime().health.getLatest(user.organizationId, customerId);
  }

  @Post('health')
  async recordHealthSnapshot(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: RecordHealthSnapshotDto,
  ) {
    return this.runtime().health.recordSnapshot(user.organizationId, body);
  }

  // ---- Success Plans ----

  @Get('plans')
  async listPlans(@CurrentUser() user: AccessTokenPayload, @Query() query: ListSuccessPlansDto) {
    const result = await this.runtime().queries.findPlans({
      organizationId: user.organizationId,
      customerId: query.customerId,
      status: query.status as csQueries.FindPlansQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.plans, result.total, query);
  }

  @Get('plans/:id')
  async getPlan(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plans.get(user.organizationId, id);
  }

  @Post('plans')
  async createPlan(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateSuccessPlanDto) {
    return this.runtime().plans.createPlan(user.organizationId, body);
  }

  @Post('plans/:id/complete')
  async completePlan(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plans.completePlan(user.organizationId, id);
  }

  @Post('plans/:id/cancel')
  async cancelPlan(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plans.cancelPlan(user.organizationId, id);
  }

  @Get('plans/:id/objectives')
  async listObjectives(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plans.findObjectivesForPlan(user.organizationId, id);
  }

  @Post('plans/objectives')
  async addObjective(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreatePlanObjectiveDto,
  ) {
    return this.runtime().plans.addObjective(user.organizationId, body);
  }

  @Post('plans/objectives/:objectiveId/achieve')
  async achieveObjective(
    @CurrentUser() user: AccessTokenPayload,
    @Param('objectiveId') objectiveId: string,
  ) {
    return this.runtime().plans.achieveObjective(user.organizationId, objectiveId);
  }

  @Get('plans/:id/milestones')
  async listPlanMilestones(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plans.findMilestonesForPlan(user.organizationId, id);
  }

  @Post('plans/milestones')
  async addPlanMilestone(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreatePlanMilestoneDto,
  ) {
    return this.runtime().plans.addMilestone(user.organizationId, body);
  }

  @Post('plans/milestones/:milestoneId/reach')
  async reachPlanMilestone(
    @CurrentUser() user: AccessTokenPayload,
    @Param('milestoneId') milestoneId: string,
    @Body() body: ReachPlanMilestoneDto,
  ) {
    return this.runtime().plans.reachMilestone(user.organizationId, milestoneId, body.actualDate);
  }

  @Post('plans/milestones/:milestoneId/miss')
  async missPlanMilestone(
    @CurrentUser() user: AccessTokenPayload,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.runtime().plans.missMilestone(user.organizationId, milestoneId);
  }

  @Get('plans/:id/tasks')
  async listPlanTasks(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plans.findTasksForPlan(user.organizationId, id);
  }

  @Post('plans/tasks')
  async addPlanTask(@CurrentUser() user: AccessTokenPayload, @Body() body: CreatePlanTaskDto) {
    return this.runtime().plans.addTask(user.organizationId, body);
  }

  @Post('plans/tasks/:taskId/start')
  async startPlanTask(@CurrentUser() user: AccessTokenPayload, @Param('taskId') taskId: string) {
    return this.runtime().plans.startTask(user.organizationId, taskId);
  }

  @Post('plans/tasks/:taskId/complete')
  async completePlanTask(@CurrentUser() user: AccessTokenPayload, @Param('taskId') taskId: string) {
    return this.runtime().plans.completeTask(user.organizationId, taskId);
  }

  // ---- Renewals ----

  @Get('renewals')
  async listRenewals(@CurrentUser() user: AccessTokenPayload, @Query() query: ListRenewalsDto) {
    const result = await this.runtime().queries.findRenewals({
      organizationId: user.organizationId,
      customerId: query.customerId,
      status: query.status as csQueries.FindRenewalsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.renewals, result.total, query);
  }

  @Get('renewals/:id')
  async getRenewal(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().renewals.get(user.organizationId, id);
  }

  @Post('renewals')
  async createRenewal(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateRenewalDto) {
    return this.runtime().renewals.createRenewal(user.organizationId, body);
  }

  @Post('renewals/:id/send-reminder')
  async sendReminder(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().renewals.sendReminder(user.organizationId, id);
  }

  @Post('renewals/:id/mark-at-risk')
  async markRenewalAtRisk(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().renewals.markAtRisk(user.organizationId, id);
  }

  @Patch('renewals/:id/probability')
  async updateRenewalProbability(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateProbabilityDto,
  ) {
    return this.runtime().renewals.updateProbability(user.organizationId, id, body.probability);
  }

  @Post('renewals/:id/complete')
  async completeRenewal(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: CompleteRenewalDto,
  ) {
    return this.runtime().renewals.complete(user.organizationId, id, body.outcome);
  }

  // ---- Expansion ----

  @Get('expansion')
  async listExpansion(@CurrentUser() user: AccessTokenPayload, @Query() query: ListExpansionDto) {
    const result = await this.runtime().queries.findExpansion({
      organizationId: user.organizationId,
      customerId: query.customerId,
      opportunityType: query.opportunityType as csQueries.FindExpansionQuery['opportunityType'],
      status: query.status as csQueries.FindExpansionQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.opportunities, result.total, query);
  }

  @Get('expansion/:id')
  async getExpansion(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().expansion.get(user.organizationId, id);
  }

  @Post('expansion')
  async identifyExpansion(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: IdentifyExpansionDto,
  ) {
    return this.runtime().expansion.identify(user.organizationId, body);
  }

  @Post('expansion/:id/propose')
  async proposeExpansion(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().expansion.propose(user.organizationId, id);
  }

  @Post('expansion/:id/win')
  async winExpansion(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().expansion.win(user.organizationId, id);
  }

  @Post('expansion/:id/lose')
  async loseExpansion(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().expansion.lose(user.organizationId, id);
  }

  // ---- Risks ----

  @Get('risks')
  async listRisks(@CurrentUser() user: AccessTokenPayload, @Query() query: ListCustomerRisksDto) {
    const result = await this.runtime().queries.findRisks({
      organizationId: user.organizationId,
      customerId: query.customerId,
      status: query.status as csQueries.FindRisksQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.risks, result.total, query);
  }

  @Get('risks/:id')
  async getRisk(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().risks.get(user.organizationId, id);
  }

  @Post('risks')
  async createRisk(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateCustomerRiskDto) {
    return this.runtime().risks.create(user.organizationId, body);
  }

  @Patch('risks/:id')
  async updateRisk(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateCustomerRiskDto,
  ) {
    return this.runtime().risks.update(user.organizationId, id, body);
  }

  @Post('risks/:id/start-mitigation')
  async startMitigation(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().risks.startMitigation(user.organizationId, id);
  }

  @Post('risks/:id/resolve')
  async resolveRisk(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().risks.resolve(user.organizationId, id);
  }

  @Post('risks/:id/accept')
  async acceptRisk(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().risks.accept(user.organizationId, id);
  }

  @Post('risks/:id/mark-occurred')
  async markRiskOccurred(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().risks.markOccurred(user.organizationId, id);
  }

  // ---- Feedback ----

  @Get('feedback')
  async listFeedback(@CurrentUser() user: AccessTokenPayload, @Query() query: ListFeedbackDto) {
    const result = await this.runtime().queries.findFeedback({
      organizationId: user.organizationId,
      customerId: query.customerId,
      feedbackType: query.feedbackType as csQueries.FindFeedbackQuery['feedbackType'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.entries, result.total, query);
  }

  @Post('feedback')
  async recordFeedback(@CurrentUser() user: AccessTokenPayload, @Body() body: RecordFeedbackDto) {
    return this.runtime().feedback.recordFeedback(user.organizationId, body);
  }

  @Get('feedback/:customerId/nps')
  async getNps(@CurrentUser() user: AccessTokenPayload, @Param('customerId') customerId: string) {
    const nps = await this.runtime().feedback.computeNpsForCustomer(
      user.organizationId,
      customerId,
    );
    return { nps };
  }

  @Get('feedback/:customerId/csat')
  async getCsat(@CurrentUser() user: AccessTokenPayload, @Param('customerId') customerId: string) {
    const csat = await this.runtime().feedback.computeCsatForCustomer(
      user.organizationId,
      customerId,
    );
    return { csat };
  }

  // ---- Search ----

  @Get('search')
  async search(@CurrentUser() user: AccessTokenPayload, @Query('keyword') keyword: string) {
    return this.runtime().queries.searchCustomerSuccess({
      organizationId: user.organizationId,
      keyword,
    });
  }
}
