import type { LaunchProductStageDefinition } from './types.js';

/** Ordered stage definitions for the Launch Product mission. */
export const LAUNCH_PRODUCT_STAGES: readonly LaunchProductStageDefinition[] = [
  { code: 'trend_detected', name: 'Trend Detected', sequence: 1, stepType: 'service', timeoutSeconds: 300, maxRetries: 2 },
  { code: 'product_discovery', name: 'Product Discovery', sequence: 2, workerRole: 'product_manager_ai', stepType: 'service', timeoutSeconds: 600, maxRetries: 2 },
  { code: 'pm_review', name: 'AI Product Manager Review', sequence: 3, workerRole: 'product_manager_ai', stepType: 'ai', timeoutSeconds: 300, maxRetries: 1 },
  { code: 'capability_verification', name: 'Capability Verification', sequence: 4, workerRole: 'operations_ai', stepType: 'ai', timeoutSeconds: 300, maxRetries: 2 },
  { code: 'profit_estimation', name: 'Profit Estimation', sequence: 5, workerRole: 'finance_ai', stepType: 'ai', timeoutSeconds: 300, maxRetries: 2 },
  { code: 'marketing_review', name: 'Marketing Review', sequence: 6, workerRole: 'marketing_ai', stepType: 'ai', timeoutSeconds: 300, maxRetries: 1 },
  { code: 'finance_review', name: 'Finance Review', sequence: 7, workerRole: 'finance_ai', stepType: 'ai', timeoutSeconds: 300, maxRetries: 1 },
  { code: 'operations_review', name: 'Operations Review', sequence: 8, workerRole: 'operations_ai', stepType: 'ai', timeoutSeconds: 300, maxRetries: 1 },
  { code: 'consensus', name: 'Consensus', sequence: 9, workerRole: 'ceo_ai', stepType: 'consensus', timeoutSeconds: 600, maxRetries: 1 },
  { code: 'decision_engine', name: 'Decision Engine', sequence: 10, stepType: 'decision', timeoutSeconds: 300, maxRetries: 0 },
  { code: 'ceo_approval', name: 'CEO Approval', sequence: 11, workerRole: 'ceo_ai', stepType: 'ai', timeoutSeconds: 300, maxRetries: 0 },
  { code: 'workflow_completed', name: 'Workflow Completed', sequence: 12, stepType: 'gateway', timeoutSeconds: 60, maxRetries: 0 },
] as const;

export function getStageIndex(code: string): number {
  return LAUNCH_PRODUCT_STAGES.findIndex((s) => s.code === code);
}

export function nextStageCode(current: string): string | undefined {
  const idx = getStageIndex(current);
  if (idx < 0 || idx >= LAUNCH_PRODUCT_STAGES.length - 1) return undefined;
  return LAUNCH_PRODUCT_STAGES[idx + 1]!.code;
}
