import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const MOVEMENT_TYPES = [
  'received',
  'issued',
  'transferred',
  'adjusted',
  'reserved',
  'released',
] as const;

export class ReceiveOrIssueDto {
  @ApiProperty() @IsString() itemId!: string;
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiProperty() @IsString() quantity!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() occurredAt?: string;
}

export class TransferStockDto {
  @ApiProperty() @IsString() itemId!: string;
  @ApiProperty() @IsString() fromWarehouseId!: string;
  @ApiProperty() @IsString() toWarehouseId!: string;
  @ApiProperty() @IsString() quantity!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() occurredAt?: string;
}

export class AdjustStockDto {
  @ApiProperty() @IsString() itemId!: string;
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiProperty() @IsString() quantityDelta!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() occurredAt?: string;
}

export class ListMovementsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() itemId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warehouseId?: string;
  @ApiPropertyOptional({ enum: MOVEMENT_TYPES })
  @IsOptional()
  @IsIn(MOVEMENT_TYPES)
  movementType?: (typeof MOVEMENT_TYPES)[number];
}

export class SetStockThresholdsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() minimumStock?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() maximumStock?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reorderPoint?: string;
}

export class ListInventoryDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() itemId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warehouseId?: string;
}
