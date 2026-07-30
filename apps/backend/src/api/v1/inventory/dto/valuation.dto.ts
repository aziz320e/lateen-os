import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsISO8601, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const VALUATION_METHODS = ['fifo', 'weighted_average'] as const;

export class RecordReceiptDto {
  @ApiProperty() @IsString() itemId!: string;
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiProperty() @IsString() quantity!: string;
  @ApiProperty() @IsString() unitCost!: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() receivedAt?: string;
}

export class RecordIssueDto {
  @ApiProperty() @IsString() itemId!: string;
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiProperty() @IsString() quantity!: string;
  @ApiProperty({ enum: VALUATION_METHODS })
  @IsIn(VALUATION_METHODS)
  method!: (typeof VALUATION_METHODS)[number];
}

export class ListValuationsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() itemId?: string;
  @ApiPropertyOptional({ enum: VALUATION_METHODS })
  @IsOptional()
  @IsIn(VALUATION_METHODS)
  method?: (typeof VALUATION_METHODS)[number];
}

export class CreateInventoryCountDto {
  @ApiProperty({ enum: ['cycle', 'full'] }) @IsIn(['cycle', 'full']) countType!: 'cycle' | 'full';
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) itemIds!: string[];
}

export class RecordCountDto {
  @ApiProperty() @IsString() itemId!: string;
  @ApiProperty() @IsString() countedQuantity!: string;
}

const COUNT_STATUSES = ['draft', 'in_progress', 'completed'] as const;

export class ListCountsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() warehouseId?: string;
  @ApiPropertyOptional({ enum: COUNT_STATUSES })
  @IsOptional()
  @IsIn(COUNT_STATUSES)
  status?: (typeof COUNT_STATUSES)[number];
}

export class GeneratePurchaseRequestDto {
  @ApiProperty() @IsString() itemId!: string;
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiProperty() @IsString() quantity!: string;
}
