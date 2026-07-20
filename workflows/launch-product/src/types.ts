/** Launch Product mission constants and shared types. */

export const MISSION_CODE = 'launch-product' as const;
export const MISSION_TITLE = 'Launch Product' as const;
export const DEFAULT_ORG_ID = '00000000-0000-4000-8000-000000000001' as const;

export type LaunchProductStageCode =
  | 'trend_detected'
  | 'product_discovery'
  | 'pm_review'
  | 'capability_verification'
  | 'profit_estimation'
  | 'marketing_review'
  | 'finance_review'
  | 'operations_review'
  | 'consensus'
  | 'decision_engine'
  | 'ceo_approval'
  | 'workflow_completed';

export type LaunchProductStageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'escalated';

export type SimulationScenario = 'happy_path' | 'escalation_path' | 'rejected_path' | 'retry_path';

export interface LaunchProductStageDefinition {
  readonly code: LaunchProductStageCode;
  readonly name: string;
  readonly sequence: number;
  readonly workerRole?: string;
  readonly stepType: 'ai' | 'service' | 'decision' | 'consensus' | 'gateway';
  readonly timeoutSeconds: number;
  readonly maxRetries: number;
}

export interface LaunchProductMissionEvent {
  readonly eventName: string;
  readonly occurredAt: string;
  readonly missionId: string;
  readonly stageCode?: LaunchProductStageCode;
  readonly payload: Record<string, unknown>;
}

export interface LaunchProductStageState {
  readonly code: LaunchProductStageCode;
  readonly name: string;
  readonly status: LaunchProductStageStatus;
  readonly workerRole?: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly attempts: number;
  readonly errorMessage?: string;
}

export interface LaunchProductMissionOutputs {
  readonly approvedProduct?: { title: string; code: string; manufacturable: boolean };
  readonly marketingPlan?: { summary: string; channels: string[] };
  readonly pricingRecommendation?: { unitPrice: string; marginPercent: string };
  readonly productionPlan?: { summary: string; machineIds: string[] };
  readonly capabilityReport?: { overallScore: string; gaps: string[] };
  readonly decisionRecord?: { decisionId: string; status: string; title: string };
  readonly memoryEntry?: { entryId: string; summary: string };
}

export interface LaunchProductMissionState {
  readonly id: string;
  readonly organizationId: string;
  readonly code: typeof MISSION_CODE;
  readonly title: typeof MISSION_TITLE;
  readonly status: 'planning' | 'active' | 'escalated' | 'completed' | 'failed' | 'cancelled';
  readonly scenario?: SimulationScenario;
  readonly currentStage: LaunchProductStageCode;
  readonly stages: readonly LaunchProductStageState[];
  readonly consensusReached: boolean;
  readonly decisionApproved: boolean;
  readonly health: 'healthy' | 'at_risk' | 'critical';
  readonly events: readonly LaunchProductMissionEvent[];
  readonly outputs: LaunchProductMissionOutputs;
  readonly startedAt: string;
  readonly completedAt?: string;
}

export interface LaunchProductSimulationInput {
  readonly organizationId?: string;
  readonly opportunityTitle?: string;
  readonly scenario?: SimulationScenario;
}

export interface LaunchProductSimulationResult {
  readonly mission: LaunchProductMissionState;
}
