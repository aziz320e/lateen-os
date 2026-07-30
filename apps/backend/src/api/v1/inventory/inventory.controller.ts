/**
 * Inventory REST API (`/api/v1/inventory`). Every route reaches the real,
 * hosted `inventory-engine` runtime exclusively through
 * `RuntimeRegistryService` → the runtime's own `queries` port or its
 * lifecycle services.
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
import type { InventoryRuntime, queries as inventoryQueries } from '@lateen-os/inventory-engine';
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
  CreateBrandDto,
  CreateCategoryDto,
  CreateInventoryItemDto,
  ListInventoryItemsDto,
  UpdateInventoryItemDto,
} from './dto/item.dto.js';
import {
  AdjustStockDto,
  ListInventoryDto,
  ListMovementsDto,
  ReceiveOrIssueDto,
  SetStockThresholdsDto,
  TransferStockDto,
} from './dto/movement.dto.js';
import {
  CreateInventoryCountDto,
  GeneratePurchaseRequestDto,
  ListCountsDto,
  ListValuationsDto,
  RecordCountDto,
  RecordIssueDto,
  RecordReceiptDto,
} from './dto/valuation.dto.js';
import {
  CreateBinDto,
  CreateStorageLocationDto,
  CreateWarehouseDto,
  CreateZoneDto,
  ListWarehousesDto,
  UpdateStorageLocationDto,
  UpdateWarehouseDto,
} from './dto/warehouse.dto.js';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(DomainExceptionFilter)
@UseInterceptors(ResponseInterceptor, LoggingInterceptor)
@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  private runtime(): InventoryRuntime {
    return requireRuntime<InventoryRuntime>(this.registry, 'inventory-engine');
  }

  // ---- Catalog: Items ----

  @Get('items')
  async listItems(@CurrentUser() user: AccessTokenPayload, @Query() query: ListInventoryItemsDto) {
    const result = await this.runtime().queries.findItems({
      organizationId: user.organizationId,
      categoryId: query.categoryId,
      brandId: query.brandId,
      status: query.status as inventoryQueries.FindItemsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.items, result.total, query);
  }

  @Get('items/:id')
  async getItem(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().catalog.get(user.organizationId, id);
  }

  @Post('items')
  async createItem(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateInventoryItemDto) {
    return this.runtime().catalog.create(user.organizationId, body);
  }

  @Patch('items/:id')
  async updateItem(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateInventoryItemDto,
  ) {
    return this.runtime().catalog.update(user.organizationId, id, body);
  }

  @Post('items/:id/activate')
  async activateItem(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().catalog.activate(user.organizationId, id);
  }

  @Post('items/:id/deactivate')
  async deactivateItem(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().catalog.deactivate(user.organizationId, id);
  }

  @Post('items/:id/archive')
  async archiveItem(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().catalog.archive(user.organizationId, id);
  }

  @Post('items/:id/restore')
  async restoreItem(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().catalog.restore(user.organizationId, id);
  }

  // ---- Catalog: Categories & Brands ----

  @Get('categories')
  async listCategories(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().catalog.listCategories(user.organizationId);
  }

  @Post('categories')
  async createCategory(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateCategoryDto) {
    return this.runtime().catalog.createCategory(user.organizationId, body);
  }

  @Post('categories/:id/archive')
  async archiveCategory(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().catalog.archiveCategory(user.organizationId, id);
  }

  @Get('brands')
  async listBrands(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().catalog.listBrands(user.organizationId);
  }

  @Post('brands')
  async createBrand(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateBrandDto) {
    return this.runtime().catalog.createBrand(user.organizationId, body);
  }

  @Post('brands/:id/archive')
  async archiveBrand(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().catalog.archiveBrand(user.organizationId, id);
  }

  // ---- Warehouses, Zones, Locations, Bins ----

  @Get('warehouses')
  async listWarehouses(@CurrentUser() user: AccessTokenPayload, @Query() query: ListWarehousesDto) {
    const result = await this.runtime().queries.findWarehouses({
      organizationId: user.organizationId,
      status: query.status as inventoryQueries.FindWarehousesQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.warehouses, result.total, query);
  }

  @Get('warehouses/:id')
  async getWarehouse(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().warehouses.getWarehouse(user.organizationId, id);
  }

  @Post('warehouses')
  async createWarehouse(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateWarehouseDto) {
    return this.runtime().warehouses.createWarehouse(user.organizationId, body);
  }

  @Patch('warehouses/:id')
  async updateWarehouse(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateWarehouseDto,
  ) {
    return this.runtime().warehouses.updateWarehouse(user.organizationId, id, body);
  }

  @Post('warehouses/:id/archive')
  async archiveWarehouse(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().warehouses.archiveWarehouse(user.organizationId, id);
  }

  @Post('warehouses/:id/restore')
  async restoreWarehouse(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().warehouses.restoreWarehouse(user.organizationId, id);
  }

  @Get('warehouses/:id/zones')
  async listZones(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().warehouses.findZonesByWarehouse(user.organizationId, id);
  }

  @Post('zones')
  async createZone(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateZoneDto) {
    return this.runtime().warehouses.createZone(user.organizationId, body);
  }

  @Post('zones/:id/archive')
  async archiveZone(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().warehouses.archiveZone(user.organizationId, id);
  }

  @Get('warehouses/:id/locations')
  async listLocations(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().warehouses.findLocationsByWarehouse(user.organizationId, id);
  }

  @Post('locations')
  async createLocation(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateStorageLocationDto,
  ) {
    return this.runtime().warehouses.createStorageLocation(user.organizationId, body);
  }

  @Patch('locations/:id')
  async updateLocation(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: UpdateStorageLocationDto,
  ) {
    return this.runtime().warehouses.updateStorageLocation(user.organizationId, id, body);
  }

  @Post('locations/:id/archive')
  async archiveLocation(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().warehouses.archiveStorageLocation(user.organizationId, id);
  }

  @Get('locations/:id/bins')
  async listBins(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().warehouses.findBinsByLocation(user.organizationId, id);
  }

  @Post('bins')
  async createBin(@CurrentUser() user: AccessTokenPayload, @Body() body: CreateBinDto) {
    return this.runtime().warehouses.createBin(user.organizationId, body);
  }

  @Post('bins/:id/archive')
  async archiveBin(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().warehouses.archiveBin(user.organizationId, id);
  }

  // ---- Stock Levels ----

  @Get('stock')
  async listStock(@CurrentUser() user: AccessTokenPayload, @Query() query: ListInventoryDto) {
    const result = await this.runtime().queries.findInventory({
      organizationId: user.organizationId,
      itemId: query.itemId,
      warehouseId: query.warehouseId,
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.stockLevels, result.total, query);
  }

  @Get('stock/below-reorder-point')
  async listBelowReorderPoint(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().stock.listBelowReorderPoint(user.organizationId);
  }

  @Get('stock/below-minimum')
  async listBelowMinimum(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().stock.listBelowMinimum(user.organizationId);
  }

  @Patch('stock/:itemId/:warehouseId/thresholds')
  async setThresholds(
    @CurrentUser() user: AccessTokenPayload,
    @Param('itemId') itemId: string,
    @Param('warehouseId') warehouseId: string,
    @Body() body: SetStockThresholdsDto,
  ) {
    return this.runtime().stock.setThresholds(user.organizationId, itemId, warehouseId, body);
  }

  // ---- Movements ----

  @Get('movements')
  async listMovements(@CurrentUser() user: AccessTokenPayload, @Query() query: ListMovementsDto) {
    const result = await this.runtime().queries.findMovements({
      organizationId: user.organizationId,
      itemId: query.itemId,
      warehouseId: query.warehouseId,
      movementType: query.movementType as inventoryQueries.FindMovementsQuery['movementType'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.movements, result.total, query);
  }

  @Get('movements/:id')
  async getMovement(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().movements.getMovement(user.organizationId, id);
  }

  @Post('movements/receive')
  async receive(@CurrentUser() user: AccessTokenPayload, @Body() body: ReceiveOrIssueDto) {
    return this.runtime().movements.receive(user.organizationId, body);
  }

  @Post('movements/issue')
  async issue(@CurrentUser() user: AccessTokenPayload, @Body() body: ReceiveOrIssueDto) {
    return this.runtime().movements.issue(user.organizationId, body);
  }

  @Post('movements/transfer')
  async transfer(@CurrentUser() user: AccessTokenPayload, @Body() body: TransferStockDto) {
    return this.runtime().movements.transfer(user.organizationId, body);
  }

  @Post('movements/adjust')
  async adjust(@CurrentUser() user: AccessTokenPayload, @Body() body: AdjustStockDto) {
    return this.runtime().movements.adjust(user.organizationId, body);
  }

  @Post('movements/return')
  async returnStock(@CurrentUser() user: AccessTokenPayload, @Body() body: ReceiveOrIssueDto) {
    return this.runtime().movements.returnStock(user.organizationId, body);
  }

  @Post('movements/reserve')
  async reserve(@CurrentUser() user: AccessTokenPayload, @Body() body: ReceiveOrIssueDto) {
    return this.runtime().movements.reserve(user.organizationId, body);
  }

  @Post('movements/release')
  async release(@CurrentUser() user: AccessTokenPayload, @Body() body: ReceiveOrIssueDto) {
    return this.runtime().movements.release(user.organizationId, body);
  }

  // ---- Valuation ----

  @Get('valuations')
  async listValuations(@CurrentUser() user: AccessTokenPayload, @Query() query: ListValuationsDto) {
    const result = await this.runtime().queries.findValuations({
      organizationId: user.organizationId,
      itemId: query.itemId,
      method: query.method as inventoryQueries.FindValuationsQuery['method'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.valuations, result.total, query);
  }

  @Post('valuations/receipts')
  async recordReceipt(@CurrentUser() user: AccessTokenPayload, @Body() body: RecordReceiptDto) {
    return this.runtime().valuation.recordReceipt(user.organizationId, body);
  }

  @Post('valuations/issues')
  async recordIssue(@CurrentUser() user: AccessTokenPayload, @Body() body: RecordIssueDto) {
    return this.runtime().valuation.recordIssue(user.organizationId, body);
  }

  @Get('valuations/weighted-average/:itemId/:warehouseId')
  async getWeightedAverageCost(
    @CurrentUser() user: AccessTokenPayload,
    @Param('itemId') itemId: string,
    @Param('warehouseId') warehouseId: string,
  ) {
    return this.runtime().valuation.getWeightedAverageCost(
      user.organizationId,
      itemId,
      warehouseId,
    );
  }

  // ---- Counting ----

  @Get('counts')
  async listCounts(@CurrentUser() user: AccessTokenPayload, @Query() query: ListCountsDto) {
    const result = await this.runtime().queries.findCounts({
      organizationId: user.organizationId,
      warehouseId: query.warehouseId,
      status: query.status as inventoryQueries.FindCountsQuery['status'],
      offset: query.offset,
      limit: query.limit,
    });
    return toPagedResult(result.counts, result.total, query);
  }

  @Get('counts/:id')
  async getCount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().counting.getCount(user.organizationId, id);
  }

  @Post('counts')
  async createCount(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: CreateInventoryCountDto,
  ) {
    return this.runtime().counting.createCount(user.organizationId, body);
  }

  @Post('counts/:id/start')
  async startCount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().counting.startCount(user.organizationId, id);
  }

  @Post('counts/:id/record')
  async recordCount(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() body: RecordCountDto,
  ) {
    return this.runtime().counting.recordCount(
      user.organizationId,
      id,
      body.itemId,
      body.countedQuantity,
    );
  }

  @Post('counts/:id/complete')
  async completeCount(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().counting.completeCount(user.organizationId, id);
  }

  // ---- Procurement ----

  @Get('procurement/reorder-suggestions')
  async getReorderSuggestions(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().procurement.computeReorderSuggestions(user.organizationId);
  }

  @Get('procurement/shortages')
  async getShortages(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().procurement.detectShortages(user.organizationId);
  }

  @Get('procurement/purchase-requests')
  async listPurchaseRequests(@CurrentUser() user: AccessTokenPayload) {
    return this.runtime().procurement.listPurchaseRequests(user.organizationId);
  }

  @Post('procurement/purchase-requests')
  async generatePurchaseRequest(
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: GeneratePurchaseRequestDto,
  ) {
    return this.runtime().procurement.generatePurchaseRequest(user.organizationId, body);
  }

  @Post('procurement/purchase-requests/:id/acknowledge')
  async acknowledgePurchaseRequest(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    return this.runtime().procurement.acknowledgePurchaseRequest(user.organizationId, id);
  }

  @Post('procurement/purchase-requests/:id/dismiss')
  async dismissPurchaseRequest(@CurrentUser() user: AccessTokenPayload, @Param('id') id: string) {
    return this.runtime().procurement.dismissPurchaseRequest(user.organizationId, id);
  }

  // ---- Search ----

  @Get('search')
  async search(
    @CurrentUser() user: AccessTokenPayload,
    @Query('keyword') keyword: string,
    @Query('limit') limit?: number,
  ) {
    return this.runtime().queries.searchInventory({
      organizationId: user.organizationId,
      keyword,
      limit,
    });
  }
}
