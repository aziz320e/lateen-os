/**
 * Real {@link Planner} implementation. When a chat provider is injected,
 * asks the model for a structured step list (validated via
 * {@link StructuredOutputProvider}); otherwise — or if the model call or
 * validation fails — falls back to a deterministic single-step plan, so
 * planning is always usable and fully unit-testable without a live
 * provider.
 *
 * @module planner/planner.impl
 */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { StreamingChatProvider, StructuredOutputProvider } from '@lateen-os/ai-provider-hub';
import { PlanningError } from '../shared/errors.js';
import type { Plan, PlanStep } from './types.js';
import type { Planner } from './planner.js';
import type { PlanRepository } from './repository.js';
import type { TaskRepository } from '../task/repository.js';

const planStepsSchema = z.object({
  steps: z
    .array(z.object({ label: z.string(), description: z.string().optional() }))
    .min(1),
});

export interface PlannerDeps {
  readonly planRepository: PlanRepository;
  readonly taskRepository: TaskRepository;
  readonly chatProvider?: StreamingChatProvider;
  readonly structuredOutput?: StructuredOutputProvider;
  /** Required when `chatProvider` is supplied. */
  readonly modelId?: string;
}

function deterministicSteps(taskTitle: string): readonly PlanStep[] {
  return [{ order: 1, label: `Complete: ${taskTitle}`, status: 'pending' }];
}

/** Creates a {@link Planner}. */
export function createPlanner(deps: PlannerDeps): Planner {
  async function generateSteps(taskTitle: string, taskDescription?: string): Promise<readonly PlanStep[]> {
    if (!deps.chatProvider || !deps.structuredOutput || !deps.modelId) {
      return deterministicSteps(taskTitle);
    }

    try {
      const result = await deps.chatProvider.complete({
        modelId: deps.modelId,
        messages: [
          {
            role: 'system',
            content:
              'You are a planning assistant. Respond with JSON only, matching: {"steps":[{"label":"...","description":"..."}]}.',
          },
          {
            role: 'user',
            content: `Task: ${taskTitle}${taskDescription ? `\nDescription: ${taskDescription}` : ''}`,
          },
        ],
        jsonMode: true,
        stream: false,
      });

      const parsed = deps.structuredOutput.parse(result.content, planStepsSchema);
      if (!parsed.valid) {
        return deterministicSteps(taskTitle);
      }
      return parsed.parsed.steps.map((step, index) => ({
        order: index + 1,
        label: step.label,
        description: step.description,
        status: 'pending' as const,
      }));
    } catch {
      // A planning failure degrades to a usable single-step plan rather than propagating.
      return deterministicSteps(taskTitle);
    }
  }

  return {
    async createPlan(organizationId, taskId) {
      const task = await deps.taskRepository.findById(organizationId, taskId);
      if (!task) {
        throw new PlanningError(`Task "${taskId}" not found`);
      }
      const steps = await generateSteps(task.title, task.description);
      const now = new Date().toISOString();
      const plan: Plan = {
        id: randomUUID(),
        organizationId,
        createdAt: now,
        updatedAt: now,
        taskId,
        runtimeAgentId: task.runtimeAgentId,
        steps,
      };
      await deps.planRepository.save(plan);
      return plan;
    },

    async refinePlan(organizationId, planId) {
      const plan = await deps.planRepository.findById(organizationId, planId);
      if (!plan) {
        throw new PlanningError(`Plan "${planId}" not found`);
      }
      const task = await deps.taskRepository.findById(organizationId, plan.taskId);
      const steps = task ? await generateSteps(task.title, task.description) : plan.steps;
      const updated: Plan = { ...plan, steps, updatedAt: new Date().toISOString() };
      await deps.planRepository.save(updated);
      return updated;
    },
  };
}
