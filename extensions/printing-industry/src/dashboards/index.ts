import type { DashboardTemplate } from '../types.js';

function dashboard(id: string, name: string, widgets: string[]): DashboardTemplate {
  return { id, name, widgets };
}

export const PRINTING_DASHBOARDS: DashboardTemplate[] = [
  dashboard('printing-production-dashboard', 'Production', ['jobs-in-progress', 'throughput', 'bottlenecks', 'quality-alerts']),
  dashboard('printing-sales-dashboard', 'Sales', ['pipeline', 'quotations', 'conversion', 'top-products']),
  dashboard('printing-machines-dashboard', 'Machines', ['utilization', 'downtime', 'maintenance', 'queue']),
  dashboard('printing-warehouse-dashboard', 'Warehouse', ['inventory', 'material-usage', 'reorder-alerts']),
  dashboard('printing-finance-dashboard', 'Finance', ['revenue', 'margin', 'cost-breakdown', 'ar-aging']),
  dashboard('printing-ceo-dashboard', 'CEO', ['kpi-summary', 'profit-trend', 'capacity', 'customer-satisfaction']),
];
