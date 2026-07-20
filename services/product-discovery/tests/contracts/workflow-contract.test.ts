/**
 * Workflow stage interface contracts — compile-time + runtime smoke.
 */
import { describe, expect, it } from 'vitest';
import type { ProductDiscoveryWorkflow } from '../../src/workflows/product-discovery-workflow.js';

describe('workflow contracts', () => {
  it('defines seven workflow stages on ProductDiscoveryWorkflow', () => {
    const stageKeys: (keyof ProductDiscoveryWorkflow['stages'])[] = [
      'collectSignals',
      'normalize',
      'rank',
      'capabilityMatching',
      'profitEstimation',
      'decisionSubmission',
      'recommendation',
    ];
    expect(stageKeys).toHaveLength(7);
  });
});
