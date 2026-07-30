import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsISO8601, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const BUDGET_SCOPES = ['annual', 'department', 'project'] as const;
const BUDGET_STATUSES = ['draft', 'approved', 'revised', 'closed'] as const;

export class BudgetLineDto {
  @ApiProperty() @IsString() accountId!: string;
  @ApiProperty() @IsString() plannedAmount!: string;
}

export class CreateBudgetDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: BUDGET_SCOPES }) @IsIn(BUDGET_SCOPES) scope!: (typeof BUDGET_SCOPES)[number];
  @ApiProperty() @IsString() fiscalYearId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiProperty({ type: [BudgetLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  lines!: BudgetLineDto[];
  @ApiProperty() @IsString() currency!: string;
}

export class ReviseBudgetDto {
  @ApiProperty({ type: [BudgetLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  lines!: BudgetLineDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class ListBudgetsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: BUDGET_SCOPES })
  @IsOptional()
  @IsIn(BUDGET_SCOPES)
  scope?: (typeof BUDGET_SCOPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() fiscalYearId?: string;
}

export class ActualVsBudgetQueryDto {
  @ApiProperty() @IsISO8601() periodStart!: string;
  @ApiProperty() @IsISO8601() periodEnd!: string;
}

export const BUDGET_STATUSES_LIST = BUDGET_STATUSES;
