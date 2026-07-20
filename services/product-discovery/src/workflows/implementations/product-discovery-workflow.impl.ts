import { randomUUID } from 'node:crypto';
import type { ProductDiscoveryWorkflow } from '../product-discovery-workflow.js';
import type { ProductDiscoveryWorkflowInput, ProductDiscoveryWorkflowOutput } from '../types.js';
import type { ProductDiscoveryWorkflowStages } from '../product-discovery-workflow.js';
import type { Repositories } from '../../repositories/ports.js';
import type { DiscoveryEventPublisher } from '../../domain/ports.js';
import type { ProductDiscoveryRun } from '../../domain/discovery-run.js';
import type { DiscoveryRunId } from '../../domain/identifiers.js';
import type { CacheStore } from '../../infrastructure/cache/redis-cache.js';

export interface WorkflowExecutorDeps {
  readonly stages: ProductDiscoveryWorkflowStages;
  readonly repositories: Repositories;
  readonly events: DiscoveryEventPublisher;
  readonly cache?: CacheStore;
}

async function trackStage(
  deps: WorkflowExecutorDeps,
  runId: DiscoveryRunId,
  stage: ProductDiscoveryRun['currentStage'],
  fn: () => Promise<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const startedAt = new Date().toISOString();
  await deps.repositories.workflowExecution.save({
    id: randomUUID(),
    runId,
    stage: stage!,
    status: 'running',
    startedAt,
  });

  try {
    const output = await fn();
    await deps.repositories.workflowExecution.save({
      id: randomUUID(),
      runId,
      stage: stage!,
      status: 'completed',
      startedAt,
      completedAt: new Date().toISOString(),
      output,
    });
    return output;
  } catch (error) {
    await deps.repositories.workflowExecution.save({
      id: randomUUID(),
      runId,
      stage: stage!,
      status: 'failed',
      startedAt,
      completedAt: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export function createProductDiscoveryWorkflow(deps: WorkflowExecutorDeps): ProductDiscoveryWorkflow {
  return {
    stages: deps.stages,
    async execute(input: ProductDiscoveryWorkflowInput): Promise<ProductDiscoveryWorkflowOutput> {
      const now = new Date().toISOString();
      let run: ProductDiscoveryRun = {
        id: input.runId,
        organizationId: input.organizationId,
        status: 'collecting_signals',
        currentStage: 'collect_signals',
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await deps.repositories.discoveryRun.save(run);
      await deps.events.publish({
        eventName: 'DiscoveryStarted',
        eventId: randomUUID(),
        occurredAt: now,
        aggregateId: input.runId as string,
        payload: { runId: input.runId as string, organizationId: input.organizationId as string },
      });

      try {
        const collectOutput = await trackStage(deps, input.runId, 'collect_signals', async () => {
          const output = await deps.stages.collectSignals.execute(input);
          await deps.repositories.signal.saveMany(input.runId, output.result.signals);
          return output.result as unknown as Record<string, unknown>;
        });

        run = {
          ...run,
          status: 'normalizing',
          currentStage: 'normalize',
          collectSignals: collectOutput as unknown as ProductDiscoveryRun['collectSignals'],
          updatedAt: new Date().toISOString(),
        };
        await deps.repositories.discoveryRun.save(run);

        await deps.events.publish({
          eventName: 'SignalsCollected',
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          aggregateId: input.runId as string,
          payload: {
            signalCount: run.collectSignals?.signals.length ?? 0,
            organizationId: input.organizationId as string,
          },
        });

        const normalizeOutput = await trackStage(deps, input.runId, 'normalize', async () => {
          const output = await deps.stages.normalize.execute({
            ...input,
            collectSignals: run.collectSignals!,
          });
          await deps.repositories.signal.saveNormalizedMany(input.runId, output.result.signals);
          return output.result as unknown as Record<string, unknown>;
        });

        run = {
          ...run,
          status: 'ranking',
          currentStage: 'rank',
          normalize: normalizeOutput as unknown as ProductDiscoveryRun['normalize'],
          updatedAt: new Date().toISOString(),
        };
        await deps.repositories.discoveryRun.save(run);

        const rankOutput = await trackStage(deps, input.runId, 'rank', async () => {
          const output = await deps.stages.rank.execute({
            ...input,
            normalize: run.normalize!,
          });
          await deps.repositories.opportunity.saveMany(input.runId, output.result.opportunities);
          return output.result as unknown as Record<string, unknown>;
        });

        run = {
          ...run,
          status: 'matching_capabilities',
          currentStage: 'capability_matching',
          rank: rankOutput as unknown as ProductDiscoveryRun['rank'],
          updatedAt: new Date().toISOString(),
        };
        await deps.repositories.discoveryRun.save(run);

        const capabilityOutput = await trackStage(deps, input.runId, 'capability_matching', async () => {
          const output = await deps.stages.capabilityMatching.execute({
            ...input,
            rank: run.rank!,
          });
          await deps.repositories.capabilityMatch.saveMany(input.runId, output.result.matches);
          return output.result as unknown as Record<string, unknown>;
        });

        run = {
          ...run,
          status: 'estimating_profit',
          currentStage: 'profit_estimation',
          capabilityMatching: capabilityOutput as unknown as ProductDiscoveryRun['capabilityMatching'],
          updatedAt: new Date().toISOString(),
        };
        await deps.repositories.discoveryRun.save(run);

        await deps.events.publish({
          eventName: 'CapabilitiesMatched',
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          aggregateId: input.runId as string,
          payload: {
            matchCount: run.capabilityMatching?.matches.length ?? 0,
            organizationId: input.organizationId as string,
          },
        });

        const profitOutput = await trackStage(deps, input.runId, 'profit_estimation', async () => {
          const output = await deps.stages.profitEstimation.execute({
            ...input,
            capabilityMatching: run.capabilityMatching!,
          });
          await deps.repositories.profitEstimate.saveMany(input.runId, output.result.estimates);
          return output.result as unknown as Record<string, unknown>;
        });

        run = {
          ...run,
          status: 'submitting_decision',
          currentStage: 'decision_submission',
          profitEstimation: profitOutput as unknown as ProductDiscoveryRun['profitEstimation'],
          updatedAt: new Date().toISOString(),
        };
        await deps.repositories.discoveryRun.save(run);

        const decisionOutput = await trackStage(deps, input.runId, 'decision_submission', async () => {
          const output = await deps.stages.decisionSubmission.execute({
            ...input,
            profitEstimation: run.profitEstimation!,
          });
          return output.result as unknown as Record<string, unknown>;
        });

        run = {
          ...run,
          status: 'producing_recommendation',
          currentStage: 'recommendation',
          decisionSubmission: decisionOutput as unknown as ProductDiscoveryRun['decisionSubmission'],
          updatedAt: new Date().toISOString(),
        };
        await deps.repositories.discoveryRun.save(run);

        await deps.events.publish({
          eventName: 'DecisionRequested',
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          aggregateId: input.runId as string,
          payload: {
            decisionId: run.decisionSubmission?.submission.decisionId as string,
            organizationId: input.organizationId as string,
          },
        });

        const recommendationOutput = await trackStage(deps, input.runId, 'recommendation', async () => {
          const output = await deps.stages.recommendation.execute({
            ...input,
            decisionSubmission: run.decisionSubmission!,
            capabilityMatching: run.capabilityMatching!,
            profitEstimation: run.profitEstimation!,
          });
          await deps.repositories.recommendation.saveMany(input.runId, output.result.recommendations);
          if (deps.cache) {
            await deps.cache.set(
              `recommendations:${input.organizationId}:${input.runId as string}`,
              output.result.recommendations,
            );
          }
          return output.result as unknown as Record<string, unknown>;
        });

        run = {
          ...run,
          status: 'completed',
          currentStage: 'recommendation',
          recommendation: recommendationOutput as unknown as ProductDiscoveryRun['recommendation'],
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await deps.repositories.discoveryRun.save(run);

        await deps.events.publish({
          eventName: 'RecommendationCreated',
          eventId: randomUUID(),
          occurredAt: new Date().toISOString(),
          aggregateId: input.runId as string,
          payload: {
            recommendationCount: run.recommendation?.recommendations.length ?? 0,
            organizationId: input.organizationId as string,
          },
        });

        return { run };
      } catch (error) {
        run = {
          ...run,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await deps.repositories.discoveryRun.save(run);
        throw error;
      }
    },
  };
}
