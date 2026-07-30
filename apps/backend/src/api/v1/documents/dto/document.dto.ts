import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const DOCUMENT_TYPES = [
  'contract',
  'proposal',
  'invoice_reference',
  'sop',
  'policy',
  'specification',
  'report',
  'project_document',
  'customer_document',
  'hr_document',
] as const;
const DOCUMENT_STATUSES = ['draft', 'review', 'approved', 'published', 'archived'] as const;

export class CreateDocumentDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty({ enum: DOCUMENT_TYPES })
  @IsIn(DOCUMENT_TYPES)
  documentType!: (typeof DOCUMENT_TYPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() folderId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() folderId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}

export class ListDocumentsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() folderId?: string;
  @ApiPropertyOptional({ enum: DOCUMENT_TYPES })
  @IsOptional()
  @IsIn(DOCUMENT_TYPES)
  documentType?: (typeof DOCUMENT_TYPES)[number];
  @ApiPropertyOptional({ enum: DOCUMENT_STATUSES })
  @IsOptional()
  @IsIn(DOCUMENT_STATUSES)
  status?: (typeof DOCUMENT_STATUSES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}

const FOLDER_STATUSES = ['active', 'archived'] as const;
const FOLDER_ACCESS_LEVELS = ['read', 'write', 'admin'] as const;

export class CreateFolderDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentFolderId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}

export class UpdateFolderDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ownerId?: string;
}

export class ListFoldersDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() parentFolderId?: string;
  @ApiPropertyOptional({ enum: FOLDER_STATUSES })
  @IsOptional()
  @IsIn(FOLDER_STATUSES)
  status?: (typeof FOLDER_STATUSES)[number];
}

export class GrantFolderPermissionDto {
  @ApiProperty() @IsString() principalId!: string;
  @ApiProperty({ enum: FOLDER_ACCESS_LEVELS })
  @IsIn(FOLDER_ACCESS_LEVELS)
  accessLevel!: (typeof FOLDER_ACCESS_LEVELS)[number];
}
