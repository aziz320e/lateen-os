/** @module workflow/types */
import { z } from 'zod';

export const workflowStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['task', 'approval', 'condition', 'parallel', 'service', 'worker']),
  order: z.number().int().nonnegative(),
});

export const workflowTriggerSchema = z.object({
  type: z.enum(['manual', 'schedule', 'event', 'webhook']),
  config: z.record(z.unknown()).default({}),
});

export const workflowDefinitionInputSchema = z.object({
  code: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z
    .enum(['operational', 'approval', 'discovery', 'onboarding', 'governance', 'integration', 'custom'])
    .default('custom'),
  steps: z.array(workflowStepSchema).min(1),
  triggers: z.array(workflowTriggerSchema).default([]),
});

export type WorkflowStep = z.infer<typeof workflowStepSchema>;
export type WorkflowTrigger = z.infer<typeof workflowTriggerSchema>;
export type WorkflowDefinitionInput = z.infer<typeof workflowDefinitionInputSchema>;

export interface WorkflowDefinition extends WorkflowDefinitionInput {
  readonly sdkVersion: string;
}
