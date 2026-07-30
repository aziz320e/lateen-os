import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

const COMMISSION_PLAN_TYPES = ['fixed', 'percentage', 'tiered'] as const;

export class CommissionTierDto {
  @ApiProperty() @IsString() minAmount!: string;
  @ApiProperty() @IsString() rate!: string;
}

export class CreateCommissionPlanDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: COMMISSION_PLAN_TYPES })
  @IsIn(COMMISSION_PLAN_TYPES)
  planType!: (typeof COMMISSION_PLAN_TYPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() fixedAmount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() percentageRate?: string;
  @ApiPropertyOptional({ type: [CommissionTierDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommissionTierDto)
  tiers?: CommissionTierDto[];
}

export class CalculateCommissionDto {
  @ApiProperty() @IsString() dealAmount!: string;
}
