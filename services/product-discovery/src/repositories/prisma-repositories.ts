import type { PrismaClient, Prisma } from '@prisma/product-discovery-client';
import type { OrganizationId, DiscoveryRunId } from '../domain/identifiers.js';
import type { ProductDiscoveryRun } from '../domain/discovery-run.js';
import type { MarketSignal } from '../domain/signal.js';
import type { NormalizedSignal } from '../domain/normalized-signal.js';
import type { RankedOpportunity } from '../domain/ranked-opportunity.js';
import type { CapabilityMatch } from '../domain/capability-match.js';
import type { ProfitEstimate } from '../domain/profit-estimate.js';
import type { DiscoveryRecommendation } from '../domain/discovery-recommendation.js';
import type { Repositories, WorkflowExecutionRecord } from './ports.js';
import {
  asJson,
  buildStageResults,
  mapCapabilityMatch,
  mapDiscoveryRun,
  mapMarketSignal,
  mapNormalizedSignal,
  mapOpportunity,
  mapProfitEstimate,
  mapRecommendation,
  mapWorkflowExecution,
  toJson,
} from './mappers.js';

export function createRepositories(prisma: PrismaClient): Repositories {
  return {
    discoveryRun: {
      async findById(organizationId, runId) {
        const row = await prisma.discoveryRun.findFirst({
          where: { id: runId as string, organizationId: organizationId as string },
        });
        return row ? mapDiscoveryRun(row) : null;
      },
      async findByOrganization(organizationId) {
        const rows = await prisma.discoveryRun.findMany({
          where: { organizationId: organizationId as string },
          orderBy: { startedAt: 'desc' },
        });
        return rows.map(mapDiscoveryRun);
      },
      async save(run) {
        await prisma.discoveryRun.upsert({
          where: { id: run.id as string },
          create: {
            id: run.id as string,
            organizationId: run.organizationId as string,
            status: run.status,
            currentStage: run.currentStage ?? null,
            keywords: toJson(run.collectSignals?.signals.map((s) => s.keyword).filter(Boolean) ?? []),
            startedAt: new Date(run.startedAt),
            completedAt: run.completedAt ? new Date(run.completedAt) : null,
            errorMessage: run.errorMessage ?? null,
            stageResults: toJson(buildStageResults(run)),
            createdAt: new Date(run.createdAt),
            updatedAt: new Date(run.updatedAt),
          },
          update: {
            status: run.status,
            currentStage: run.currentStage ?? null,
            completedAt: run.completedAt ? new Date(run.completedAt) : null,
            errorMessage: run.errorMessage ?? null,
            stageResults: toJson(buildStageResults(run)),
            updatedAt: new Date(run.updatedAt),
          },
        });
      },
    },
    signal: {
      async saveMany(runId, signals) {
        if (signals.length === 0) return;
        await prisma.signal.createMany({
          data: signals.map((signal) => ({
            id: signal.signalId as string,
            runId: runId as string,
            organizationId: signal.organizationId as string,
            signalType: 'market',
            source: signal.source,
            data: toJson(signal),
          })),
          skipDuplicates: true,
        });
      },
      async saveNormalizedMany(runId, signals) {
        if (signals.length === 0) return;
        await prisma.signal.createMany({
          data: signals.map((signal) => ({
            id: signal.normalizedSignalId as string,
            runId: runId as string,
            organizationId: signal.organizationId as string,
            signalType: 'normalized',
            source: signal.primarySource,
            data: toJson(signal),
          })),
          skipDuplicates: true,
        });
      },
      async findMarketByRun(runId) {
        const rows = await prisma.signal.findMany({
          where: { runId: runId as string, signalType: 'market' },
        });
        return rows.map((row) => mapMarketSignal(row.data));
      },
      async findNormalizedByRun(runId) {
        const rows = await prisma.signal.findMany({
          where: { runId: runId as string, signalType: 'normalized' },
        });
        return rows.map((row) => mapNormalizedSignal(row.data));
      },
    },
    opportunity: {
      async saveMany(runId, opportunities) {
        if (opportunities.length === 0) return;
        await prisma.opportunity.createMany({
          data: opportunities.map((opportunity) => ({
            id: opportunity.opportunityId as string,
            runId: runId as string,
            organizationId: opportunity.organizationId as string,
            data: toJson(opportunity),
          })),
          skipDuplicates: true,
        });
      },
      async findByRun(runId) {
        const rows = await prisma.opportunity.findMany({ where: { runId: runId as string } });
        return rows.map((row) => mapOpportunity(row.data));
      },
    },
    capabilityMatch: {
      async saveMany(runId, matches) {
        if (matches.length === 0) return;
        await prisma.capabilityMatchRecord.createMany({
          data: matches.map((match) => ({
            id: match.matchId as string,
            runId: runId as string,
            organizationId: match.organizationId as string,
            data: toJson(match),
          })),
          skipDuplicates: true,
        });
      },
      async findByRun(runId) {
        const rows = await prisma.capabilityMatchRecord.findMany({
          where: { runId: runId as string },
        });
        return rows.map((row) => mapCapabilityMatch(row.data));
      },
    },
    profitEstimate: {
      async saveMany(runId, estimates) {
        if (estimates.length === 0) return;
        await prisma.profitEstimateRecord.createMany({
          data: estimates.map((estimate) => ({
            id: estimate.estimateId as string,
            runId: runId as string,
            organizationId: estimate.organizationId as string,
            data: toJson(estimate),
          })),
          skipDuplicates: true,
        });
      },
      async findByRun(runId) {
        const rows = await prisma.profitEstimateRecord.findMany({
          where: { runId: runId as string },
        });
        return rows.map((row) => mapProfitEstimate(row.data));
      },
    },
    recommendation: {
      async saveMany(runId, recommendations) {
        for (const recommendation of recommendations) {
          await prisma.recommendationRecord.upsert({
            where: { id: recommendation.id as string },
            create: {
              id: recommendation.id as string,
              runId: runId as string,
              organizationId: recommendation.organizationId as string,
              data: toJson(recommendation),
              createdAt: new Date(recommendation.createdAt),
              updatedAt: new Date(recommendation.updatedAt),
            },
            update: {
              data: toJson(recommendation),
              updatedAt: new Date(recommendation.updatedAt),
            },
          });
        }
      },
      async findByRun(runId) {
        const rows = await prisma.recommendationRecord.findMany({
          where: { runId: runId as string },
        });
        return rows.map((row) => mapRecommendation(row.data));
      },
      async findByOrganization(organizationId, limit = 50) {
        const rows = await prisma.recommendationRecord.findMany({
          where: { organizationId: organizationId as string },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return rows.map((row) => mapRecommendation(row.data));
      },
    },
    workflowExecution: {
      async save(execution: WorkflowExecutionRecord) {
        await prisma.workflowExecution.upsert({
          where: {
            runId_stage: {
              runId: execution.runId as string,
              stage: execution.stage,
            },
          },
          create: {
            id: execution.id,
            runId: execution.runId as string,
            stage: execution.stage,
            status: execution.status,
            startedAt: new Date(execution.startedAt),
            completedAt: execution.completedAt ? new Date(execution.completedAt) : null,
            input: execution.input ? toJson(execution.input) : undefined,
            output: execution.output ? toJson(execution.output) : undefined,
            errorMessage: execution.errorMessage ?? null,
          },
          update: {
            status: execution.status,
            completedAt: execution.completedAt ? new Date(execution.completedAt) : null,
            input: execution.input ? toJson(execution.input) : undefined,
            output: execution.output ? toJson(execution.output) : undefined,
            errorMessage: execution.errorMessage ?? null,
          },
        });
      },
      async findByRun(runId) {
        const rows = await prisma.workflowExecution.findMany({
          where: { runId: runId as string },
          orderBy: { startedAt: 'asc' },
        });
        return rows.map(mapWorkflowExecution);
      },
    },
  };
}

export type { Repositories };
