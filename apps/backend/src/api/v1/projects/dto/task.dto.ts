import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsISO8601, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const TASK_STATUSES = [
  'planned',
  'ready',
  'in_progress',
  'blocked',
  'completed',
  'cancelled',
] as const;
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export class CreateProjectTaskDto {
  @ApiProperty() @IsString() projectId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentTaskId?: string;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: TASK_PRIORITIES })
  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: (typeof TASK_PRIORITIES)[number];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
  @ApiPropertyOptional() @IsOptional() @IsISO8601() dueDate?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOnTaskIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedHours?: number;
}

export class UpdateProjectTaskDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: TASK_PRIORITIES })
  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: (typeof TASK_PRIORITIES)[number];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
  @ApiPropertyOptional() @IsOptional() @IsISO8601() dueDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedHours?: number;
}

export class ListProjectTasksDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional({ enum: TASK_STATUSES })
  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: (typeof TASK_STATUSES)[number];
  @ApiPropertyOptional({ enum: TASK_PRIORITIES })
  @IsOptional()
  @IsIn(TASK_PRIORITIES)
  priority?: (typeof TASK_PRIORITIES)[number];
}

export class DependencyDto {
  @ApiProperty() @IsString() dependsOnTaskId!: string;
}
