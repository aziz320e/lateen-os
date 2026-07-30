import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const LEAD_STATUSES = ['new', 'qualified', 'rejected', 'converted'] as const;

export class ListLeadsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: LEAD_STATUSES })
  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: (typeof LEAD_STATUSES)[number];
}

export class CreateLeadDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ConvertLeadDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class RejectLeadDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
