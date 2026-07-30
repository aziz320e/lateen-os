import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const PROJECT_STATUSES = [
  'draft',
  'active',
  'on_hold',
  'completed',
  'cancelled',
  'archived',
] as const;

export class CreateProjectDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() portfolioId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() programId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() targetEndDate?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() targetEndDate?: string;
}

export class CancelProjectDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class ListProjectsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() portfolioId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() programId?: string;
  @ApiPropertyOptional({ enum: PROJECT_STATUSES })
  @IsOptional()
  @IsIn(PROJECT_STATUSES)
  status?: (typeof PROJECT_STATUSES)[number];
}

export class CreatePortfolioDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateProgramDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() portfolioId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreatePhaseDto {
  @ApiProperty() @IsString() projectId!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsNumber() sequence!: number;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() endDate?: string;
}

export class CreateMilestoneDto {
  @ApiProperty() @IsString() projectId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phaseId?: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsISO8601() targetDate!: string;
}

export class ReachMilestoneDto {
  @ApiProperty() @IsISO8601() actualDate!: string;
}

const MILESTONE_STATUSES = ['pending', 'reached', 'missed'] as const;

export class ListMilestonesDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional({ enum: MILESTONE_STATUSES })
  @IsOptional()
  @IsIn(MILESTONE_STATUSES)
  status?: (typeof MILESTONE_STATUSES)[number];
}
