import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const QUOTE_STATUSES = ['draft', 'archived'] as const;

export class QuoteLineItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsString() quantity!: string;
  @ApiProperty() @IsString() unitPrice!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() discountPct?: string;
}

export class CreateQuoteDto {
  @ApiProperty() @IsString() title!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() opportunityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiProperty() @IsString() currency!: string;
  @ApiProperty({ type: [QuoteLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineItemDto)
  lineItems!: QuoteLineItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() discountPct?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taxRatePct?: string;
}

export class UpdateQuoteDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional({ type: [QuoteLineItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineItemDto)
  lineItems?: QuoteLineItemDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() discountPct?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taxRatePct?: string;
}

export class ListQuotesDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: QUOTE_STATUSES })
  @IsOptional()
  @IsIn(QUOTE_STATUSES)
  status?: (typeof QUOTE_STATUSES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() opportunityId?: string;
}
