import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const CUSTOMER_STATUSES = ['active', 'archived', 'merged'] as const;

export class ListCustomersDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: CUSTOMER_STATUSES })
  @IsOptional()
  @IsIn(CUSTOMER_STATUSES)
  status?: (typeof CUSTOMER_STATUSES)[number];
}

export class CreateCustomerDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() sourceLeadId?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
