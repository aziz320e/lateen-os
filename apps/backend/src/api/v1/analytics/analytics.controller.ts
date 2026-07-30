/**
 * Analytics REST API (`/api/v1/analytics`). Every route reaches the
 * real, hosted `analytics-engine` runtime exclusively through
 * `RuntimeRegistryService` → the runtime's own `queries` port or its
 * lifecycle services.
 */
import {
  BadRequestException,
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
import type { AnalyticsRuntime, queries as analyticsQueries } from '@lateen-os/analytics-engine';
import { CurrentUser } from '../../../auth/decorators.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import type { AccessTokenPayload } from '../../../auth/token.service.js';
import { RuntimeRegistryService } from '../../../runtime-registry/runtime-registry.service.js';
import { DomainExceptionFilter } from '../common/domain-exception.filter.js';
import { ListQueryDto } from '../common/list-query.dto.js';
import { LoggingInterceptor } from '../common/logging.interceptor.js';
import { paginateLocal, toPagedResult } from '../common/pagination.util.js';
import { requireRuntime } from '../common/require-runtime.util.js';
import { ResponseInterceptor } from '../common/response.interceptor.js';
import {
  ComputeSnapshotDto,
  CreateDashboardDto,
  GenerateAnalyticsReportDto,
  KPI_TYPES,
  ListAnalyticsReportsDto,
  ListDashboardsDto,
  ListKpisDto,
  ListMetricsDto,
  RecordCounterDto,
  RecordGaugeDto,
  RecordKpiDto,
  RecordMovingAverageDto,
  RecordPercentageDto,
  RecordRatioDto,
  RecordRollingAverageDto,
  RecordTrendMetricDto,
  UpdateDashboardDto,
} from './dto/analytics.dto.js';

const SNAPSHOT_CATEGORIES_WITH_QUERY = [
  'revenue',
  'sales',
  'marketing',
  'workflow',
  'security',
  'compliance',
] as const;
const SNAPSHOT_CATEGORIES = [
  ...SNAPSHOT_CATEGORIES_WITH_QUERY,
  'communication',
  'governance',
] as const;
type SnapshotCategory = (typeof SNAPSHOT_CATEGORIES)[number];

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): AnalyticsRuntime {
    return requireRuntime<AnalyticsRuntime>(this.registry, 'analytics-engine');
  }

  // ---- Dashboards ----

  @Get('dashboards')
  async listDashboards(@CurrentUser() user: AccessTokenPayload, @Query() query: ListDashboardsDto) {
    const result = await this.runtime().queries.findDashboards({
      organizationId: user.organizationId,
      dashboardType: query.dashboardType as analyticsQueries.FindDashboardsQuery['dashboardType'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.dashboards, result.total, query);
  }

  @Get('dashboards/:id')
  async getDashboard(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().dashboards.get(user.organizationId, id);
  }

  @Post('dashboards')
  async createDashboard(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateDashboardDto) {
    return this.runtime().dashboards.create(user.organizationId, body);
  }

  @Patch('dashboards/:id')
  async updateDashboard(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateDashboardDto,
  ) {
    return this.runtime().dashboards.update(user.organizationId, id, body);
  }

  // ---- KPIs ----

  @Get('kpis')
  async listKpis(@CurrentUser() user: AccessTokenPayload, @Query() query: ListKpisDto) {
    const result = await this.runtime().queries.findKPIs({
      organizationId: user.organizationId,
      kpiType: query.kpiType as analyticsQueries.FindKPIsQuery['kpiType'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.kpis, result.total, query);
  }

  @Get('kpis/:kpiType/latest')
  async getLatestKpi(
    @CurrentUser() user: AccessTokenPayload,
    @Param('kpiType') kpiType: (typeof KPI_TYPES)[number],
  ) {
    return this.runtime().kpis.getLatest(user.organizationId, kpiType);
  }

  @Post('kpis/:kpiType')
  async recordKpi(
    @CurrentUser() user: AccessTokenPayload,
    @Param('kpiType') kpiType: (typeof KPI_TYPES)[number],
    @Body() body: RecordKpiDto,
  ) {
    const kpis = this.runtime().kpis;
    const recorders: Record<(typeof KPI_TYPES)[number], typeof kpis.recordRevenue> = {
      revenue: kpis.recordRevenue,
      pipeline_value: kpis.recordPipelineValue,
      conversion_rate: kpis.recordConversionRate,
      win_rate: kpis.recordWinRate,
      average_deal_size: kpis.recordAverageDealSize,
      customer_acquisition_cost: kpis.recordCustomerAcquisitionCost,
      customer_lifetime_value: kpis.recordCustomerLifetimeValue,
      marketing_roi: kpis.recordMarketingRoi,
      campaign_performance: kpis.recordCampaignPerformance,
      response_time: kpis.recordResponseTime,
      workflow_completion: kpis.recordWorkflowCompletion,
      workforce_utilization: kpis.recordWorkforceUtilization,
    };
    const recorder = recorders[kpiType];
    if (!recorder) throw new BadRequestException(`Unknown KPI type: ${kpiType}`);
    return recorder.call(kpis, user.organizationId, body);
  }

  // ---- Metrics ----

  @Get('metrics')
  async listMetrics(@CurrentUser() user: AccessTokenPayload, @Query() query: ListMetricsDto) {
    const result = await this.runtime().queries.findMetrics({
      organizationId: user.organizationId,
      metricName: query.metricName,
      metricType: query.metricType as analyticsQueries.FindMetricsQuery['metricType'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.metrics, result.total, query);
  }

  @Post('metrics/:name/counter')
  async recordCounter(
    @CurrentUser() user: AccessTokenPayload,
    @Param('name') name: string,
    @Body() body: RecordCounterDto,
  ) {
    return this.runtime().metrics.recordCounter(user.organizationId, name, body.delta);
  }

  @Post('metrics/:name/gauge')
  async recordGauge(
    @CurrentUser() user: AccessTokenPayload,
    @Param('name') name: string,
    @Body() body: RecordGaugeDto,
  ) {
    return this.runtime().metrics.recordGauge(user.organizationId, name, body.value);
  }

  @Post('metrics/:name/ratio')
  async recordRatio(
    @CurrentUser() user: AccessTokenPayload,
    @Param('name') name: string,
    @Body() body: RecordRatioDto,
  ) {
    return this.runtime().metrics.recordRatio(user.organizationId, name, body.a, body.b);
  }

  @Post('metrics/:name/percentage')
  async recordPercentage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('name') name: string,
    @Body() body: RecordPercentageDto,
  ) {
    return this.runtime().metrics.recordPercentage(
      user.organizationId,
      name,
      body.part,
      body.whole,
    );
  }

  @Post('metrics/:name/trend')
  async recordTrendMetric(
    @CurrentUser() user: AccessTokenPayload,
    @Param('name') name: string,
    @Body() body: RecordTrendMetricDto,
  ) {
    return this.runtime().metrics.recordTrend(
      user.organizationId,
      name,
      body.previous,
      body.current,
    );
  }

  @Post('metrics/:name/moving-average')
  async recordMovingAverage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('name') name: string,
    @Body() body: RecordMovingAverageDto,
  ) {
    return this.runtime().metrics.recordMovingAverage(
      user.organizationId,
      name,
      body.values,
      body.windowSize,
    );
  }

  @Post('metrics/:name/rolling-average')
  async recordRollingAverage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('name') name: string,
    @Body() body: RecordRollingAverageDto,
  ) {
    return this.runtime().metrics.recordRollingAverage(user.organizationId, name, body.values);
  }

  // ---- Reports ----

  @Get('reports')
  async listReports(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListAnalyticsReportsDto,
  ) {
    const result = await this.runtime().queries.findReports({
      organizationId: user.organizationId,
      format: query.format as analyticsQueries.FindReportsQuery['format'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.reports, result.total, query);
  }

  @Get('reports/:id')
  async getReport(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().reports.get(user.organizationId, id);
  }

  @Post('reports')
  async generateReport(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: GenerateAnalyticsReportDto,
  ) {
    return this.runtime().reports.generateReport(user.organizationId, body);
  }

  // ---- Category snapshots (revenue/sales/marketing/communication/workflow/security/governance/compliance) ----

  @Get('snapshots/:category')
  async listSnapshots(
    @CurrentUser() user: AccessTokenPayload,
    @Param('category') category: SnapshotCategory,
    @Query() query: ListQueryDto,
  ) {
    if ((SNAPSHOT_CATEGORIES_WITH_QUERY as readonly string[]).includes(category)) {
      const result = await this.querySnapshots(
        category,
        user.organizationId,
        query.offset,
        query.limit,
      );
      return toPagedResult(result.snapshots, result.total, query);
    }
    const items = await this.snapshotEngine(category).list(user.organizationId);
    return paginateLocal(items, query);
  }

  @Get('snapshots/:category/:id')
  async getSnapshot(
    @CurrentUser() user: AccessTokenPayload,
    @Param('category') category: SnapshotCategory,
    @Param('id') id: string,
  ) {
    return this.snapshotEngine(category).get(user.organizationId, id);
  }

  @Post('snapshots/:category/compute')
  async computeSnapshot(
    @CurrentUser() user: AccessTokenPayload,
    @Param('category') category: SnapshotCategory,
    @Body() body: ComputeSnapshotDto,
  ) {
    const runtime = this.runtime();
    switch (category) {
      case 'revenue':
        return runtime.revenueAnalytics.computeSnapshot(user.organizationId, body);
      case 'sales':
        return runtime.salesAnalytics.computeSnapshot(user.organizationId, body);
      case 'marketing':
        return runtime.marketingAnalytics.computeSnapshot(user.organizationId);
      case 'communication':
        return runtime.communicationAnalytics.computeSnapshot(user.organizationId);
      case 'workflow':
        return runtime.workflowAnalytics.computeSnapshot(user.organizationId);
      case 'security':
        return runtime.securityAnalytics.computeSnapshot(user.organizationId);
      case 'governance':
        return runtime.governanceAnalytics.computeSnapshot(user.organizationId);
      case 'compliance':
        return runtime.complianceAnalytics.computeSnapshot(user.organizationId);
      default:
        throw new BadRequestException(`Unknown snapshot category: ${category}`);
    }
  }

  /**
   * Every category engine shares the identical `{ get, list }` read
   * shape structurally, but each returns its own distinct snapshot type
   * — narrowed here to a single reporting-only shape since these routes
   * only ever return the object for JSON serialization, never re-type it
   * for further business logic.
   */
  private snapshotEngine(category: SnapshotCategory): {
    get(organizationId: string, id: string): Promise<unknown>;
    list(organizationId: string): Promise<readonly unknown[]>;
  } {
    const runtime = this.runtime();
    switch (category) {
      case 'revenue':
        return runtime.revenueAnalytics;
      case 'sales':
        return runtime.salesAnalytics;
      case 'marketing':
        return runtime.marketingAnalytics;
      case 'communication':
        return runtime.communicationAnalytics;
      case 'workflow':
        return runtime.workflowAnalytics;
      case 'security':
        return runtime.securityAnalytics;
      case 'governance':
        return runtime.governanceAnalytics;
      case 'compliance':
        return runtime.complianceAnalytics;
      default:
        throw new BadRequestException(`Unknown snapshot category: ${category}`);
    }
  }

  private async querySnapshots(
    category: string,
    organizationId: string,
    offset?: number,
    limit?: number,
  ): Promise<{ snapshots: readonly unknown[]; total: number }> {
    const runtime = this.runtime();
    switch (category) {
      case 'revenue': {
        const r = await runtime.queries.findRevenueAnalytics({ organizationId, offset, limit });
        return { snapshots: r.snapshots, total: r.total };
      }
      case 'sales': {
        const r = await runtime.queries.findSalesAnalytics({ organizationId, offset, limit });
        return { snapshots: r.snapshots, total: r.total };
      }
      case 'marketing': {
        const r = await runtime.queries.findMarketingAnalytics({ organizationId, offset, limit });
        return { snapshots: r.snapshots, total: r.total };
      }
      case 'workflow': {
        const r = await runtime.queries.findWorkflowAnalytics({ organizationId, offset, limit });
        return { snapshots: r.snapshots, total: r.total };
      }
      case 'security': {
        const r = await runtime.queries.findSecurityAnalytics({ organizationId, offset, limit });
        return { snapshots: r.snapshots, total: r.total };
      }
      case 'compliance': {
        const r = await runtime.queries.findComplianceAnalytics({ organizationId, offset, limit });
        return { snapshots: r.snapshots, total: r.total };
      }
      default:
        throw new BadRequestException(`No query support for snapshot category: ${category}`);
    }
  }

  // ---- Trends ----

  @Get('trends')
  async listTrends(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().trends.list(user.organizationId);
  }

  @Get('trends/:id')
  async getTrend(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().trends.get(user.organizationId, id);
  }

  // ---- Aggregation (read-only — `aggregate()` itself takes function values and cannot be driven by JSON) ----

  @Get('aggregations')
  async listAggregations(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().aggregation.list(user.organizationId);
  }

  @Get('aggregations/:id')
  async getAggregation(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().aggregation.get(user.organizationId, id);
  }

  // ---- Search ----

  @Get('search')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchAnalytics({
      organizationId: user.organizationId,
      keyword,
      limit,
    });
  }
}
