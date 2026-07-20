import type { OrganizationId, DiscoveryRunId } from '../domain/identifiers.js';
import type { ProductDiscoveryRun, DiscoveryRunStage } from '../domain/discovery-run.js';
import type { MarketSignal } from '../domain/signal.js';
import type { NormalizedSignal } from '../domain/normalized-signal.js';
import type { RankedOpportunity } from '../domain/ranked-opportunity.js';
import type { CapabilityMatch } from '../domain/capability-match.js';
import type { ProfitEstimate } from '../domain/profit-estimate.js';
import type { DiscoveryRecommendation } from '../domain/discovery-recommendation.js';

export interface WorkflowExecutionRecord {
  readonly id: string;
  readonly runId: DiscoveryRunId;
  readonly stage: DiscoveryRunStage;
  readonly status: 'pending' | 'running' | 'completed' | 'failed';
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly input?: Record<string, unknown>;
  readonly output?: Record<string, unknown>;
  readonly errorMessage?: string;
}

export interface DiscoveryRunRepository {
  findById(organizationId: OrganizationId, runId: DiscoveryRunId): Promise<ProductDiscoveryRun | null>;
  findByOrganization(organizationId: OrganizationId): Promise<readonly ProductDiscoveryRun[]>;
  save(run: ProductDiscoveryRun): Promise<void>;
}

export interface SignalRepository {
  saveMany(runId: DiscoveryRunId, signals: readonly MarketSignal[]): Promise<void>;
  saveNormalizedMany(runId: DiscoveryRunId, signals: readonly NormalizedSignal[]): Promise<void>;
  findMarketByRun(runId: DiscoveryRunId): Promise<readonly MarketSignal[]>;
  findNormalizedByRun(runId: DiscoveryRunId): Promise<readonly NormalizedSignal[]>;
}

export interface OpportunityRepository {
  saveMany(runId: DiscoveryRunId, opportunities: readonly RankedOpportunity[]): Promise<void>;
  findByRun(runId: DiscoveryRunId): Promise<readonly RankedOpportunity[]>;
}

export interface CapabilityMatchRepository {
  saveMany(runId: DiscoveryRunId, matches: readonly CapabilityMatch[]): Promise<void>;
  findByRun(runId: DiscoveryRunId): Promise<readonly CapabilityMatch[]>;
}

export interface ProfitEstimateRepository {
  saveMany(runId: DiscoveryRunId, estimates: readonly ProfitEstimate[]): Promise<void>;
  findByRun(runId: DiscoveryRunId): Promise<readonly ProfitEstimate[]>;
}

export interface RecommendationRepository {
  saveMany(runId: DiscoveryRunId, recommendations: readonly DiscoveryRecommendation[]): Promise<void>;
  findByRun(runId: DiscoveryRunId): Promise<readonly DiscoveryRecommendation[]>;
  findByOrganization(organizationId: OrganizationId, limit?: number): Promise<readonly DiscoveryRecommendation[]>;
}

export interface WorkflowExecutionRepository {
  save(execution: WorkflowExecutionRecord): Promise<void>;
  findByRun(runId: DiscoveryRunId): Promise<readonly WorkflowExecutionRecord[]>;
}

export interface Repositories {
  discoveryRun: DiscoveryRunRepository;
  signal: SignalRepository;
  opportunity: OpportunityRepository;
  capabilityMatch: CapabilityMatchRepository;
  profitEstimate: ProfitEstimateRepository;
  recommendation: RecommendationRepository;
  workflowExecution: WorkflowExecutionRepository;
}
