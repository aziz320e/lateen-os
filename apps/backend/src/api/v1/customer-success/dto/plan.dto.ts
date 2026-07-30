import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const PLAN_STATUSES = ['active', 'completed', 'cancelled'] as const;

export class CreateSuccessPlanDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}

export class ListSuccessPlansDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional({ enum: PLAN_STATUSES })
  @IsOptional()
  @IsIn(PLAN_STATUSES)
  status?: (typeof PLAN_STATUSES)[number];
}

export class CreatePlanObjectiveDto {
  @ApiProperty() @IsString() planId!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreatePlanMilestoneDto {
  @ApiProperty() @IsString() planId!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsISO8601() targetDate!: string;
}

export class ReachPlanMilestoneDto {
  @ApiProperty() @IsISO8601() actualDate!: string;
}

export class CreatePlanTaskDto {
  @ApiProperty() @IsString() planId!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}
