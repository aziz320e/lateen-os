/** Printing Industry Pack — catalog and template contracts (no business logic). */

export interface CatalogItem {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tags?: readonly string[];
}

export interface ProductCatalogItem extends CatalogItem {
  readonly category: string;
  readonly unitOfMeasure: 'sqm' | 'each' | 'linear_m' | 'set' | 'roll' | 'pack';
  readonly productionType: string;
  readonly materials: readonly string[];
  readonly capabilities: readonly string[];
}

export interface MachineCatalogItem extends CatalogItem {
  readonly machineType: string;
  readonly category: 'print' | 'cut' | 'fabrication' | 'finishing' | 'packaging' | 'installation';
  readonly supportedMaterials: readonly string[];
  readonly capabilities: readonly string[];
}

export interface MaterialCatalogItem extends CatalogItem {
  readonly materialType: string;
  readonly unitOfMeasure: 'sqm' | 'sheet' | 'roll' | 'kg' | 'each';
}

export interface CapabilityCatalogItem extends CatalogItem {
  readonly category: string;
  readonly machines: readonly string[];
}

export interface WorkflowTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly steps: readonly { id: string; name: string; order: number }[];
}

export interface MissionTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly objectives: readonly string[];
}

export interface WorkerTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly skills: readonly string[];
}

export interface DashboardTemplate {
  readonly id: string;
  readonly name: string;
  readonly widgets: readonly string[];
}

export interface ReportTemplate {
  readonly id: string;
  readonly name: string;
  readonly metrics: readonly string[];
}

export interface KpiTemplate {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly target?: number;
}

export interface PolicyTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface DepartmentTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}

export interface DocumentTemplate {
  readonly id: string;
  readonly name: string;
  readonly type: 'quotation' | 'invoice' | 'project';
  readonly sections: readonly string[];
}

export interface PrintingIndustryPack {
  readonly id: string;
  readonly industry: string;
  readonly version: string;
  readonly products: readonly ProductCatalogItem[];
  readonly machines: readonly MachineCatalogItem[];
  readonly materials: readonly MaterialCatalogItem[];
  readonly capabilities: readonly CapabilityCatalogItem[];
  readonly departments: readonly DepartmentTemplate[];
  readonly workflows: readonly WorkflowTemplate[];
  readonly missions: readonly MissionTemplate[];
  readonly workers: readonly WorkerTemplate[];
  readonly dashboards: readonly DashboardTemplate[];
  readonly reports: readonly ReportTemplate[];
  readonly kpis: readonly KpiTemplate[];
  readonly policies: readonly PolicyTemplate[];
  readonly quotations: readonly DocumentTemplate[];
  readonly invoices: readonly DocumentTemplate[];
  readonly projects: readonly DocumentTemplate[];
}
