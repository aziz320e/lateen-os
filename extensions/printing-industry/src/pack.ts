import type { PrintingIndustryPack } from './types.js';
import {
  PRINTING_PRODUCTS,
  PRINTING_MACHINES,
  PRINTING_MATERIALS,
  PRINTING_CAPABILITIES,
} from './catalog/index.js';
import { PRINTING_WORKFLOWS } from './workflows/index.js';
import { PRINTING_MISSIONS } from './missions/index.js';
import { PRINTING_WORKERS } from './workers/index.js';
import { PRINTING_DASHBOARDS } from './dashboards/index.js';
import { PRINTING_REPORTS } from './reports/index.js';
import {
  PRINTING_DEPARTMENTS,
  PRINTING_KPIS,
  PRINTING_POLICIES,
  PRINTING_QUOTATIONS,
  PRINTING_INVOICES,
  PRINTING_PROJECTS,
} from './templates/index.js';

/** Official Printing Industry Pack — catalog and templates only. */
export const printingIndustryPack: PrintingIndustryPack = {
  id: 'printing-industry',
  industry: 'printing',
  version: '1.0.0',
  products: PRINTING_PRODUCTS,
  machines: PRINTING_MACHINES,
  materials: PRINTING_MATERIALS,
  capabilities: PRINTING_CAPABILITIES,
  departments: PRINTING_DEPARTMENTS,
  workflows: PRINTING_WORKFLOWS,
  missions: PRINTING_MISSIONS,
  workers: PRINTING_WORKERS,
  dashboards: PRINTING_DASHBOARDS,
  reports: PRINTING_REPORTS,
  kpis: PRINTING_KPIS,
  policies: PRINTING_POLICIES,
  quotations: PRINTING_QUOTATIONS,
  invoices: PRINTING_INVOICES,
  projects: PRINTING_PROJECTS,
};

export default printingIndustryPack;
