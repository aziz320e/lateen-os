import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../common/list-query.dto.js';

const DASHBOARD_TYPES = [
  'ceo',
  'sales',
  'marketing',
  'operations',
  'security',
  'governance',
  'compliance',
] as const;

export class CreateDashboardDto {
  @ApiProperty({ enum: DASHBOARD_TYPES })
  @IsIn(DASHBOARD_TYPES)
  dashboardType!: (typeof DASHBOARD_TYPES)[number];
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() config?: Record<string, unknown>;
}

export class UpdateDashboardDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() config?: Record<string, unknown>;
}

export class ListDashboardsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: DASHBOARD_TYPES })
  @IsOptional()
  @IsIn(DASHBOARD_TYPES)
  dashboardType?: (typeof DASHBOARD_TYPES)[number];
}

const KPI_TYPES = [
  'revenue',
  'pipeline_value',
  'conversion_rate',
  'win_rate',
  'average_deal_size',
  'customer_acquisition_cost',
  'customer_lifetime_value',
  'marketing_roi',
  'campaign_performance',
  'response_time',
  'workflow_completion',
  'workforce_utilization',
] as const;
export type KpiTypeParam = (typeof KPI_TYPES)[number];
export { KPI_TYPES };

export class RecordKpiDto {
  @ApiProperty() @IsNumber() value!: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() context?: Record<string, unknown>;
}

export class ListKpisDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: KPI_TYPES }) @IsOptional() @IsIn(KPI_TYPES) kpiType?: KpiTypeParam;
}

const METRIC_TYPES = [
  'counter',
  'gauge',
  'ratio',
  'percentage',
  'trend',
  'moving_average',
  'rolling_average',
] as const;

export class ListMetricsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() metricName?: string;
  @ApiPropertyOptional({ enum: METRIC_TYPES })
  @IsOptional()
  @IsIn(METRIC_TYPES)
  metricType?: (typeof METRIC_TYPES)[number];
}

export class RecordCounterDto {
  @ApiProperty() @IsNumber() delta!: number;
}
export class RecordGaugeDto {
  @ApiProperty() @IsNumber() value!: number;
}
export class RecordRatioDto {
  @ApiProperty() @IsNumber() a!: number;
  @ApiProperty() @IsNumber() b!: number;
}
export class RecordPercentageDto {
  @ApiProperty() @IsNumber() part!: number;
  @ApiProperty() @IsNumber() whole!: number;
}
export class RecordTrendMetricDto {
  @ApiProperty() @IsNumber() previous!: number;
  @ApiProperty() @IsNumber() current!: number;
}
export class RecordMovingAverageDto {
  @ApiProperty({ type: [Number] }) @IsArray() @IsNumber({}, { each: true }) values!: number[];
  @ApiProperty() @IsNumber() windowSize!: number;
}
export class RecordRollingAverageDto {
  @ApiProperty({ type: [Number] }) @IsArray() @IsNumber({}, { each: true }) values!: number[];
}

const REPORT_FORMATS = ['pdf', 'csv', 'json'] as const;

export class ReportSectionDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty({ description: 'Arbitrary row objects' }) @IsArray() rows!: Record<
    string,
    unknown
  >[];
}

export class GenerateAnalyticsReportDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty({ enum: REPORT_FORMATS })
  @IsIn(REPORT_FORMATS)
  format!: (typeof REPORT_FORMATS)[number];
  @ApiProperty({ type: [ReportSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportSectionDto)
  sections!: ReportSectionDto[];
}

export class ListAnalyticsReportsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: REPORT_FORMATS })
  @IsOptional()
  @IsIn(REPORT_FORMATS)
  format?: (typeof REPORT_FORMATS)[number];
}

export class ComputeSnapshotDto {
  @ApiPropertyOptional() @IsOptional() @IsString() asOf?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() previousAsOf?: string;
}
