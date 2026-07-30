/**
 * Administration REST API (`/api/v1/administration`). Every route
 * reaches the real, hosted `admin-console` runtime exclusively through
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
import type { AdminConsoleRuntime, queries as adminQueries } from '@lateen-os/admin-console';
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
  CreateAdminUserDto,
  CreateGroupDto,
  CreatePermissionDto,
  CreateRoleDto,
  ListAdminUsersDto,
  ListRolesDto,
  RegisterFeatureFlagDto,
} from './dto/feature-flag-identity.dto.js';
import {
  CreateEnvironmentDto,
  CreateTenantDto,
  ListOrganizationsDto,
  ListTenantsDto,
  RegisterOrganizationDto,
} from './dto/organization-tenant.dto.js';
import {
  ListAuditsDto,
  ListSettingsDto,
  RecordAuditDto,
  SetRuntimeConfigDto,
  UpsertSettingDto,
} from './dto/settings-audit.dto.js';

@ApiTags('Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/administration')
export class AdministrationController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): AdminConsoleRuntime {
    return requireRuntime<AdminConsoleRuntime>(this.registry, 'admin-console');
  }

  // ---- Organizations (platform-wide — not scoped to the caller's own org) ----

  @Get('organizations')
  async listOrganizations(@Query() query: ListOrganizationsDto) {
    const result = await this.runtime().queries.findOrganizations({
      status: query.status as adminQueries.FindOrganizationsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.organizations, result.total, query);
  }

  @Get('organizations/:id')
  async getOrganization(@Param('id') id: string) {
    return this.runtime().organizations.getOrganization(id);
  }

  @Post('organizations')
  async registerOrganization(@Body() body: RegisterOrganizationDto) {
    return this.runtime().organizations.registerOrganization(body.organizationId, body);
  }

  @Post('organizations/:id/suspend')
  async suspendOrganization(@Param('id') id: string) {
    return this.runtime().organizations.suspendOrganization(id);
  }

  @Post('organizations/:id/reactivate')
  async reactivateOrganization(@Param('id') id: string) {
    return this.runtime().organizations.reactivateOrganization(id);
  }

  @Post('organizations/:id/archive')
  async archiveOrganization(@Param('id') id: string) {
    return this.runtime().organizations.archiveOrganization(id);
  }

  // ---- Tenants & Environments (scoped to the caller's own org) ----

  @Get('tenants')
  async listTenants(@CurrentUser() user: AccessTokenPayload, @Query() query: ListTenantsDto) {
    const result = await this.runtime().queries.findTenants({
      organizationId: user.organizationId,
      status: query.status as adminQueries.FindTenantsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.tenants, result.total, query);
  }

  @Get('tenants/:id')
  async getTenant(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tenants.getTenant(user.organizationId, id);
  }

  @Post('tenants')
  async createTenant(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateTenantDto) {
    return this.runtime().tenants.createTenant(user.organizationId, body);
  }

  @Post('tenants/:id/suspend')
  async suspendTenant(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tenants.suspendTenant(user.organizationId, id);
  }

  @Post('tenants/:id/reactivate')
  async reactivateTenant(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tenants.reactivateTenant(user.organizationId, id);
  }

  @Post('tenants/:id/archive')
  async archiveTenant(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tenants.archiveTenant(user.organizationId, id);
  }

  @Get('environments')
  async listEnvironments(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().tenants.listAllEnvironments(user.organizationId);
  }

  @Post('environments')
  async createEnvironment(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateEnvironmentDto,
  ) {
    return this.runtime().tenants.createEnvironment(user.organizationId, body);
  }

  @Post('environments/:id/enable')
  async enableEnvironment(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tenants.enableEnvironment(user.organizationId, id);
  }

  @Post('environments/:id/disable')
  async disableEnvironment(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tenants.disableEnvironment(user.organizationId, id);
  }

  // ---- Feature Flags ----

  @Get('feature-flags')
  async listFeatureFlags(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().featureFlags.listFlags(user.organizationId);
  }

  @Post('feature-flags')
  async registerFeatureFlag(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: RegisterFeatureFlagDto,
  ) {
    return this.runtime().featureFlags.registerFlag(user.organizationId, body);
  }

  @Post('feature-flags/:id/enable')
  async enableFeatureFlag(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().featureFlags.enableFlag(user.organizationId, id);
  }

  @Post('feature-flags/:id/disable')
  async disableFeatureFlag(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().featureFlags.disableFlag(user.organizationId, id);
  }

  @Get('feature-flags/:key/enabled')
  async isFeatureFlagEnabled(@CurrentUser() user: AccessTokenPayload, @Param('key') key: string) {
    const enabled = await this.runtime().featureFlags.isEnabled(user.organizationId, key);
    return { enabled };
  }

  // ---- Identity (Users, Roles, Permissions, Groups) ----

  @Get('permissions')
  async listPermissions(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().identity.listPermissions(user.organizationId);
  }

  @Post('permissions')
  async createPermission(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreatePermissionDto,
  ) {
    return this.runtime().identity.createPermission(user.organizationId, body);
  }

  @Post('permissions/:id/archive')
  async archivePermission(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().identity.archivePermission(user.organizationId, id);
  }

  @Get('roles')
  async listRoles(@CurrentUser() user: AccessTokenPayload, @Query() query: ListRolesDto) {
    const result = await this.runtime().queries.findRoles({
      organizationId: user.organizationId,
      status: query.status as adminQueries.FindRolesQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.roles, result.total, query);
  }

  @Get('roles/:id')
  async getRole(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().identity.getRole(user.organizationId, id);
  }

  @Post('roles')
  async createRole(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateRoleDto) {
    return this.runtime().identity.createRole(user.organizationId, body);
  }

  @Post('roles/:id/permissions/:code')
  async addPermissionToRole(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('code') code: string,
  ) {
    return this.runtime().identity.addPermissionToRole(user.organizationId, id, code);
  }

  @Post('roles/:id/archive')
  async archiveRole(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().identity.archiveRole(user.organizationId, id);
  }

  @Get('groups')
  async listGroups(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().identity.listGroups(user.organizationId);
  }

  @Post('groups')
  async createGroup(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateGroupDto) {
    return this.runtime().identity.createGroup(user.organizationId, body);
  }

  @Post('groups/:id/members/:userId')
  async addGroupMember(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.runtime().identity.addMember(user.organizationId, id, userId);
  }

  @Get('users')
  async listAdminUsers(@CurrentUser() user: AccessTokenPayload, @Query() query: ListAdminUsersDto) {
    const result = await this.runtime().queries.findUsers({
      organizationId: user.organizationId,
      status: query.status as adminQueries.FindUsersQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.users, result.total, query);
  }

  @Get('users/:id')
  async getAdminUser(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().identity.getUser(user.organizationId, id);
  }

  @Post('users')
  async createAdminUser(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateAdminUserDto) {
    return this.runtime().identity.createUser(user.organizationId, body);
  }

  @Post('users/:id/roles/:roleId')
  async assignRoleToUser(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    return this.runtime().identity.assignRole(user.organizationId, id, roleId);
  }

  @Post('users/:id/suspend')
  async suspendAdminUser(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().identity.suspendUser(user.organizationId, id);
  }

  @Post('users/:id/reactivate')
  async reactivateAdminUser(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().identity.reactivateUser(user.organizationId, id);
  }

  // ---- Settings & Configuration ----

  @Get('settings')
  async listSettings(@CurrentUser() user: AccessTokenPayload, @Query() query: ListSettingsDto) {
    const result = await this.runtime().queries.findSettings({
      organizationId: user.organizationId,
      scope: query.scope as adminQueries.FindSettingsQuery['scope'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.settings, result.total, query);
  }

  @Post('settings/organization')
  async upsertOrganizationSetting(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: UpsertSettingDto,
  ) {
    return this.runtime().settings.upsertOrganizationSetting(
      user.organizationId,
      body.key,
      body.value,
    );
  }

  @Get('settings/effective/:key')
  async getEffectiveSetting(@CurrentUser() user: AccessTokenPayload, @Param('key') key: string) {
    return this.runtime().settings.getEffectiveSetting(user.organizationId, key);
  }

  @Get('configurations')
  async listConfigurations(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().configuration.listConfigs(user.organizationId);
  }

  @Post('configurations')
  async setRuntimeConfig(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: SetRuntimeConfigDto,
  ) {
    return this.runtime().configuration.setRuntimeConfig(user.organizationId, body);
  }

  // ---- Audit ----

  @Get('audit')
  async listAudits(@CurrentUser() user: AccessTokenPayload, @Query() query: ListAuditsDto) {
    const result = await this.runtime().queries.findAudits({
      organizationId: user.organizationId,
      action: query.action,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.audits, result.total, query);
  }

  @Post('audit')
  async recordAudit(@CurrentUser() user: AccessTokenPayload, @Body() body: RecordAuditDto) {
    return this.runtime().audit.recordAudit(user.organizationId, body);
  }

  // ---- Monitoring & Dashboard ----

  @Get('monitoring')
  async getMonitoringSnapshot(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().monitoring.getSystemMonitoringSnapshot(user.organizationId);
  }

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AccessTokenPayload) {
    const result = await this.runtime().queries.findDashboard({
      organizationId: user.organizationId,
    });
    return result.dashboard;
  }

  @Post('dashboard/generate')
  async generateDashboard(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().dashboard.generateDashboard(user.organizationId);
  }

  // ---- Search ----

  @Get('search')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchAdministration({
      organizationId: user.organizationId,
      keyword,
      limit,
    });
  }
}
