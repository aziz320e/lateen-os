import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

export class PackageDependencyDto {
  @ApiProperty() @IsString() key!: string;
  @ApiProperty() @IsString() versionRange!: string;
}

export class PublishVersionDto {
  @ApiProperty() @IsString() extensionKey!: string;
  @ApiProperty() @IsString() version!: string;
  @ApiPropertyOptional({ type: [PackageDependencyDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageDependencyDto)
  dependencies?: PackageDependencyDto[];
}

export class VerifySignatureDto {
  @ApiProperty() @IsString() providedSignature!: string;
}

export class ListPackagesDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() extensionKey?: string;
}

export class PublishToCatalogDto {
  @ApiProperty() @IsString() extensionKey!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() category!: string;
  @ApiProperty() @IsString() publisher!: string;
}

export class RecordRatingDto {
  @ApiProperty() @IsNumber() score!: number;
}

export class ListCatalogDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() publisher?: string;
}
