import { LAUNCH_PRODUCT_STAGES } from './stages.js';
import { MISSION_CODE, DEFAULT_ORG_ID } from './types.js';

/** Execution plan — coordination steps aligned with @lateen-os/multi-agent CoordinationPlan. */
export const LAUNCH_PRODUCT_EXECUTION_PLAN = {
  id: '00000000-0000-4000-8000-000000000011',
  organizationId: DEFAULT_ORG_ID,
  missionCode: MISSION_CODE,
  name: 'Launch Product Execution Plan',
  active: true,
  steps: LAUNCH_PRODUCT_STAGES.map((stage, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    sequence: stage.sequence,
    code: stage.code,
    title: stage.name,
    assignedRole: stage.workerRole ?? 'service',
    stepType: stage.stepType,
    dependsOnStepIds:
      index === 0
        ? []
        : [`00000000-0000-4000-8000-${String(index).padStart(12, '0')}`],
    timeoutSeconds: stage.timeoutSeconds,
    maxRetries: stage.maxRetries,
  })),
  team: {
    leader: { role: 'ceo_ai', responsibilities: ['Mission leadership', 'Final approval'] },
    members: [
      { role: 'product_manager_ai', responsibilities: ['Discovery', 'PM review'] },
      { role: 'marketing_ai', responsibilities: ['Market validation', 'Marketing plan'] },
      { role: 'finance_ai', responsibilities: ['Profit estimation', 'Pricing'] },
      { role: 'operations_ai', responsibilities: ['Capability verification', 'Production plan'] },
    ],
  },
} as const;

/** Platform integration map per stage. */
export const STAGE_INTEGRATIONS: Record<string, readonly string[]> = {
  trend_detected: ['product-discovery', 'institutional-memory'],
  product_discovery: ['product-discovery', 'business-dna'],
  pm_review: ['ai-workforce', 'ai-runtime'],
  capability_verification: ['business-dna', 'capability-engine'],
  profit_estimation: ['product-discovery', 'intelligence-engine'],
  marketing_review: ['ai-workforce', 'institutional-memory'],
  finance_review: ['ai-workforce', 'decision-engine'],
  operations_review: ['business-dna', 'workflow-engine'],
  consensus: ['multi-agent'],
  decision_engine: ['decision-engine'],
  ceo_approval: ['ai-workforce', 'decision-engine'],
  workflow_completed: ['workflow-engine', 'institutional-memory'],
};
