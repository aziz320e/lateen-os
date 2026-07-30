import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const TAX_TYPES = ['VAT', 'GST', 'SALES_TAX', 'ZERO_RATED', 'EXEMPT'] as const;

export class CreateTaxRuleDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: TAX_TYPES }) @IsIn(TAX_TYPES) taxType!: (typeof TAX_TYPES)[number];
  @ApiProperty() @IsString() ratePct!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jurisdiction?: string;
}

export class UpdateTaxRuleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ratePct?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jurisdiction?: string;
}

export class CalculateTaxDto {
  @ApiProperty() @IsString() taxableAmount!: string;
}

export class ListTaxRulesDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: TAX_TYPES })
  @IsOptional()
  @IsIn(TAX_TYPES)
  taxType?: (typeof TAX_TYPES)[number];
}
