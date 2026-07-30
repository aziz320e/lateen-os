import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsISO8601, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

export class CreateDocumentVersionDto {
  @ApiProperty() @IsString() documentId!: string;
  @ApiProperty() @IsString() contentRef!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() changeNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() createdBy?: string;
}

export class ListVersionsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() documentId?: string;
}

export class RestoreVersionDto {
  @ApiProperty() @IsInt() versionNumber!: number;
}

export class UpsertMetadataDto {
  @ApiProperty() @IsString() documentId!: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  owners?: string[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() retentionDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() expiryDate?: string;
}

export class ListMetadataDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() documentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tag?: string;
}

const RELATED_ENTITY_TYPES = [
  'document',
  'project',
  'customer',
  'employee',
  'knowledge',
  'workflow',
  'communication',
] as const;

export class LinkEntityDto {
  @ApiProperty() @IsString() documentId!: string;
  @ApiProperty({ enum: RELATED_ENTITY_TYPES })
  @IsIn(RELATED_ENTITY_TYPES)
  relatedEntityType!: (typeof RELATED_ENTITY_TYPES)[number];
  @ApiProperty() @IsString() relatedEntityId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() relationType?: string;
}

export class ListRelationshipsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() documentId?: string;
  @ApiPropertyOptional({ enum: RELATED_ENTITY_TYPES })
  @IsOptional()
  @IsIn(RELATED_ENTITY_TYPES)
  relatedEntityType?: (typeof RELATED_ENTITY_TYPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() relatedEntityId?: string;
}
