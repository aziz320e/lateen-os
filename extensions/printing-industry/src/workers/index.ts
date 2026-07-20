import type { WorkerTemplate } from '../types.js';

function worker(id: string, name: string, skills: string[]): WorkerTemplate {
  return {
    id,
    name,
    description: `${name} AI worker template for printing operations`,
    skills,
  };
}

export const PRINTING_WORKERS: WorkerTemplate[] = [
  worker('printing-planner', 'Printing Planner', ['job-planning', 'material-estimation', 'scheduling']),
  worker('production-planner', 'Production Planner', ['capacity-planning', 'routing', 'bottleneck-analysis']),
  worker('machine-scheduler', 'Machine Scheduler', ['machine-allocation', 'maintenance-windows', 'utilization']),
  worker('quality-inspector', 'Quality Inspector', ['inspection', 'defect-detection', 'compliance']),
  worker('installation-coordinator', 'Installation Coordinator', ['site-scheduling', 'crew-assignment', 'sign-off']),
  worker('cost-optimizer', 'Cost Optimizer', ['margin-analysis', 'waste-reduction', 'pricing']),
];
