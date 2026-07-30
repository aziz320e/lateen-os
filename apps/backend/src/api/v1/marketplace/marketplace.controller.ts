/**
 * Marketplace REST API (`/api/v1/marketplace`). Every route reaches the
 * real, hosted `marketplace-engine` runtime (registered under the
 * runtime-registry name `marketplace`) exclusively through
 * `RuntimeRegistryService` → the runtime's own `queries` port or its
 * lifecycle services.
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  MarketplaceRuntime,
  queries as marketplaceQueries,
} from '@lateen-os/marketplace-engine';
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
  CheckCompatibilityDto,
  InstallExtensionDto,
  ListExtensionsDto,
  ListPluginsDto,
  RegisterPluginDto,
  UpgradeExtensionDto,
} from './dto/extension-plugin.dto.js';
import {
  ListCatalogDto,
  ListPackagesDto,
  PublishToCatalogDto,
  PublishVersionDto,
  RecordRatingDto,
  VerifySignatureDto,
} from './dto/package-catalog.dto.js';
import {
  CreateSandboxProfileDto,
  DeclareEventDto,
  ListExtensionConfigurationsDto,
  SetExtensionConfigDto,
} from './dto/sandbox-config-events.dto.js';

@ApiTags('Marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/marketplace')
export class MarketplaceController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): MarketplaceRuntime {
    return requireRuntime<MarketplaceRuntime>(this.registry, 'marketplace');
  }

  // ---- Extensions ----

  @Get('extensions')
  async listExtensions(@CurrentUser() user: AccessTokenPayload, @Query() query: ListExtensionsDto) {
    const result = await this.runtime().queries.findExtensions({
      organizationId: user.organizationId,
      status: query.status as marketplaceQueries.FindExtensionsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.extensions, result.total, query);
  }

  @Get('extensions/:id')
  async getExtension(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().extensions.getExtension(user.organizationId, id);
  }

  @Post('extensions')
  async installExtension(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: InstallExtensionDto,
  ) {
    return this.runtime().extensions.install(user.organizationId, body);
  }

  @Post('extensions/:id/uninstall')
  async uninstallExtension(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().extensions.uninstall(user.organizationId, id);
  }

  @Post('extensions/:id/enable')
  async enableExtension(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().extensions.enable(user.organizationId, id);
  }

  @Post('extensions/:id/disable')
  async disableExtension(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().extensions.disable(user.organizationId, id);
  }

  @Post('extensions/:id/upgrade')
  async upgradeExtension(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpgradeExtensionDto,
  ) {
    return this.runtime().extensions.upgrade(user.organizationId, id, body);
  }

  @Post('extensions/:id/validate')
  async validateExtension(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().extensions.validateExtension(user.organizationId, id);
  }

  // ---- Plugins ----

  @Get('plugins')
  async listPlugins(@CurrentUser() user: AccessTokenPayload, @Query() query: ListPluginsDto) {
    const result = await this.runtime().queries.findPlugins({
      organizationId: user.organizationId,
      status: query.status as marketplaceQueries.FindPluginsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.plugins, result.total, query);
  }

  @Get('plugins/:id')
  async getPlugin(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plugins.getPlugin(user.organizationId, id);
  }

  @Post('plugins')
  async registerPlugin(@CurrentUser() user: AccessTokenPayload, @Body() body: RegisterPluginDto) {
    return this.runtime().plugins.registerPlugin(user.organizationId, body);
  }

  @Post('plugins/:id/deprecate')
  async deprecatePlugin(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plugins.deprecatePlugin(user.organizationId, id);
  }

  @Post('plugins/:id/reactivate')
  async reactivatePlugin(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plugins.reactivatePlugin(user.organizationId, id);
  }

  @Post('plugins/:id/archive')
  async archivePlugin(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().plugins.archivePlugin(user.organizationId, id);
  }

  @Post('plugins/:id/check-compatibility')
  async checkPluginCompatibility(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: CheckCompatibilityDto,
  ) {
    return this.runtime().plugins.checkCompatibility(user.organizationId, id, body.hostVersion);
  }

  // ---- Packages ----

  @Get('packages')
  async listPackages(@CurrentUser() user: AccessTokenPayload, @Query() query: ListPackagesDto) {
    const result = await this.runtime().queries.findPackages({
      organizationId: user.organizationId,
      extensionKey: query.extensionKey,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.packages, result.total, query);
  }

  @Get('packages/:id')
  async getPackageVersion(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().packages.getVersion(user.organizationId, id);
  }

  @Post('packages')
  async publishVersion(@CurrentUser() user: AccessTokenPayload, @Body() body: PublishVersionDto) {
    return this.runtime().packages.publishVersion(user.organizationId, body);
  }

  @Post('packages/:id/verify-signature')
  async verifySignature(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: VerifySignatureDto,
  ) {
    const valid = await this.runtime().packages.verifySignature(
      user.organizationId,
      id,
      body.providedSignature,
    );
    return { valid };
  }

  @Get('packages/extension/:extensionKey/dependents')
  async findDependents(
    @CurrentUser() user: AccessTokenPayload,
    @Param('extensionKey') extensionKey: string,
  ) {
    return this.runtime().packages.findDependents(user.organizationId, extensionKey);
  }

  // ---- Sandbox ----

  @Get('sandbox-profiles')
  async listSandboxProfiles(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().sandbox.listSandboxProfiles(user.organizationId);
  }

  @Post('sandbox-profiles')
  async createSandboxProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateSandboxProfileDto,
  ) {
    return this.runtime().sandbox.createSandboxProfile(user.organizationId, body);
  }

  @Post('sandbox-profiles/:id/capabilities/:capability')
  async allowCapability(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('capability') capability: string,
  ) {
    return this.runtime().sandbox.allowCapability(user.organizationId, id, capability);
  }

  @Post('sandbox-profiles/:id/permissions/:permission')
  async grantSandboxPermission(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('permission') permission: string,
  ) {
    return this.runtime().sandbox.grantPermission(user.organizationId, id, permission);
  }

  // ---- Configuration ----

  @Get('configurations')
  async listExtensionConfigurations(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListExtensionConfigurationsDto,
  ) {
    const result = await this.runtime().queries.findConfigurations({
      organizationId: user.organizationId,
      extensionId: query.extensionId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.configurations, result.total, query);
  }

  @Post('configurations/default')
  async setDefaultConfig(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: SetExtensionConfigDto,
  ) {
    return this.runtime().configuration.setDefault(user.organizationId, body);
  }

  @Post('configurations/override')
  async setConfigOverride(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: SetExtensionConfigDto,
  ) {
    return this.runtime().configuration.setOverride(user.organizationId, body);
  }

  // ---- Extension Events ----

  @Post('extension-events/subscriptions')
  async declareSubscription(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: DeclareEventDto,
  ) {
    return this.runtime().extensionEvents.declareSubscription(user.organizationId, body);
  }

  @Post('extension-events/publications')
  async declarePublication(@CurrentUser() user: AccessTokenPayload, @Body() body: DeclareEventDto) {
    return this.runtime().extensionEvents.declarePublication(user.organizationId, body);
  }

  @Get('extension-events/:extensionId/subscriptions')
  async listSubscriptions(
    @CurrentUser() user: AccessTokenPayload,
    @Param('extensionId') extensionId: string,
  ) {
    return this.runtime().extensionEvents.listSubscriptions(user.organizationId, extensionId);
  }

  @Get('extension-events/:extensionId/publications')
  async listPublications(
    @CurrentUser() user: AccessTokenPayload,
    @Param('extensionId') extensionId: string,
  ) {
    return this.runtime().extensionEvents.listPublications(user.organizationId, extensionId);
  }

  // ---- Catalog ----

  @Get('catalog')
  async listCatalog(@CurrentUser() user: AccessTokenPayload, @Query() query: ListCatalogDto) {
    const result = await this.runtime().queries.findCatalog({
      organizationId: user.organizationId,
      category: query.category,
      publisher: query.publisher,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.entries, result.total, query);
  }

  @Get('catalog/:id')
  async getCatalogEntry(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().catalog.getCatalogEntry(user.organizationId, id);
  }

  @Post('catalog')
  async publishToCatalog(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: PublishToCatalogDto,
  ) {
    return this.runtime().catalog.publishToCatalog(user.organizationId, body);
  }

  @Post('catalog/:id/ratings')
  async recordRating(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: RecordRatingDto,
  ) {
    return this.runtime().catalog.recordRating(user.organizationId, id, body.score);
  }

  @Post('catalog/:id/downloads')
  async recordDownload(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().catalog.recordDownload(user.organizationId, id);
  }

  // ---- Search ----

  @Get('search')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchMarketplace({
      organizationId: user.organizationId,
      keyword,
      limit,
    });
  }
}
