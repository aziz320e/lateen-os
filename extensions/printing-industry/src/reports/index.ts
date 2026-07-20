import type { ReportTemplate } from '../types.js';

function report(id: string, name: string, metrics: string[]): ReportTemplate {
  return { id, name, metrics };
}

export const PRINTING_REPORTS: ReportTemplate[] = [
  report('production-report', 'Production Report', ['jobs-completed', 'throughput', 'rework-rate', 'on-time-delivery']),
  report('machine-report', 'Machine Report', ['utilization', 'downtime', 'maintenance-events', 'output']),
  report('profit-report', 'Profit Report', ['revenue', 'cogs', 'gross-margin', 'net-margin']),
  report('material-consumption', 'Material Consumption', ['usage-by-material', 'waste', 'yield', 'cost']),
  report('downtime-report', 'Downtime Report', ['downtime-hours', 'root-causes', 'mtbf', 'mttr']),
  report('installation-report', 'Installation Report', ['installations-completed', 'sign-offs', 'rework', 'customer-rating']),
];
