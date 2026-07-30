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

const BILL_STATUSES = ['draft', 'received', 'partially_paid', 'paid', 'cancelled'] as const;

export class CreateVendorDto {
  @ApiProperty() @IsString() displayName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() externalSupplierId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() paymentTermsDays?: number;
  @ApiProperty() @IsString() currency!: string;
}

export class BillLineDto {
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsString() quantity!: string;
  @ApiProperty() @IsString() unitPrice!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taxRatePct?: string;
}

export class CreateBillDto {
  @ApiProperty() @IsString() vendorId!: string;
  @ApiProperty({ type: [BillLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillLineDto)
  lines!: BillLineDto[];
  @ApiProperty() @IsString() currency!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() billNumber?: string;
}

export class ReceiveBillDto {
  @ApiProperty() @IsISO8601() billDate!: string;
}

export class RecordAPPaymentDto {
  @ApiProperty() @IsString() amount!: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() paidAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
}

export class CreateVendorCreditDto {
  @ApiProperty() @IsString() vendorId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() billId?: string;
  @ApiProperty() @IsString() amount!: string;
  @ApiProperty() @IsString() currency!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class ListBillsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() vendorId?: string;
  @ApiPropertyOptional({ enum: BILL_STATUSES })
  @IsOptional()
  @IsIn(BILL_STATUSES)
  status?: (typeof BILL_STATUSES)[number];
}
