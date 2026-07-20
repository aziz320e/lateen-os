/** @module mission/types */
import { z } from 'zod';

export const missionStageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().nonnegative(),
  objective: z.string().min(1),
});

export const missionOutputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['report', 'decision', 'artifact', 'metric']),
});

export const missionDefinitionInputSchema = z.object({
  code: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  stages: z.array(missionStageSchema).min(1),
  outputs: z.array(missionOutputSchema).default([]),
});

export type MissionStage = z.infer<typeof missionStageSchema>;
export type MissionOutput = z.infer<typeof missionOutputSchema>;
export type MissionDefinitionInput = z.infer<typeof missionDefinitionInputSchema>;

export interface MissionDefinition extends MissionDefinitionInput {
  readonly sdkVersion: string;
}
