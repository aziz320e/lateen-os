import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO8601,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const AR_INVOICE_STATUSES = ['draft', 'issued', 'partially_paid', 'paid', 'cancelled'] as const;

export class CreateARCustomerDto {
  @ApiProperty() @IsString() displayName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() externalCustomerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() creditLimit?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() paymentTermsDays?: number;
  @ApiProperty() @IsString() currency!: string;
}

export class ARInvoiceLineDto {
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsString() quantity!: string;
  @ApiProperty() @IsString() unitPrice!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taxRatePct?: string;
}

export class CreateARInvoiceDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty({ type: [ARInvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ARInvoiceLineDto)
  lines!: ARInvoiceLineDto[];
  @ApiProperty() @IsString() currency!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceOpportunityId?: string;
}

export class IssueARInvoiceDto {
  @ApiProperty() @IsISO8601() issueDate!: string;
}

export class RecordARPaymentDto {
  @ApiProperty() @IsString() amount!: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() paidAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
}

export class CreateCreditNoteDto {
  @ApiProperty() @IsString() customerId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceId?: string;
  @ApiProperty() @IsString() amount!: string;
  @ApiProperty() @IsString() currency!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class ListARInvoicesDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional({ enum: AR_INVOICE_STATUSES })
  @IsOptional()
  @IsIn(AR_INVOICE_STATUSES)
  status?: (typeof AR_INVOICE_STATUSES)[number];
}
