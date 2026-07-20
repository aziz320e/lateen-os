export { printingIndustryPack, default } from './pack.js';
export type { PrintingIndustryPack } from './types.js';

export {
  PRINTING_PRODUCTS,
  PRINTING_MACHINES,
  PRINTING_MATERIALS,
  PRINTING_CAPABILITIES,
} from './catalog/index.js';

export { PRINTING_WORKFLOWS } from './workflows/index.js';
export { PRINTING_MISSIONS } from './missions/index.js';
export { PRINTING_WORKERS } from './workers/index.js';
export { PRINTING_DASHBOARDS } from './dashboards/index.js';
export { PRINTING_REPORTS } from './reports/index.js';

export {
  PRINTING_ORGANIZATION,
  PRINTING_DEPARTMENTS,
  PRINTING_KPIS,
  PRINTING_POLICIES,
  PRINTING_QUOTATIONS,
  PRINTING_INVOICES,
  PRINTING_PROJECTS,
} from './templates/index.js';

export type {
  ProductCatalogItem,
  MachineCatalogItem,
  MaterialCatalogItem,
  CapabilityCatalogItem,
  WorkflowTemplate,
  MissionTemplate,
  WorkerTemplate,
  DashboardTemplate,
  ReportTemplate,
  KpiTemplate,
  PolicyTemplate,
  DocumentTemplate,
} from './types.js';
