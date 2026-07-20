import type { LaunchProductStageCode } from './types.js';

export interface EscalationRule {
  readonly fromStage: LaunchProductStageCode;
  readonly trigger: 'timeout' | 'failure' | 'consensus_deadlock' | 'review_rejected';
  readonly escalateTo: 'ceo_ai' | 'decision_engine' | 'human_operator';
  readonly maxEscalations: number;
}

export interface TimeoutRule {
  readonly stageCode: LaunchProductStageCode;
  readonly timeoutSeconds: number;
  readonly action: 'retry' | 'escalate' | 'fail';
}

export interface RetryRule {
  readonly stageCode: LaunchProductStageCode;
  readonly maxAttempts: number;
  readonly backoffSeconds: number;
}

export interface RollbackRule {
  readonly fromStage: LaunchProductStageCode;
  readonly rollbackTo: LaunchProductStageCode;
  readonly reason: string;
}

export const ESCALATION_RULES: readonly EscalationRule[] = [
  { fromStage: 'marketing_review', trigger: 'review_rejected', escalateTo: 'ceo_ai', maxEscalations: 2 },
  { fromStage: 'finance_review', trigger: 'review_rejected', escalateTo: 'ceo_ai', maxEscalations: 2 },
  { fromStage: 'operations_review', trigger: 'review_rejected', escalateTo: 'ceo_ai', maxEscalations: 2 },
  { fromStage: 'consensus', trigger: 'consensus_deadlock', escalateTo: 'decision_engine', maxEscalations: 1 },
  { fromStage: 'decision_engine', trigger: 'failure', escalateTo: 'human_operator', maxEscalations: 1 },
];

export const TIMEOUT_RULES: readonly TimeoutRule[] = [
  { stageCode: 'product_discovery', timeoutSeconds: 600, action: 'retry' },
  { stageCode: 'consensus', timeoutSeconds: 600, action: 'escalate' },
  { stageCode: 'decision_engine', timeoutSeconds: 300, action: 'fail' },
];

export const RETRY_RULES: readonly RetryRule[] = [
  { stageCode: 'trend_detected', maxAttempts: 2, backoffSeconds: 30 },
  { stageCode: 'product_discovery', maxAttempts: 2, backoffSeconds: 60 },
  { stageCode: 'capability_verification', maxAttempts: 2, backoffSeconds: 45 },
  { stageCode: 'profit_estimation', maxAttempts: 2, backoffSeconds: 45 },
];

export const ROLLBACK_RULES: readonly RollbackRule[] = [
  { fromStage: 'ceo_approval', rollbackTo: 'consensus', reason: 'CEO rejected final approval' },
  { fromStage: 'decision_engine', rollbackTo: 'pm_review', reason: 'Decision engine requires additional product data' },
];
