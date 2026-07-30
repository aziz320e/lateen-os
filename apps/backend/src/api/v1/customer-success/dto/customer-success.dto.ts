import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const CS_STATUSES = [
  'onboarding',
  'activation',
  'adoption',
  'expansion',
  'renewal',
  'churn',
  'reactivation',
] as const;

export class OnboardCustomerDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}

export class ListCustomerSuccessDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional({ enum: CS_STATUSES })
  @IsOptional()
  @IsIn(CS_STATUSES)
  status?: (typeof CS_STATUSES)[number];
}

export class RecordHealthSnapshotDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsNumber() usageScore!: number;
  @ApiProperty() @IsNumber() communicationScore!: number;
  @ApiProperty() @IsNumber() projectScore!: number;
  @ApiProperty() @IsNumber() paymentScore!: number;
  @ApiProperty() @IsNumber() engagementScore!: number;
  @ApiProperty() @IsNumber() renewalScore!: number;
}

export class ListHealthDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
}
