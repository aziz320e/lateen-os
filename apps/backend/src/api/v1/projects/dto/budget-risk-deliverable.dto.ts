import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const BUDGET_STATUSES = ['active', 'closed'] as const;
const RISK_STATUSES = ['identified', 'mitigating', 'resolved', 'accepted', 'occurred'] as const;
const DELIVERABLE_STATUSES = ['draft', 'in_review', 'accepted', 'rejected', 'completed'] as const;

export class CreateProjectBudgetDto {
  @ApiProperty() @IsString() projectId!: string;
  @ApiProperty() @IsString() currency!: string;
  @ApiProperty() @IsString() plannedBudget!: string;
}

export class RecordCostDto {
  @ApiProperty() @IsString() amount!: string;
}

export class ReviseProjectBudgetDto {
  @ApiProperty() @IsString() plannedBudget!: string;
}

export class ListProjectBudgetsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional({ enum: BUDGET_STATUSES })
  @IsOptional()
  @IsIn(BUDGET_STATUSES)
  status?: (typeof BUDGET_STATUSES)[number];
}

export class CreateProjectRiskDto {
  @ApiProperty() @IsString() projectId!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsNumber() probability!: number;
  @ApiProperty() @IsNumber() impact!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() mitigation?: string;
}

export class UpdateProjectRiskDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() probability?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() impact?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() mitigation?: string;
}

export class ListProjectRisksDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional({ enum: RISK_STATUSES })
  @IsOptional()
  @IsIn(RISK_STATUSES)
  status?: (typeof RISK_STATUSES)[number];
}

export class CreateDeliverableDto {
  @ApiProperty() @IsString() projectId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taskId?: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() dueDate?: string;
}

export class UpdateDeliverableDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() dueDate?: string;
}

export class ApproveDeliverableDto {
  @ApiProperty() @IsString() approverId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}

export class ListDeliverablesDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional({ enum: DELIVERABLE_STATUSES })
  @IsOptional()
  @IsIn(DELIVERABLE_STATUSES)
  status?: (typeof DELIVERABLE_STATUSES)[number];
}
