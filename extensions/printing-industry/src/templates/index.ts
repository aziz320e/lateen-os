import type { DepartmentTemplate, DocumentTemplate, KpiTemplate, PolicyTemplate } from '../types.js';

export const PRINTING_ORGANIZATION = {
  id: 'printing-org-template',
  name: 'Printing Business Organization',
  description: 'Business DNA organization template for printing industry',
  industry: 'printing',
};

export const PRINTING_DEPARTMENTS: DepartmentTemplate[] = [
  { id: 'production', name: 'Production', description: 'Print and fabrication operations' },
  { id: 'design', name: 'Design', description: 'Artwork, prepress, and proofing' },
  { id: 'sales', name: 'Sales', description: 'Quotations, accounts, and pipeline' },
  { id: 'installation', name: 'Installation', description: 'On-site installation and sign-off' },
  { id: 'warehouse', name: 'Warehouse', description: 'Materials inventory and fulfillment' },
  { id: 'quality', name: 'Quality', description: 'Inspection and compliance' },
  { id: 'finance', name: 'Finance', description: 'Invoicing, costing, and margins' },
];

export const PRINTING_KPIS: KpiTemplate[] = [
  { id: 'machine-utilization', name: 'Machine Utilization', unit: 'percent', target: 85 },
  { id: 'production-time', name: 'Production Time', unit: 'hours' },
  { id: 'material-waste', name: 'Material Waste', unit: 'percent', target: 5 },
  { id: 'gross-margin', name: 'Gross Margin', unit: 'percent', target: 40 },
  { id: 'delivery-time', name: 'Delivery Time', unit: 'days' },
  { id: 'quality-score', name: 'Quality Score', unit: 'score', target: 95 },
  { id: 'customer-satisfaction', name: 'Customer Satisfaction', unit: 'score', target: 90 },
  { id: 'downtime', name: 'Downtime', unit: 'hours' },
];

export const PRINTING_POLICIES: PolicyTemplate[] = [
  { id: 'quality-standard', name: 'Quality Standard', description: 'Minimum quality thresholds for all jobs' },
  { id: 'waste-limit', name: 'Waste Limit', description: 'Maximum acceptable material waste percentage' },
  { id: 'installation-safety', name: 'Installation Safety', description: 'On-site installation safety requirements' },
  { id: 'pricing-guardrails', name: 'Pricing Guardrails', description: 'Minimum margin and discount policies' },
];

function doc(id: string, name: string, type: DocumentTemplate['type'], sections: string[]): DocumentTemplate {
  return { id, name, type, sections };
}

export const PRINTING_QUOTATIONS: DocumentTemplate[] = [
  doc('standard-quotation', 'Standard Quotation', 'quotation', ['header', 'line-items', 'materials', 'labor', 'totals', 'terms']),
  doc('installation-quotation', 'Installation Quotation', 'quotation', ['header', 'products', 'installation', 'schedule', 'totals']),
];

export const PRINTING_INVOICES: DocumentTemplate[] = [
  doc('standard-invoice', 'Standard Invoice', 'invoice', ['header', 'line-items', 'tax', 'payment-terms']),
  doc('progress-invoice', 'Progress Invoice', 'invoice', ['header', 'milestones', 'amount-due', 'payment-terms']),
];

export const PRINTING_PROJECTS: DocumentTemplate[] = [
  doc('print-project', 'Print Project', 'project', ['scope', 'timeline', 'materials', 'machines', 'deliverables']),
  doc('installation-project', 'Installation Project', 'project', ['site', 'crew', 'schedule', 'sign-off']),
];
