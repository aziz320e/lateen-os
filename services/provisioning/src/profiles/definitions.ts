import type { ProvisioningProfile } from '../domain/types.js';

export interface ProfileDefinition {
  readonly id: ProvisioningProfile;
  readonly displayName: string;
  readonly description: string;
  readonly defaultExtensions: readonly string[];
  readonly industryPack?: string;
  readonly departments: readonly string[];
  readonly aiWorkers: readonly string[];
  readonly workflows: readonly string[];
  readonly dashboards: readonly string[];
  readonly kpis: readonly string[];
}

export const PROVISIONING_PROFILES: ProfileDefinition[] = [
  {
    id: 'small-business',
    displayName: 'Small Business',
    description: 'Essential setup for small teams',
    defaultExtensions: [],
    departments: ['sales', 'finance'],
    aiWorkers: ['assistant'],
    workflows: ['quotation'],
    dashboards: ['sales-dashboard'],
    kpis: ['revenue'],
  },
  {
    id: 'enterprise',
    displayName: 'Enterprise',
    description: 'Full enterprise platform setup',
    defaultExtensions: ['stripe-connector', 'slack-connector'],
    departments: ['production', 'design', 'sales', 'finance', 'quality', 'warehouse'],
    aiWorkers: ['printing-planner', 'production-planner', 'cost-optimizer'],
    workflows: ['printing-quotation', 'printing-production', 'printing-delivery'],
    dashboards: ['printing-ceo-dashboard', 'printing-finance-dashboard'],
    kpis: ['machine-utilization', 'gross-margin', 'customer-satisfaction'],
  },
  {
    id: 'manufacturing',
    displayName: 'Manufacturing',
    description: 'Manufacturing operations setup',
    defaultExtensions: ['odoo-connector'],
    departments: ['production', 'warehouse', 'quality', 'finance'],
    aiWorkers: ['production-planner', 'machine-scheduler', 'quality-inspector'],
    workflows: ['printing-production', 'printing-quality-inspection'],
    dashboards: ['printing-production-dashboard', 'printing-machines-dashboard'],
    kpis: ['machine-utilization', 'production-time', 'material-waste'],
  },
  {
    id: 'printing',
    displayName: 'Printing',
    description: 'Printing and signage business setup',
    defaultExtensions: ['stripe-connector'],
    industryPack: 'printing-industry',
    departments: ['production', 'design', 'sales', 'installation', 'warehouse', 'quality', 'finance'],
    aiWorkers: ['printing-planner', 'production-planner', 'machine-scheduler', 'quality-inspector', 'installation-coordinator', 'cost-optimizer'],
    workflows: ['printing-quotation', 'printing-design-approval', 'printing-production', 'printing-quality-inspection', 'printing-packing', 'printing-delivery', 'printing-installation', 'printing-warranty'],
    dashboards: ['printing-production-dashboard', 'printing-sales-dashboard', 'printing-machines-dashboard', 'printing-warehouse-dashboard', 'printing-finance-dashboard', 'printing-ceo-dashboard'],
    kpis: ['machine-utilization', 'production-time', 'material-waste', 'gross-margin', 'delivery-time', 'quality-score', 'customer-satisfaction', 'downtime'],
  },
  {
    id: 'retail',
    displayName: 'Retail',
    description: 'Retail and e-commerce setup',
    defaultExtensions: ['shopify-connector', 'stripe-connector'],
    departments: ['sales', 'warehouse', 'finance'],
    aiWorkers: ['assistant', 'cost-optimizer'],
    workflows: ['printing-quotation', 'printing-delivery'],
    dashboards: ['printing-sales-dashboard', 'printing-warehouse-dashboard'],
    kpis: ['revenue', 'customer-satisfaction', 'delivery-time'],
  },
  {
    id: 'healthcare',
    displayName: 'Healthcare',
    description: 'Healthcare organization setup',
    defaultExtensions: [],
    departments: ['operations', 'finance', 'quality'],
    aiWorkers: ['assistant', 'quality-inspector'],
    workflows: ['printing-quality-inspection'],
    dashboards: ['printing-finance-dashboard'],
    kpis: ['quality-score', 'customer-satisfaction'],
  },
  {
    id: 'construction',
    displayName: 'Construction',
    description: 'Construction and installation setup',
    defaultExtensions: [],
    departments: ['production', 'installation', 'warehouse', 'finance'],
    aiWorkers: ['installation-coordinator', 'production-planner'],
    workflows: ['printing-installation', 'printing-delivery'],
    dashboards: ['printing-production-dashboard'],
    kpis: ['delivery-time', 'production-time'],
  },
];

export function getProfile(id: ProvisioningProfile): ProfileDefinition {
  const profile = PROVISIONING_PROFILES.find((p) => p.id === id);
  if (!profile) throw new Error(`Unknown profile: ${id}`);
  return profile;
}
