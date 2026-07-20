import { MISSION_CODE, MISSION_TITLE, DEFAULT_ORG_ID } from './types.js';
import { LAUNCH_PRODUCT_STAGES } from './stages.js';

/** Mission definition aligned with @lateen-os/multi-agent Mission contract. */
export const LAUNCH_PRODUCT_MISSION_DEFINITION = {
  code: MISSION_CODE,
  title: MISSION_TITLE,
  description:
    'Turn a discovered business opportunity into an approved product ready for production.',
  priority: 'high' as const,
  leadWorkerRole: 'ceo_ai' as const,
  organizationId: DEFAULT_ORG_ID,
  objectives: [
    {
      title: 'Validate manufacturable opportunity',
      description: 'Confirm trend signal and discovery pipeline produce a viable product candidate.',
      measurableOutcome: 'Capability match score >= 0.75',
    },
    {
      title: 'Secure cross-functional approval',
      description: 'Marketing, finance, and operations reviews complete with consensus.',
      measurableOutcome: 'Consensus reached with agreement score >= 0.80',
    },
    {
      title: 'Obtain CEO approval for production',
      description: 'Decision Engine and CEO AI approve launch to production planning.',
      measurableOutcome: 'Decision status = approved',
    },
  ],
  context: {
    businessDnaReferences: ['products', 'machines', 'capabilities'],
    integrationServices: ['product-discovery', 'decision-engine', 'institutional-memory'],
  },
  stageCount: LAUNCH_PRODUCT_STAGES.length,
} as const;
