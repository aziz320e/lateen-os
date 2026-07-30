import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const ACCOUNT_STATUSES = ['active', 'archived'] as const;

export class ListAccountsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ACCOUNT_STATUSES })
  @IsOptional()
  @IsIn(ACCOUNT_STATUSES)
  status?: (typeof ACCOUNT_STATUSES)[number];
}

export class CreateAccountDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() industry?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateAccountDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() industry?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
