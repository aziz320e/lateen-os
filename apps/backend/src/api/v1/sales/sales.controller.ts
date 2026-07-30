/**
 * Sales REST API (`/api/v1/sales`). Every route reaches the real, hosted
 * `sales-engine` runtime exclusively through `RuntimeRegistryService` →
 * the runtime's own `queries` port or its lifecycle services.
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
import type { SalesRuntime, queries as salesQueries } from '@lateen-os/sales-engine';
import { CurrentUser } from '../../../auth/decorators.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import type { AccessTokenPayload } from '../../../auth/token.service.js';
import { RuntimeRegistryService } from '../../../runtime-registry/runtime-registry.service.js';
import { DomainExceptionFilter } from '../common/domain-exception.filter.js';
import { ListQueryDto } from '../common/list-query.dto.js';
import { LoggingInterceptor } from '../common/logging.interceptor.js';
import { toPagedResult } from '../common/pagination.util.js';
import { requireRuntime } from '../common/require-runtime.util.js';
import { ResponseInterceptor } from '../common/response.interceptor.js';
import { ListSalesActivitiesDto, LogSalesActivityDto } from './dto/activity.dto.js';
import { CalculateCommissionDto, CreateCommissionPlanDto } from './dto/commission.dto.js';
import {
  AdvanceSalesStageDto,
  CloseLostDto,
  CloseWonDto,
  CreateSalesOpportunityDto,
  ListSalesOpportunitiesDto,
  UpdateSalesOpportunityDto,
} from './dto/opportunity.dto.js';
import { CreateQuoteDto, ListQuotesDto, UpdateQuoteDto } from './dto/quote.dto.js';
import { CompleteSalesTaskDto, GenerateSalesTaskDto, ListSalesTasksDto } from './dto/task.dto.js';

@ApiTags('Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/sales')
export class SalesController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): SalesRuntime {
    return requireRuntime<SalesRuntime>(this.registry, 'sales-engine');
  }

  // ---- Opportunities ----

  @Get('opportunities')
  async listOpportunities(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListSalesOpportunitiesDto,
  ) {
    const result = await this.runtime().queries.findOpportunities({
      organizationId: user.organizationId,
      stage: query.stage as salesQueries.FindOpportunitiesQuery['stage'],
      status: query.status as salesQueries.FindOpportunitiesQuery['status'],
      customerId: query.customerId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.opportunities, result.total, query);
  }

  @Get('pipeline')
  async getPipeline(@CurrentUser() user: AccessTokenPayload) {
    const result = await this.runtime().queries.findPipeline({
      organizationId: user.organizationId,
    });
    return { data: result.groupedByStage, meta: { total: result.total } };
  }

  @Get('opportunities/:id')
  async getOpportunity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().opportunities.get(user.organizationId, id);
  }

  @Post('opportunities')
  async createOpportunity(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateSalesOpportunityDto,
  ) {
    return this.runtime().opportunities.create(user.organizationId, body);
  }

  @Patch('opportunities/:id')
  async updateOpportunity(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateSalesOpportunityDto,
  ) {
    return this.runtime().opportunities.update(user.organizationId, id, body);
  }

  @Post('opportunities/:id/advance-stage')
  async advanceStage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: AdvanceSalesStageDto,
  ) {
    return this.runtime().opportunities.advanceStage(user.organizationId, id, body.toStage);
  }

  @Post('opportunities/:id/qualify')
  async qualifyOpportunity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().opportunities.qualify(user.organizationId, id);
  }

  @Post('opportunities/:id/propose')
  async proposeOpportunity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().opportunities.propose(user.organizationId, id);
  }

  @Post('opportunities/:id/negotiate')
  async negotiateOpportunity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().opportunities.negotiate(user.organizationId, id);
  }

  @Post('opportunities/:id/close-won')
  async closeWon(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: CloseWonDto,
  ) {
    return this.runtime().opportunities.closeWon(user.organizationId, id, body.amount);
  }

  @Post('opportunities/:id/close-lost')
  async closeLost(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: CloseLostDto,
  ) {
    return this.runtime().opportunities.closeLost(user.organizationId, id, body.reason);
  }

  @Post('opportunities/:id/reopen')
  async reopenOpportunity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().opportunities.reopen(user.organizationId, id);
  }

  @Post('opportunities/:id/archive')
  async archiveOpportunity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().opportunities.archive(user.organizationId, id);
  }

  // ---- Quotes ----

  @Get('quotes')
  async listQuotes(@CurrentUser() user: AccessTokenPayload, @Query() query: ListQuotesDto) {
    const result = await this.runtime().queries.findQuotes({
      organizationId: user.organizationId,
      status: query.status as salesQueries.FindQuotesQuery['status'],
      opportunityId: query.opportunityId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.quotes, result.total, query);
  }

  @Get('quotes/:id')
  async getQuote(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().quotes.getQuote(user.organizationId, id);
  }

  @Get('quotes/:id/versions')
  async getQuoteVersions(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().quotes.getVersionHistory(user.organizationId, id);
  }

  @Post('quotes')
  async createQuote(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateQuoteDto) {
    return this.runtime().quotes.createQuote(user.organizationId, body);
  }

  @Patch('quotes/:id')
  async updateQuote(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateQuoteDto,
  ) {
    return this.runtime().quotes.updateQuote(user.organizationId, id, body);
  }

  @Post('quotes/:id/archive')
  async archiveQuote(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().quotes.archiveQuote(user.organizationId, id);
  }

  // ---- Forecasts ----

  @Get('forecasts')
  async listForecasts(@CurrentUser() user: AccessTokenPayload, @Query() query: ListQueryDto) {
    const result = await this.runtime().queries.findForecasts({
      organizationId: user.organizationId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.forecasts, result.total, query);
  }

  @Get('forecasts/latest')
  async getLatestForecast(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().forecast.getLatestForecast(user.organizationId);
  }

  @Post('forecasts/generate')
  async generateForecast(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().forecast.generateForecast(user.organizationId);
  }

  // ---- Commissions ----

  @Post('commissions')
  async createCommissionPlan(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateCommissionPlanDto,
  ) {
    return this.runtime().commissions.createPlan(user.organizationId, body);
  }

  @Get('commissions/:id')
  async getCommissionPlan(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().commissions.getPlan(user.organizationId, id);
  }

  @Post('commissions/:id/archive')
  async archiveCommissionPlan(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().commissions.archivePlan(user.organizationId, id);
  }

  @Post('commissions/:id/calculate')
  async calculateCommission(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: CalculateCommissionDto,
  ) {
    const amount = await this.runtime().commissions.calculateCommissionForPlan(
      user.organizationId,
      id,
      body.dealAmount,
    );
    return { amount };
  }

  // ---- Activities ----

  @Get('activities')
  async listActivities(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListSalesActivitiesDto,
  ) {
    const result = await this.runtime().queries.findActivities({
      organizationId: user.organizationId,
      activityType: query.activityType as salesQueries.FindActivitiesQuery['activityType'],
      relatedEntityType:
        query.relatedEntityType as salesQueries.FindActivitiesQuery['relatedEntityType'],
      relatedEntityId: query.relatedEntityId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.activities, result.total, query);
  }

  @Get('activities/:id')
  async getActivity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().activities.get(user.organizationId, id);
  }

  @Post('activities')
  async logActivity(@CurrentUser() user: AccessTokenPayload, @Body() body: LogSalesActivityDto) {
    return this.runtime().activities.log(user.organizationId, body);
  }

  @Post('activities/:id/complete')
  async completeActivity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().activities.complete(user.organizationId, id);
  }

  // ---- Tasks ----

  @Get('tasks')
  async listTasks(@CurrentUser() user: AccessTokenPayload, @Query() query: ListSalesTasksDto) {
    const result = await this.runtime().queries.findTasks({
      organizationId: user.organizationId,
      status: query.status as salesQueries.FindTasksQuery['status'],
      taskType: query.taskType as salesQueries.FindTasksQuery['taskType'],
      opportunityId: query.opportunityId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.tasks, result.total, query);
  }

  @Get('tasks/:id')
  async getTask(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tasks.get(user.organizationId, id);
  }

  @Post('tasks')
  async generateTask(@CurrentUser() user: AccessTokenPayload, @Body() body: GenerateSalesTaskDto) {
    return this.runtime().tasks.generateTask(user.organizationId, body);
  }

  @Post('tasks/:id/complete')
  async completeTask(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: CompleteSalesTaskDto,
  ) {
    return this.runtime().tasks.completeTask(user.organizationId, id, body);
  }

  @Post('tasks/:id/cancel')
  async cancelTask(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tasks.cancelTask(user.organizationId, id);
  }

  // ---- Metrics ----

  @Get('metrics')
  async getMetrics(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().metrics.getMetrics(user.organizationId);
  }

  // ---- Search ----

  @Get('search')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchSales({
      organizationId: user.organizationId,
      keyword,
      limit,
    });
  }
}
