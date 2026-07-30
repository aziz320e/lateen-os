import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const WAREHOUSE_STATUSES = ['active', 'archived'] as const;

export class CreateWarehouseDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
}

export class UpdateWarehouseDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
}

export class ListWarehousesDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: WAREHOUSE_STATUSES })
  @IsOptional()
  @IsIn(WAREHOUSE_STATUSES)
  status?: (typeof WAREHOUSE_STATUSES)[number];
}

export class CreateZoneDto {
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
}

export class CreateStorageLocationDto {
  @ApiProperty() @IsString() warehouseId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() zoneId?: string;
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
}

export class UpdateStorageLocationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
}

export class CreateBinDto {
  @ApiProperty() @IsString() locationId!: string;
  @ApiProperty() @IsString() code!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() capacity?: number;
}
