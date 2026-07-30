import { Module } from '@nestjs/common';
import { AdministrationApiModule } from './administration/administration.module.js';
import { AnalyticsApiModule } from './analytics/analytics.module.js';
import { CrmApiModule } from './crm/crm.module.js';
import { CustomerSuccessApiModule } from './customer-success/customer-success.module.js';
import { DocumentsApiModule } from './documents/documents.module.js';
import { FinanceApiModule } from './finance/finance.module.js';
import { HrApiModule } from './hr/hr.module.js';
import { InventoryApiModule } from './inventory/inventory.module.js';
import { MarketplaceApiModule } from './marketplace/marketplace.module.js';
import { ProjectsApiModule } from './projects/projects.module.js';
import { SalesApiModule } from './sales/sales.module.js';

/** Aggregates every Task 4 versioned REST API domain module under `/api/v1`. */
@Module({
  imports: [
    CrmApiModule,
    SalesApiModule,
    FinanceApiModule,
    InventoryApiModule,
    ProjectsApiModule,
    HrApiModule,
    CustomerSuccessApiModule,
    DocumentsApiModule,
    AnalyticsApiModule,
    AdministrationApiModule,
    MarketplaceApiModule,
  ],
})
export class ApiV1Module {}
