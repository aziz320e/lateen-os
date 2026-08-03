/**
 * Finance REST API (`/api/v1/finance`). Every route reaches the real,
 * hosted `finance-engine` runtime exclusively through
 * `RuntimeRegistryService` → the runtime's own `queries` port or its
 * lifecycle services.
 */
import {
  BadRequestException,
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
import type { FinanceRuntime, queries as financeQueries } from '@lateen-os/finance-engine';
import { CurrentUser, RequirePermission } from '../../../auth/decorators.js';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../auth/guards/permissions.guard.js';
import type { AccessTokenPayload } from '../../../auth/token.service.js';
import { RuntimeRegistryService } from '../../../runtime-registry/runtime-registry.service.js';
import { DomainExceptionFilter } from '../common/domain-exception.filter.js';
import { ListQueryDto } from '../common/list-query.dto.js';
import { LoggingInterceptor } from '../common/logging.interceptor.js';
import { toPagedResult } from '../common/pagination.util.js';
import { requireRuntime } from '../common/require-runtime.util.js';
import { ResponseInterceptor } from '../common/response.interceptor.js';
import {
  CreateVendorCreditDto,
  CreateBillDto,
  CreateVendorDto,
  ListBillsDto,
  ReceiveBillDto,
  RecordAPPaymentDto,
} from './dto/accounts-payable.dto.js';
import {
  CreateARCustomerDto,
  CreateARInvoiceDto,
  CreateCreditNoteDto,
  IssueARInvoiceDto,
  ListARInvoicesDto,
  RecordARPaymentDto,
} from './dto/accounts-receivable.dto.js';
import {
  CreateFinanceAccountDto,
  ListFinanceAccountsDto,
  UpdateFinanceAccountDto,
} from './dto/account.dto.js';
import {
  ActualVsBudgetQueryDto,
  CreateBudgetDto,
  ListBudgetsDto,
  ReviseBudgetDto,
} from './dto/budget.dto.js';
import {
  CreateJournalEntryDto,
  ListJournalEntriesDto,
  ReverseJournalEntryDto,
} from './dto/journal-entry.dto.js';
import {
  CalculateTaxDto,
  CreateTaxRuleDto,
  ListTaxRulesDto,
  UpdateTaxRuleDto,
} from './dto/tax.dto.js';

const REPORT_GENERATORS = [
  'balance_sheet',
  'income_statement',
  'trial_balance',
  'cash_flow',
  'ar_aging',
  'ap_aging',
  'general_ledger',
] as const;

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/finance')
export class FinanceController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): FinanceRuntime {
    return requireRuntime<FinanceRuntime>(this.registry, 'finance-engine');
  }

  // ---- Chart of Accounts ----

  @Get('accounts')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async listAccounts(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListFinanceAccountsDto,
  ) {
    const result = await this.runtime().queries.findAccounts({
      organizationId: user.organizationId,
      accountType: query.accountType as financeQueries.FindAccountsQuery['accountType'],
      status: query.status as financeQueries.FindAccountsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.accounts, result.total, query);
  }

  @Get('accounts/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getAccount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().chartOfAccounts.get(user.organizationId, id);
  }

  @Post('accounts')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createAccount(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateFinanceAccountDto,
  ) {
    return this.runtime().chartOfAccounts.create(user.organizationId, body);
  }

  @Patch('accounts/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async updateAccount(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateFinanceAccountDto,
  ) {
    return this.runtime().chartOfAccounts.update(user.organizationId, id, body);
  }

  @Post('accounts/:id/activate')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async activateAccount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().chartOfAccounts.activate(user.organizationId, id);
  }

  @Post('accounts/:id/deactivate')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async deactivateAccount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().chartOfAccounts.deactivate(user.organizationId, id);
  }

  @Post('accounts/:id/archive')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async archiveAccount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().chartOfAccounts.archive(user.organizationId, id);
  }

  @Post('accounts/:id/restore')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async restoreAccount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().chartOfAccounts.restore(user.organizationId, id);
  }

  // ---- General Ledger ----

  @Get('journal-entries')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async listJournalEntries(
    @CurrentUser() user: AccessTokenPayload,
    @Query() query: ListJournalEntriesDto,
  ) {
    const result = await this.runtime().queries.findJournalEntries({
      organizationId: user.organizationId,
      accountId: query.accountId,
      status: query.status as financeQueries.FindJournalEntriesQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.entries, result.total, query);
  }

  @Get('journal-entries/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getJournalEntry(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().generalLedger.getJournalEntry(user.organizationId, id);
  }

  @Post('journal-entries')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createJournalEntry(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateJournalEntryDto,
  ) {
    return this.runtime().generalLedger.createJournalEntry(user.organizationId, body);
  }

  @Post('journal-entries/:id/post')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async postJournalEntry(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().generalLedger.postJournalEntry(user.organizationId, id);
  }

  @Post('journal-entries/:id/reverse')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async reverseJournalEntry(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: ReverseJournalEntryDto,
  ) {
    return this.runtime().generalLedger.reverseJournalEntry(
      user.organizationId,
      id,
      body.entryDate,
    );
  }

  // ---- Accounts Receivable ----

  @Post('ar/customers')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createARCustomer(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateARCustomerDto,
  ) {
    return this.runtime().accountsReceivable.createCustomer(user.organizationId, body);
  }

  @Get('ar/customers')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async listARCustomers(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().accountsReceivable.listCustomers(user.organizationId);
  }

  @Get('ar/customers/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getARCustomer(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accountsReceivable.getCustomer(user.organizationId, id);
  }

  @Get('ar/customers/:id/balance')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getARCustomerBalance(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    const balance = await this.runtime().accountsReceivable.getCustomerBalance(
      user.organizationId,
      id,
    );
    return { balance };
  }

  @Get('ar/invoices')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async listARInvoices(@CurrentUser() user: AccessTokenPayload, @Query() query: ListARInvoicesDto) {
    const result = await this.runtime().queries.findInvoices({
      organizationId: user.organizationId,
      customerId: query.customerId,
      status: query.status as financeQueries.FindInvoicesQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.invoices, result.total, query);
  }

  @Get('ar/invoices/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getARInvoice(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accountsReceivable.getInvoice(user.organizationId, id);
  }

  @Post('ar/invoices')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createARInvoice(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateARInvoiceDto) {
    return this.runtime().accountsReceivable.createInvoice(user.organizationId, body);
  }

  @Post('ar/invoices/:id/issue')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async issueARInvoice(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: IssueARInvoiceDto,
  ) {
    return this.runtime().accountsReceivable.issueInvoice(user.organizationId, id, body.issueDate);
  }

  @Post('ar/invoices/:id/payments')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async recordARPayment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: RecordARPaymentDto,
  ) {
    return this.runtime().accountsReceivable.recordPayment(user.organizationId, id, body);
  }

  @Post('ar/invoices/:id/cancel')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async cancelARInvoice(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accountsReceivable.cancelInvoice(user.organizationId, id);
  }

  @Post('ar/credit-notes')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createCreditNote(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateCreditNoteDto,
  ) {
    return this.runtime().accountsReceivable.createCreditNote(user.organizationId, body);
  }

  @Post('ar/credit-notes/:id/issue')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async issueCreditNote(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accountsReceivable.issueCreditNote(user.organizationId, id);
  }

  @Post('ar/credit-notes/:id/apply/:invoiceId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async applyCreditNote(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.runtime().accountsReceivable.applyCreditNoteToInvoice(
      user.organizationId,
      id,
      invoiceId,
    );
  }

  @Get('ar/aging')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getARAging(@CurrentUser() user: AccessTokenPayload, @Query('asOf') asOf: string) {
    return this.runtime().accountsReceivable.computeAging(user.organizationId, asOf);
  }

  // ---- Accounts Payable ----

  @Post('ap/vendors')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createVendor(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateVendorDto) {
    return this.runtime().accountsPayable.createVendor(user.organizationId, body);
  }

  @Get('ap/vendors')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async listVendors(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().accountsPayable.listVendors(user.organizationId);
  }

  @Get('ap/vendors/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getVendor(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accountsPayable.getVendor(user.organizationId, id);
  }

  @Get('ap/vendors/:id/balance')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getVendorBalance(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    const balance = await this.runtime().accountsPayable.getVendorBalance(user.organizationId, id);
    return { balance };
  }

  @Get('ap/bills')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async listBills(@CurrentUser() user: AccessTokenPayload, @Query() query: ListBillsDto) {
    const result = await this.runtime().queries.findBills({
      organizationId: user.organizationId,
      vendorId: query.vendorId,
      status: query.status as financeQueries.FindBillsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.bills, result.total, query);
  }

  @Get('ap/bills/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getBill(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accountsPayable.getBill(user.organizationId, id);
  }

  @Post('ap/bills')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createBill(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateBillDto) {
    return this.runtime().accountsPayable.createBill(user.organizationId, body);
  }

  @Post('ap/bills/:id/receive')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async receiveBill(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: ReceiveBillDto,
  ) {
    return this.runtime().accountsPayable.receiveBill(user.organizationId, id, body.billDate);
  }

  @Post('ap/bills/:id/payments')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async recordAPPayment(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: RecordAPPaymentDto,
  ) {
    return this.runtime().accountsPayable.recordPayment(user.organizationId, id, body);
  }

  @Post('ap/bills/:id/cancel')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async cancelBill(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accountsPayable.cancelBill(user.organizationId, id);
  }

  @Post('ap/vendor-credits')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createVendorCredit(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateVendorCreditDto,
  ) {
    return this.runtime().accountsPayable.createVendorCredit(user.organizationId, body);
  }

  @Post('ap/vendor-credits/:id/issue')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async issueVendorCredit(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().accountsPayable.issueVendorCredit(user.organizationId, id);
  }

  @Post('ap/vendor-credits/:id/apply/:billId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async applyVendorCredit(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Param('billId') billId: string,
  ) {
    return this.runtime().accountsPayable.applyVendorCreditToBill(user.organizationId, id, billId);
  }

  @Get('ap/aging')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getAPAging(@CurrentUser() user: AccessTokenPayload, @Query('asOf') asOf: string) {
    return this.runtime().accountsPayable.computeAging(user.organizationId, asOf);
  }

  // ---- Budgets ----

  @Get('budgets')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async listBudgets(@CurrentUser() user: AccessTokenPayload, @Query() query: ListBudgetsDto) {
    const result = await this.runtime().queries.findBudgets({
      organizationId: user.organizationId,
      scope: query.scope as financeQueries.FindBudgetsQuery['scope'],
      fiscalYearId: query.fiscalYearId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.budgets, result.total, query);
  }

  @Get('budgets/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getBudget(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().budgets.getBudget(user.organizationId, id);
  }

  @Post('budgets')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createBudget(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateBudgetDto) {
    return this.runtime().budgets.createBudget(user.organizationId, body);
  }

  @Patch('budgets/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async reviseBudget(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: ReviseBudgetDto,
  ) {
    return this.runtime().budgets.reviseBudget(user.organizationId, id, body.lines, body.reason);
  }

  @Post('budgets/:id/approve')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async approveBudget(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().budgets.approveBudget(user.organizationId, id);
  }

  @Post('budgets/:id/close')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async closeBudget(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().budgets.closeBudget(user.organizationId, id);
  }

  @Get('budgets/:id/revisions')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getBudgetRevisions(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().budgets.getRevisionHistory(user.organizationId, id);
  }

  @Get('budgets/:id/variance')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getBudgetVariance(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Query() query: ActualVsBudgetQueryDto,
  ) {
    return this.runtime().budgets.computeActualVsBudget(
      user.organizationId,
      id,
      query.periodStart,
      query.periodEnd,
    );
  }

  // ---- Tax ----

  @Get('tax/rules')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async listTaxRules(@CurrentUser() user: AccessTokenPayload, @Query() query: ListTaxRulesDto) {
    const result = await this.runtime().queries.findTaxes({
      organizationId: user.organizationId,
      taxType: query.taxType as financeQueries.FindTaxesQuery['taxType'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.rules, result.total, query);
  }

  @Get('tax/rules/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getTaxRule(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tax.getTaxRule(user.organizationId, id);
  }

  @Post('tax/rules')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async createTaxRule(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateTaxRuleDto) {
    return this.runtime().tax.createTaxRule(user.organizationId, body);
  }

  @Patch('tax/rules/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async updateTaxRule(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateTaxRuleDto,
  ) {
    return this.runtime().tax.updateTaxRule(user.organizationId, id, body);
  }

  @Post('tax/rules/:id/activate')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async activateTaxRule(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tax.activateTaxRule(user.organizationId, id);
  }

  @Post('tax/rules/:id/deactivate')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async deactivateTaxRule(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().tax.deactivateTaxRule(user.organizationId, id);
  }

  @Post('tax/rules/:id/calculate')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async calculateTax(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: CalculateTaxDto,
  ) {
    return this.runtime().tax.calculateAndRecord(user.organizationId, id, body.taxableAmount);
  }

  // ---- Reports ----

  @Get('reports')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async listReports(@CurrentUser() user: AccessTokenPayload, @Query() query: ListQueryDto) {
    const result = await this.runtime().queries.findReports({
      organizationId: user.organizationId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.reports, result.total, query);
  }

  @Get('reports/:id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getReport(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().reports.getReport(user.organizationId, id);
  }

  @Post('reports/:type/generate')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:write')
  async generateReport(
    @CurrentUser() user: AccessTokenPayload,
    @Param('type') type: (typeof REPORT_GENERATORS)[number],
    @Query('asOf') asOf?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    const reports = this.runtime().reports;
    switch (type) {
      case 'balance_sheet':
        if (!asOf) throw new BadRequestException('asOf is required.');
        return reports.generateBalanceSheet(user.organizationId, asOf);
      case 'income_statement':
        if (!periodStart || !periodEnd)
          throw new BadRequestException('periodStart and periodEnd are required.');
        return reports.generateIncomeStatement(user.organizationId, periodStart, periodEnd);
      case 'trial_balance':
        if (!asOf) throw new BadRequestException('asOf is required.');
        return reports.generateTrialBalance(user.organizationId, asOf);
      case 'cash_flow':
        if (!periodStart || !periodEnd)
          throw new BadRequestException('periodStart and periodEnd are required.');
        return reports.generateCashFlow(user.organizationId, periodStart, periodEnd);
      case 'ar_aging':
        if (!asOf) throw new BadRequestException('asOf is required.');
        return reports.generateARAgingReport(user.organizationId, asOf);
      case 'ap_aging':
        if (!asOf) throw new BadRequestException('asOf is required.');
        return reports.generateAPAgingReport(user.organizationId, asOf);
      case 'general_ledger':
        return reports.generateGeneralLedgerReport(user.organizationId, { periodStart, periodEnd });
      default:
        throw new BadRequestException(`Unknown report type: ${type}`);
    }
  }

  // ---- Balances & Search ----

  @Get('balances')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async getBalances(
    @CurrentUser() user: AccessTokenPayload,
    @Query('accountId') accountId?: string,
  ) {
    const result = await this.runtime().queries.findBalances({
      organizationId: user.organizationId,
      accountId,
    });
    return { data: result.balances };
  }

  @Get('search')
  @UseGuards(PermissionsGuard)
  @RequirePermission('finance:read')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchFinance({
      organizationId: user.organizationId,
      keyword,
      limit,
    });
  }
}
