import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const DEAL_STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

export class ListOpportunitiesDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: DEAL_STAGES })
  @IsOptional()
  @IsIn(DEAL_STAGES)
  stage?: (typeof DEAL_STAGES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
}

export class CreateOpportunityDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional({ description: 'Decimal amount as a string' })
  @IsOptional()
  @IsString()
  amount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() expectedCloseDate?: string;
  @ApiPropertyOptional({ description: 'Decimal probability as a string' })
  @IsOptional()
  @IsString()
  probability?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateOpportunityDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() amount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() expectedCloseDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() probability?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class AdvanceStageDto {
  @ApiProperty({ enum: DEAL_STAGES }) @IsIn(DEAL_STAGES) toStage!: (typeof DEAL_STAGES)[number];
}

export class WinOpportunityDto {
  @ApiPropertyOptional() @IsOptional() @IsString() amount?: string;
}

export class LoseOpportunityDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
