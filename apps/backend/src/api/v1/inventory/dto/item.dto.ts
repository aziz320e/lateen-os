import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const ITEM_STATUSES = ['draft', 'active', 'inactive', 'archived'] as const;

export class CreateInventoryItemDto {
  @ApiProperty() @IsString() sku!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() barcode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() batchNumber?: string;
  @ApiProperty() @IsString() unitOfMeasure!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brandId?: string;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() barcode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() batchNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brandId?: string;
}

export class ListInventoryItemsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brandId?: string;
  @ApiPropertyOptional({ enum: ITEM_STATUSES })
  @IsOptional()
  @IsIn(ITEM_STATUSES)
  status?: (typeof ITEM_STATUSES)[number];
}

export class CreateCategoryDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentCategoryId?: string;
}

export class CreateBrandDto {
  @ApiProperty() @IsString() name!: string;
}
