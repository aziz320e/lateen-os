import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const PIPELINE_STAGES = [
  'new',
  'discovery',
  'qualified',
  'proposal',
  'negotiation',
  'verbal_commit',
  'won',
  'lost',
] as const;
const OPPORTUNITY_STATUSES = ['active', 'archived'] as const;

export class CreateSalesOpportunityDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() amount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() expectedCloseDate?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateSalesOpportunityDto extends CreateSalesOpportunityDto {}

export class ListSalesOpportunitiesDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: PIPELINE_STAGES })
  @IsOptional()
  @IsIn(PIPELINE_STAGES)
  stage?: (typeof PIPELINE_STAGES)[number];
  @ApiPropertyOptional({ enum: OPPORTUNITY_STATUSES })
  @IsOptional()
  @IsIn(OPPORTUNITY_STATUSES)
  status?: (typeof OPPORTUNITY_STATUSES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
}

export class AdvanceSalesStageDto {
  @ApiProperty({ enum: PIPELINE_STAGES })
  @IsIn(PIPELINE_STAGES)
  toStage!: (typeof PIPELINE_STAGES)[number];
}

export class CloseWonDto {
  @ApiPropertyOptional() @IsOptional() @IsString() amount?: string;
}

export class CloseLostDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
