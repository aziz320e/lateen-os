/**
 * CRM REST API (`/api/v1/crm`). Every route below reaches the real,
 * hosted `crm-engine` runtime exclusively through
 * `RuntimeRegistryService` → the runtime's own `queries` port or its
 * lifecycle services — never a repository, never a re-created runtime.
 */
import {
  Body,
  Controller,
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
import type { CrmRuntime, queries as crmQueries } from '@lateen-os/crm-engine';
import { CurrentUser, RequirePermission } from '../../../auth/decorators.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard.js';
import type { AccessTokenPayload } from '../../../auth/token.service.js';
import { RuntimeRegistryService } from '../../../runtime-registry/runtime-registry.service.js';
import { DomainExceptionFilter } from '../common/domain-exception.filter.js';
import { LoggingInterceptor } from '../common/logging.interceptor.js';
import { toPagedResult } from '../common/pagination.util.js';
import { requireRuntime } from '../common/require-runtime.util.js';
import { ResponseInterceptor } from '../common/response.interceptor.js';
import { ListAccountsDto, CreateAccountDto, UpdateAccountDto } from './dto/account.dto.js';
import { ListActivitiesDto, LogActivityDto } from './dto/activity.dto.js';
import { ListContactsDto, CreateContactDto, UpdateContactDto } from './dto/contact.dto.js';
import { ListCustomersDto, CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';
import { ConvertLeadDto, CreateLeadDto, ListLeadsDto, RejectLeadDto } from './dto/lead.dto.js';
import {
  AdvanceStageDto,
  CreateOpportunityDto,
  ListOpportunitiesDto,
  LoseOpportunityDto,
  UpdateOpportunityDto,
  WinOpportunityDto,
} from './dto/opportunity.dto.js';

@ApiTags('CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/crm')
export class CrmController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): CrmRuntime {
    return requireRuntime<CrmRuntime>(this.registry, 'crm-engine');
  }

  // ---- Customers ----

  @Get('customers')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async listCustomers(@CurrentUser() user: AccessTokenPayload, @Query() query: ListCustomersDto) {
    const result = await this.runtime().queries.findCustomers({
      organizationId: user.organizationId,
      status: query.status as crmQueries.FindCustomersQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.customers, result.total, query);
  }

  @Get('customers/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async getCustomer(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.get(user.organizationId, id);
  }

  @Post('customers')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async createCustomer(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateCustomerDto) {
    return this.runtime().customers.create(user.organizationId, body);
  }

  @Patch('customers/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async updateCustomer(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateCustomerDto,
  ) {
    return this.runtime().customers.update(user.organizationId, id, body);
  }

  @Post('customers/:id/archive')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async archiveCustomer(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.archive(user.organizationId, id);
  }

  @Post('customers/:id/restore')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async restoreCustomer(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().customers.restore(user.organizationId, id);
  }

  // ---- Leads ----

  @Get('leads')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async listLeads(@CurrentUser() user: AccessTokenPayload, @Query() query: ListLeadsDto) {
    const result = await this.runtime().queries.findLeads({
      organizationId: user.organizationId,
      status: query.status as crmQueries.FindLeadsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.leads, result.total, query);
  }

  @Get('leads/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async getLead(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().leads.get(user.organizationId, id);
  }

  @Post('leads')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async createLead(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateLeadDto) {
    return this.runtime().leads.create(user.organizationId, body);
  }

  @Post('leads/:id/qualify')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async qualifyLead(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().leads.qualify(user.organizationId, id);
  }

  @Post('leads/:id/convert')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async convertLead(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: ConvertLeadDto,
  ) {
    return this.runtime().leads.convert(user.organizationId, id, body);
  }

  @Post('leads/:id/reject')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async rejectLead(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: RejectLeadDto,
  ) {
    return this.runtime().leads.reject(user.organizationId, id, body.reason);
  }

  @Post('leads/:id/reopen')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async reopenLead(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().leads.reopen(user.organizationId, id);
  }

  // ---- Contacts ----

  @Get('contacts')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async listContacts(@CurrentUser() user: AccessTokenPayload, @Query() query: ListContactsDto) {
    const result = await this.runtime().queries.findContacts({
      organizationId: user.organizationId,
      status: query.status as crmQueries.FindContactsQuery['status'],
      customerId: query.customerId,
      accountId: query.accountId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.contacts, result.total, query);
  }

  @Get('contacts/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async getContact(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().contacts.get(user.organizationId, id);
  }

  @Post('contacts')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async createContact(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateContactDto) {
    return this.runtime().contacts.create(user.organizationId, body);
  }

  @Patch('contacts/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async updateContact(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateContactDto,
  ) {
    return this.runtime().contacts.update(user.organizationId, id, body);
  }

  @Post('contacts/:id/archive')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async archiveContact(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().contacts.archive(user.organizationId, id);
  }

  @Post('contacts/:id/restore')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async restoreContact(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().contacts.restore(user.organizationId, id);
  }

  // ---- Accounts ----

  @Get('accounts')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async listAccounts(@CurrentUser() user: AccessTokenPayload, @Query() query: ListAccountsDto) {
    const result = await this.runtime().queries.findAccounts({
      organizationId: user.organizationId,
      status: query.status as crmQueries.FindAccountsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.accounts, result.total, query);
  }

  @Get('accounts/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async getAccount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accounts.get(user.organizationId, id);
  }

  @Post('accounts')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async createAccount(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateAccountDto) {
    return this.runtime().accounts.create(user.organizationId, body);
  }

  @Patch('accounts/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async updateAccount(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateAccountDto,
  ) {
    return this.runtime().accounts.update(user.organizationId, id, body);
  }

  @Post('accounts/:id/archive')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async archiveAccount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accounts.archive(user.organizationId, id);
  }

  @Post('accounts/:id/restore')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async restoreAccount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accounts.restore(user.organizationId, id);
  }

  // ---- Opportunities ----

  @Get('opportunities')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async listOpportunities(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListOpportunitiesDto,
  ) {
    const result = await this.runtime().queries.findOpportunities({
      organizationId: user.organizationId,
      stage: query.stage as crmQueries.FindOpportunitiesQuery['stage'],
      accountId: query.accountId,
      customerId: query.customerId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.opportunities, result.total, query);
  }

  @Get('deals')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async listDeals(@CurrentUser() user: AccessTokenPayload) {
    const result = await this.runtime().queries.findDeals({ organizationId: user.organizationId });
    return { data: result.groupedByStage, meta: { total: result.total } };
  }

  @Get('opportunities/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async getOpportunity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().opportunities.get(user.organizationId, id);
  }

  @Post('opportunities')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async createOpportunity(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateOpportunityDto,
  ) {
    return this.runtime().opportunities.create(user.organizationId, body);
  }

  @Patch('opportunities/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async updateOpportunity(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateOpportunityDto,
  ) {
    return this.runtime().opportunities.update(user.organizationId, id, body);
  }

  @Post('opportunities/:id/advance-stage')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async advanceOpportunityStage(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: AdvanceStageDto,
  ) {
    return this.runtime().opportunities.advanceStage(user.organizationId, id, body.toStage);
  }

  @Post('opportunities/:id/win')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async winOpportunity(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: WinOpportunityDto,
  ) {
    return this.runtime().opportunities.win(user.organizationId, id, body.amount);
  }

  @Post('opportunities/:id/lose')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async loseOpportunity(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: LoseOpportunityDto,
  ) {
    return this.runtime().opportunities.lose(user.organizationId, id, body.reason);
  }

  // ---- Activities ----

  @Get('activities')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async listActivities(@CurrentUser() user: AccessTokenPayload, @Query() query: ListActivitiesDto) {
    const result = await this.runtime().queries.findActivities({
      organizationId: user.organizationId,
      activityType: query.activityType as crmQueries.FindActivitiesQuery['activityType'],
      relatedEntityType:
        query.relatedEntityType as crmQueries.FindActivitiesQuery['relatedEntityType'],
      relatedEntityId: query.relatedEntityId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.activities, result.total, query);
  }

  @Get('activities/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async getActivity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().activities.get(user.organizationId, id);
  }

  @Post('activities')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async logActivity(@CurrentUser() user: AccessTokenPayload, @Body() body: LogActivityDto) {
    return this.runtime().activities.log(user.organizationId, body);
  }

  @Post('activities/:id/complete')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:write')
  async completeActivity(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().activities.complete(user.organizationId, id);
  }

  // ---- Search ----

  @Get('search')
  @UseGuards(PermissionsGuard)
  @RequirePermission('crm:read')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchCRM({
      organizationId: user.organizationId,
      keyword,
      limit,
    });
  }
}
