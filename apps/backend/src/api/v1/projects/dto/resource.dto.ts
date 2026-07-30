import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const ASSIGNEE_TYPES = ['employee', 'ai_worker'] as const;

export class AssignResourceDto {
  @ApiProperty() @IsString() projectId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taskId?: string;
  @ApiProperty({ enum: ASSIGNEE_TYPES })
  @IsIn(ASSIGNEE_TYPES)
  assigneeType!: (typeof ASSIGNEE_TYPES)[number];
  @ApiProperty() @IsString() assigneeId!: string;
  @ApiProperty() @IsNumber() allocationPercentage!: number;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacityPercentage?: number;
}

export class UpdateAllocationDto {
  @ApiProperty() @IsNumber() allocationPercentage!: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacityPercentage?: number;
}

export class ListAssignmentsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigneeId?: string;
}

export class LogWorkDto {
  @ApiProperty() @IsString() projectId!: string;
  @ApiProperty() @IsString() taskId!: string;
  @ApiProperty() @IsString() assigneeId!: string;
  @ApiProperty() @IsISO8601() workDate!: string;
  @ApiProperty() @IsNumber() hoursLogged!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() standardHoursPerDay?: number;
}
