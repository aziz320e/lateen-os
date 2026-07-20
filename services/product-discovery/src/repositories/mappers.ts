import type { Prisma } from '@prisma/product-discovery-client';
import type { ProductDiscoveryRun } from '../domain/discovery-run.js';
import type { MarketSignal } from '../domain/signal.js';
import type { NormalizedSignal } from '../domain/normalized-signal.js';
import type { RankedOpportunity } from '../domain/ranked-opportunity.js';
import type { CapabilityMatch } from '../domain/capability-match.js';
import type { ProfitEstimate } from '../domain/profit-estimate.js';
import type { DiscoveryRecommendation } from '../domain/discovery-recommendation.js';
import type { DiscoveryRunId, OrganizationId } from '../domain/identifiers.js';
import type { WorkflowExecutionRecord } from './ports.js';

export function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export function asJson<T>(value: unknown): T {
  return (value ?? {}) as T;
}

export function toIsoDateTime(date: Date): string {
  return date.toISOString();
}

export function mapDiscoveryRun(row: {
  id: string;
  organizationId: string;
  status: string;
  currentStage: string | null;
  keywords: unknown;
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  stageResults: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ProductDiscoveryRun {
  const stageResults = asJson<Record<string, unknown>>(row.stageResults);
  return {
    id: row.id as DiscoveryRunId,
    organizationId: row.organizationId as OrganizationId,
    status: row.status as ProductDiscoveryRun['status'],
    currentStage: (row.currentStage ?? undefined) as ProductDiscoveryRun['currentStage'],
    startedAt: toIsoDateTime(row.startedAt),
    completedAt: row.completedAt ? toIsoDateTime(row.completedAt) : undefined,
    errorMessage: row.errorMessage ?? undefined,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
    collectSignals: stageResults.collectSignals as ProductDiscoveryRun['collectSignals'],
    normalize: stageResults.normalize as ProductDiscoveryRun['normalize'],
    rank: stageResults.rank as ProductDiscoveryRun['rank'],
    capabilityMatching: stageResults.capabilityMatching as ProductDiscoveryRun['capabilityMatching'],
    profitEstimation: stageResults.profitEstimation as ProductDiscoveryRun['profitEstimation'],
    decisionSubmission: stageResults.decisionSubmission as ProductDiscoveryRun['decisionSubmission'],
    recommendation: stageResults.recommendation as ProductDiscoveryRun['recommendation'],
  };
}

export function mapMarketSignal(data: unknown): MarketSignal {
  return data as MarketSignal;
}

export function mapNormalizedSignal(data: unknown): NormalizedSignal {
  return data as NormalizedSignal;
}

export function mapOpportunity(data: unknown): RankedOpportunity {
  return data as RankedOpportunity;
}

export function mapCapabilityMatch(data: unknown): CapabilityMatch {
  return data as CapabilityMatch;
}

export function mapProfitEstimate(data: unknown): ProfitEstimate {
  return data as ProfitEstimate;
}

export function mapRecommendation(data: unknown): DiscoveryRecommendation {
  return data as DiscoveryRecommendation;
}

export function mapWorkflowExecution(row: {
  id: string;
  runId: string;
  stage: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  input: unknown;
  output: unknown;
  errorMessage: string | null;
}): WorkflowExecutionRecord {
  return {
    id: row.id,
    runId: row.runId as DiscoveryRunId,
    stage: row.stage as WorkflowExecutionRecord['stage'],
    status: row.status as WorkflowExecutionRecord['status'],
    startedAt: toIsoDateTime(row.startedAt),
    completedAt: row.completedAt ? toIsoDateTime(row.completedAt) : undefined,
    input: row.input ? asJson(row.input) : undefined,
    output: row.output ? asJson(row.output) : undefined,
    errorMessage: row.errorMessage ?? undefined,
  };
}

export function buildStageResults(run: ProductDiscoveryRun): Record<string, unknown> {
  return {
    collectSignals: run.collectSignals,
    normalize: run.normalize,
    rank: run.rank,
    capabilityMatching: run.capabilityMatching,
    profitEstimation: run.profitEstimation,
    decisionSubmission: run.decisionSubmission,
    recommendation: run.recommendation,
  };
}
