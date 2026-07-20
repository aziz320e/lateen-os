import { Controller, Get, Inject, Post, Body, Param, Query } from '@nestjs/common';
import { ANALYTICS_SERVICE } from '../tokens';
import type { AnalyticsService } from '../../application/analytics.service';
import { analyticsRequestSchema, exportRequestSchema } from '../../domain/schemas';
import {
  ANALYTICS_DOMAINS,
  CHART_TYPES,
  DASHBOARD_IDS,
  METRIC_IDS,
  PIPELINE_STEPS,
} from '../../domain/types';
import type { DashboardId } from '../../domain/types';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(@Inject(ANALYTICS_SERVICE) private readonly analyticsService: AnalyticsService) {}

  @Post()
  async runAnalytics(@Body() body: unknown) {
    const parsed = analyticsRequestSchema.parse(body);
    return this.analyticsService.runAnalytics({
      organizationId: parsed.organizationId,
      domain: parsed.domain as AnalyticsDomainType | undefined,
      dashboardId: parsed.dashboardId as DashboardId | undefined,
      period: parsed.period,
      dateFrom: parsed.dateFrom,
      dateTo: parsed.dateTo,
      correlationId: parsed.correlationId,
    });
  }

  @Get('domains')
  domains() {
    return { domains: ANALYTICS_DOMAINS, metrics: METRIC_IDS };
  }

  @Get('pipeline')
  pipeline() {
    return { steps: PIPELINE_STEPS };
  }

  @Get('chart-types')
  chartTypes() {
    return { types: CHART_TYPES };
  }
}

@Controller('api/dashboard')
export class DashboardController {
  constructor(@Inject(ANALYTICS_SERVICE) private readonly analyticsService: AnalyticsService) {}

  @Get()
  list() {
    return this.analyticsService.listDashboards();
  }

  @Get(':id')
  async get(@Param('id') id: string, @Query('organizationId') organizationId: string) {
    return this.analyticsService.getDashboard(id as DashboardId, organizationId ?? 'org-1');
  }
}

@Controller('api/metrics')
export class MetricsController {
  constructor(@Inject(ANALYTICS_SERVICE) private readonly analyticsService: AnalyticsService) {}

  @Get()
  async list(@Query('organizationId') organizationId: string, @Query('domain') domain?: string) {
    return this.analyticsService.getMetrics({ organizationId: organizationId ?? 'org-1', domain: domain as AnalyticsDomainType });
  }
}

type AnalyticsDomainType = import('../../domain/types.js').AnalyticsDomain;

@Controller('api/reports')
export class ReportsController {
  constructor(@Inject(ANALYTICS_SERVICE) private readonly analyticsService: AnalyticsService) {}

  @Get()
  list() {
    return this.analyticsService.listReports();
  }
}

@Controller('api/alerts')
export class AlertsController {
  constructor(@Inject(ANALYTICS_SERVICE) private readonly analyticsService: AnalyticsService) {}

  @Get()
  list() {
    return this.analyticsService.listAlerts();
  }
}

@Controller('api/exports')
export class ExportsController {
  constructor(@Inject(ANALYTICS_SERVICE) private readonly analyticsService: AnalyticsService) {}

  @Post()
  async create(@Body() body: unknown) {
    const parsed = exportRequestSchema.parse(body);
    return this.analyticsService.createExport(parsed.organizationId, parsed.format, parsed.dashboardId as DashboardId);
  }

  @Get()
  list(@Query('organizationId') organizationId: string) {
    return this.analyticsService.listExports(organizationId ?? 'org-1');
  }
}

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'analytics-platform', dashboards: DASHBOARD_IDS.length };
  }
}
