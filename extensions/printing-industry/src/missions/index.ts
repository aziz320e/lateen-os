import type { MissionTemplate } from '../types.js';

function mission(id: string, name: string, objectives: string[]): MissionTemplate {
  return {
    id,
    name,
    description: `${name} mission template for printing businesses`,
    objectives,
  };
}

export const PRINTING_MISSIONS: MissionTemplate[] = [
  mission('launch-printing-product', 'Launch Printing Product', ['define-product', 'configure-workflow', 'publish-catalog', 'train-team']),
  mission('optimize-production', 'Optimize Production', ['analyze-throughput', 'balance-load', 'reduce-bottlenecks']),
  mission('replace-machine', 'Replace Machine', ['assess-capacity', 'evaluate-options', 'plan-migration']),
  mission('reduce-waste', 'Reduce Waste', ['measure-waste', 'identify-causes', 'implement-controls']),
  mission('increase-margin', 'Increase Margin', ['analyze-pricing', 'optimize-materials', 'improve-yield']),
  mission('customer-follow-up', 'Customer Follow-up', ['collect-feedback', 'resolve-issues', 'upsell-services']),
];
