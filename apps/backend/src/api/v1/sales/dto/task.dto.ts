import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const TASK_TYPES = ['proposal_approval', 'contract_review', 'follow_up_reminder'] as const;
const TASK_STATUSES = ['pending', 'completed', 'cancelled'] as const;

export class GenerateSalesTaskDto {
  @ApiProperty({ enum: TASK_TYPES }) @IsIn(TASK_TYPES) taskType!: (typeof TASK_TYPES)[number];
  @ApiProperty() @IsString() opportunityId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() dueAt?: string;
}

export class CompleteSalesTaskDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() approved?: boolean;
}

export class ListSalesTasksDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: TASK_STATUSES })
  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: (typeof TASK_STATUSES)[number];
  @ApiPropertyOptional({ enum: TASK_TYPES })
  @IsOptional()
  @IsIn(TASK_TYPES)
  taskType?: (typeof TASK_TYPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() opportunityId?: string;
}
