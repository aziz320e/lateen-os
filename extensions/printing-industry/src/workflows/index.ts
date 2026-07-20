import type { WorkflowTemplate } from '../types.js';

function workflow(id: string, name: string, steps: string[]): WorkflowTemplate {
  return {
    id,
    name,
    description: `${name} workflow template for printing operations`,
    steps: steps.map((step, order) => ({ id: step, name: step.replace(/-/g, ' '), order })),
  };
}

export const PRINTING_WORKFLOWS: WorkflowTemplate[] = [
  workflow('printing-quotation', 'Quotation', ['intake', 'estimate', 'review', 'send']),
  workflow('printing-design-approval', 'Design Approval', ['upload', 'review', 'revise', 'approve']),
  workflow('printing-production', 'Production', ['schedule', 'preflight', 'print', 'finish']),
  workflow('printing-quality-inspection', 'Quality Inspection', ['inspect', 'document', 'approve-or-reject']),
  workflow('printing-packing', 'Packing', ['pick', 'pack', 'label']),
  workflow('printing-delivery', 'Delivery', ['dispatch', 'track', 'confirm']),
  workflow('printing-installation', 'Installation', ['schedule', 'install', 'sign-off']),
  workflow('printing-warranty', 'Warranty', ['register', 'monitor', 'resolve']),
];
