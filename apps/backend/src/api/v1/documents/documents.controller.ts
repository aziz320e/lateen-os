/**
 * Documents REST API (`/api/v1/documents`). Every route reaches the
 * real, hosted `document-management-engine` runtime exclusively through
 * `RuntimeRegistryService` → the runtime's own `queries` port or its
 * lifecycle services.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  DocumentManagementRuntime,
  queries as documentQueries,
} from '@lateen-os/document-management-engine';
import { CurrentUser } from '../../../auth/decorators.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import type { AccessTokenPayload } from '../../../auth/token.service.js';
import { RuntimeRegistryService } from '../../../runtime-registry/runtime-registry.service.js';
import { DomainExceptionFilter } from '../common/domain-exception.filter.js';
import { LoggingInterceptor } from '../common/logging.interceptor.js';
import { toPagedResult } from '../common/pagination.util.js';
import { requireRuntime } from '../common/require-runtime.util.js';
import { ResponseInterceptor } from '../common/response.interceptor.js';
import {
  CreateDocumentDto,
  CreateFolderDto,
  GrantFolderPermissionDto,
  ListDocumentsDto,
  ListFoldersDto,
  UpdateDocumentDto,
  UpdateFolderDto,
} from './dto/document.dto.js';
import {
  CreateDocumentVersionDto,
  LinkEntityDto,
  ListMetadataDto,
  ListRelationshipsDto,
  ListVersionsDto,
  RestoreVersionDto,
  UpsertMetadataDto,
} from './dto/version-metadata.dto.js';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/documents')
export class DocumentsController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): DocumentManagementRuntime {
    return requireRuntime<DocumentManagementRuntime>(this.registry, 'document-management-engine');
  }

  // ---- Folders (static prefix, declared first) ----

  @Get('folders')
  async listFolders(@CurrentUser() user: AccessTokenPayload, @Query() query: ListFoldersDto) {
    const result = await this.runtime().queries.findFolders({
      organizationId: user.organizationId,
      parentFolderId: query.parentFolderId,
      status: query.status as documentQueries.FindFoldersQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.folders, result.total, query);
  }

  @Get('folders/:id')
  async getFolder(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().folders.get(user.organizationId, id);
  }

  @Get('folders/:id/children')
  async getFolderChildren(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().folders.getChildren(user.organizationId, id);
  }

  @Post('folders')
  async createFolder(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateFolderDto) {
    return this.runtime().folders.create(user.organizationId, body);
  }

  @Patch('folders/:id')
  async updateFolder(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateFolderDto,
  ) {
    return this.runtime().folders.update(user.organizationId, id, body);
  }

  @Post('folders/:id/archive')
  async archiveFolder(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().folders.archive(user.organizationId, id);
  }

  @Post('folders/:id/restore')
  async restoreFolder(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().folders.restore(user.organizationId, id);
  }

  @Post('folders/:id/permissions')
  async grantFolderPermission(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: GrantFolderPermissionDto,
  ) {
    return this.runtime().folders.grantPermission(user.organizationId, id, body);
  }

  @Delete('folders/:id/permissions/:principalId')
  async revokeFolderPermission(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('principalId') principalId: string,
  ) {
    return this.runtime().folders.revokePermission(user.organizationId, id, principalId);
  }

  // ---- Versions ----

  @Get('versions')
  async listVersions(@CurrentUser() user: AccessTokenPayload, @Query() query: ListVersionsDto) {
    const result = await this.runtime().queries.findVersions({
      organizationId: user.organizationId,
      documentId: query.documentId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.versions, result.total, query);
  }

  @Post('versions')
  async createVersion(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateDocumentVersionDto,
  ) {
    return this.runtime().versions.createVersion(user.organizationId, body);
  }

  @Get('versions/compare/:documentId/:versionA/:versionB')
  async compareVersions(
    @CurrentUser() user: AccessTokenPayload,
    @Param('documentId') documentId: string,
    @Param('versionA') versionA: string,
    @Param('versionB') versionB: string,
  ) {
    return this.runtime().versions.compareVersions(
      user.organizationId,
      documentId,
      Number(versionA),
      Number(versionB),
    );
  }

  @Post('versions/:documentId/restore')
  async restoreVersion(
    @CurrentUser() user: AccessTokenPayload,
    @Param('documentId') documentId: string,
    @Body() body: RestoreVersionDto,
  ) {
    return this.runtime().versions.restoreVersion(
      user.organizationId,
      documentId,
      body.versionNumber,
    );
  }

  // ---- Metadata ----

  @Get('metadata')
  async listMetadata(@CurrentUser() user: AccessTokenPayload, @Query() query: ListMetadataDto) {
    const result = await this.runtime().queries.findMetadata({
      organizationId: user.organizationId,
      documentId: query.documentId,
      category: query.category,
      tag: query.tag,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.metadata, result.total, query);
  }

  @Post('metadata')
  async upsertMetadata(@CurrentUser() user: AccessTokenPayload, @Body() body: UpsertMetadataDto) {
    return this.runtime().metadata.upsertMetadata(user.organizationId, body);
  }

  @Post('metadata/:documentId/tags/:tag')
  async addTag(
    @CurrentUser() user: AccessTokenPayload,
    @Param('documentId') documentId: string,
    @Param('tag') tag: string,
  ) {
    return this.runtime().metadata.addTag(user.organizationId, documentId, tag);
  }

  @Delete('metadata/:documentId/tags/:tag')
  async removeTag(
    @CurrentUser() user: AccessTokenPayload,
    @Param('documentId') documentId: string,
    @Param('tag') tag: string,
  ) {
    return this.runtime().metadata.removeTag(user.organizationId, documentId, tag);
  }

  @Post('metadata/:documentId/categories/:category')
  async addCategory(
    @CurrentUser() user: AccessTokenPayload,
    @Param('documentId') documentId: string,
    @Param('category') category: string,
  ) {
    return this.runtime().metadata.addCategory(user.organizationId, documentId, category);
  }

  @Delete('metadata/:documentId/categories/:category')
  async removeCategory(
    @CurrentUser() user: AccessTokenPayload,
    @Param('documentId') documentId: string,
    @Param('category') category: string,
  ) {
    return this.runtime().metadata.removeCategory(user.organizationId, documentId, category);
  }

  // ---- Relationships ----

  @Get('relationships')
  async listRelationships(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListRelationshipsDto,
  ) {
    const result = await this.runtime().queries.findRelationships({
      organizationId: user.organizationId,
      documentId: query.documentId,
      relatedEntityType:
        query.relatedEntityType as documentQueries.FindRelationshipsQuery['relatedEntityType'],
      relatedEntityId: query.relatedEntityId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.relationships, result.total, query);
  }

  @Post('relationships')
  async linkEntity(@CurrentUser() user: AccessTokenPayload, @Body() body: LinkEntityDto) {
    return this.runtime().relationships.linkEntity(user.organizationId, body);
  }

  @Delete('relationships/:id')
  async unlinkEntity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    await this.runtime().relationships.unlinkEntity(user.organizationId, id);
    return { unlinked: true };
  }

  // ---- Search (static path) ----

  @Get('search')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchDocuments({
      organizationId: user.organizationId,
      keyword,
      limit,
    });
  }

  // ---- Documents (root resource — list/create unambiguous; `:id` routes declared last) ----

  @Get()
  async listDocuments(@CurrentUser() user: AccessTokenPayload, @Query() query: ListDocumentsDto) {
    const result = await this.runtime().queries.findDocuments({
      organizationId: user.organizationId,
      folderId: query.folderId,
      documentType: query.documentType as documentQueries.FindDocumentsQuery['documentType'],
      status: query.status as documentQueries.FindDocumentsQuery['status'],
      ownerId: query.ownerId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.documents, result.total, query);
  }

  @Post()
  async createDocument(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateDocumentDto) {
    return this.runtime().documents.create(user.organizationId, body);
  }

  @Get(':id')
  async getDocument(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().documents.get(user.organizationId, id);
  }

  @Patch(':id')
  async updateDocument(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.runtime().documents.update(user.organizationId, id, body);
  }

  @Post(':id/submit-for-review')
  async submitForReview(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().documents.submitForReview(user.organizationId, id);
  }

  @Post(':id/return-to-draft')
  async returnToDraft(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().documents.returnToDraft(user.organizationId, id);
  }

  @Post(':id/approve')
  async approveDocument(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().documents.approve(user.organizationId, id);
  }

  @Post(':id/publish')
  async publishDocument(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().documents.publish(user.organizationId, id);
  }

  @Post(':id/archive')
  async archiveDocument(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().documents.archive(user.organizationId, id);
  }

  @Post(':id/restore')
  async restoreDocument(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().documents.restore(user.organizationId, id);
  }

  @Delete(':id')
  async deleteDocument(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    await this.runtime().documents.delete(user.organizationId, id);
    return { deleted: true };
  }
}
