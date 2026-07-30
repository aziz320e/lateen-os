import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const RENEWAL_STATUSES = ['pipeline', 'reminder_sent', 'at_risk', 'won', 'lost'] as const;
const EXPANSION_TYPES = ['upsell', 'cross_sell'] as const;
const EXPANSION_STATUSES = ['identified', 'proposed', 'won', 'lost'] as const;
const RISK_STATUSES = ['identified', 'mitigating', 'resolved', 'accepted', 'occurred'] as const;
const FEEDBACK_TYPES = ['nps', 'csat', 'survey'] as const;

export class CreateRenewalDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsISO8601() renewalDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() amount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() probability?: number;
}

export class UpdateProbabilityDto {
  @ApiProperty() @IsNumber() probability!: number;
}

export class CompleteRenewalDto {
  @ApiProperty({ enum: ['won', 'lost'] }) @IsIn(['won', 'lost']) outcome!: 'won' | 'lost';
}

export class ListRenewalsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional({ enum: RENEWAL_STATUSES })
  @IsOptional()
  @IsIn(RENEWAL_STATUSES)
  status?: (typeof RENEWAL_STATUSES)[number];
}

export class IdentifyExpansionDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty({ enum: EXPANSION_TYPES })
  @IsIn(EXPANSION_TYPES)
  opportunityType!: (typeof EXPANSION_TYPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() estimatedValue?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
}

export class ListExpansionDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional({ enum: EXPANSION_TYPES })
  @IsOptional()
  @IsIn(EXPANSION_TYPES)
  opportunityType?: (typeof EXPANSION_TYPES)[number];
  @ApiPropertyOptional({ enum: EXPANSION_STATUSES })
  @IsOptional()
  @IsIn(EXPANSION_STATUSES)
  status?: (typeof EXPANSION_STATUSES)[number];
}

export class CreateCustomerRiskDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsNumber() probability!: number;
  @ApiProperty() @IsNumber() impact!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() mitigation?: string;
}

export class UpdateCustomerRiskDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() probability?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() impact?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() mitigation?: string;
}

export class ListCustomerRisksDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional({ enum: RISK_STATUSES })
  @IsOptional()
  @IsIn(RISK_STATUSES)
  status?: (typeof RISK_STATUSES)[number];
}

export class RecordFeedbackDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty({ enum: FEEDBACK_TYPES })
  @IsIn(FEEDBACK_TYPES)
  feedbackType!: (typeof FEEDBACK_TYPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsNumber() score?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() surveyName?: string;
}

export class ListFeedbackDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional({ enum: FEEDBACK_TYPES })
  @IsOptional()
  @IsIn(FEEDBACK_TYPES)
  feedbackType?: (typeof FEEDBACK_TYPES)[number];
}
