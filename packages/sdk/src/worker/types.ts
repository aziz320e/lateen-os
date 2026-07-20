/** @module worker/types */
import { z } from 'zod';

export const workerSkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  proficiency: z.string().regex(/^0(\.\d+)?$|^1(\.0+)?$/).default('0.8'),
});

export const workerEventSchema = z.object({
  name: z.string().regex(/^[a-z0-9_.]+$/),
  description: z.string().optional(),
});

export const workerLifecycleSchema = z.enum([
  'registered',
  'provisioned',
  'activated',
  'assigned',
  'executing',
  'reviewing',
  'paused',
  'suspended',
  'offboarded',
]);

export const workerProfileInputSchema = z.object({
  code: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  role: z.string().min(1),
  departmentCode: z.string().optional(),
  skills: z.array(workerSkillSchema).default([]),
  events: z.array(workerEventSchema).default([]),
});

export type WorkerSkill = z.infer<typeof workerSkillSchema>;
export type WorkerEvent = z.infer<typeof workerEventSchema>;
export type WorkerLifecycle = z.infer<typeof workerLifecycleSchema>;
export type WorkerProfileInput = z.infer<typeof workerProfileInputSchema>;

export interface WorkerProfile extends WorkerProfileInput {
  readonly sdkVersion: string;
}

export interface WorkerLifecycleHooks {
  readonly onRegistered?: () => void | Promise<void>;
  readonly onActivated?: () => void | Promise<void>;
  readonly onAssigned?: () => void | Promise<void>;
  readonly onOffboarded?: () => void | Promise<void>;
}
