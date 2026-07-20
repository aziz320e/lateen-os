import { LAUNCH_PRODUCT_STAGES } from './stages.js';
import { MISSION_CODE, MISSION_TITLE, DEFAULT_ORG_ID } from './types.js';

interface WorkflowStepBlueprint {
  readonly code: string;
  readonly name: string;
  readonly type: 'human' | 'ai' | 'service' | 'decision' | 'gateway';
  readonly optional: boolean;
  readonly nextStepCodes: readonly string[];
}

function toBlueprint(
  stage: (typeof LAUNCH_PRODUCT_STAGES)[number],
  nextCode?: string,
): WorkflowStepBlueprint {
  const typeMap = {
    ai: 'ai',
    service: 'service',
    decision: 'decision',
    consensus: 'decision',
    gateway: 'gateway',
  } as const;
  return {
    code: stage.code,
    name: stage.name,
    type: typeMap[stage.stepType],
    optional: stage.code === 'workflow_completed',
    nextStepCodes: nextCode ? [nextCode] : [],
  };
}

export const LAUNCH_PRODUCT_WORKFLOW_TEMPLATE = {
  id: '00000000-0000-4000-8000-000000000010',
  organizationId: DEFAULT_ORG_ID,
  code: MISSION_CODE,
  name: MISSION_TITLE,
  description: 'Multi-agent workflow: opportunity → approved production-ready product',
  category: 'discovery' as const,
  metadata: {
    version: '1.0.0',
    owner: 'ceo_ai',
    tags: ['mission', 'launch-product', 'multi-agent'],
    estimatedDurationMinutes: 120,
  },
  stepBlueprint: LAUNCH_PRODUCT_STAGES.map((stage, i) =>
    toBlueprint(stage, LAUNCH_PRODUCT_STAGES[i + 1]?.code),
  ),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/** Workflow definition metadata for Workflow Engine registration. */
export const LAUNCH_PRODUCT_WORKFLOW_DEFINITION = {
  code: MISSION_CODE,
  name: MISSION_TITLE,
  version: '1.0.0',
  category: 'discovery' as const,
  triggers: [{ type: 'manual' as const, label: 'Launch Product Mission' }],
  integrates: ['product-discovery', 'ai-workforce', 'decision-engine', 'multi-agent'],
};
