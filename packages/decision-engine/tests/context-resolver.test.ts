import { describe, expect, it } from 'vitest';
import { createContextResolver } from '../src/reasoning/context-resolver.impl.js';
import { createDecisionContextRepository } from '../src/context/repository.impl.js';
import type { DecisionContext } from '../src/context/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

describe('createContextResolver', () => {
  it('returns the existing context when one is already saved for the decision', async () => {
    const existing: DecisionContext = {
      id: 'c1',
      organizationId: ORG,
      createdAt: now,
      updatedAt: now,
      decisionId: 'd1',
      businessDnaRefs: [],
      capabilityRefs: [],
      currentMetrics: [],
      currentPolicies: [],
    };
    const contextRepository = createDecisionContextRepository([existing]);
    const resolver = createContextResolver({ contextRepository });

    const result = await resolver.resolveContext({ organizationId: ORG, decisionId: 'd1' });
    expect(result).toEqual(existing);
  });

  it('assembles a valid empty context when none exists yet', async () => {
    const contextRepository = createDecisionContextRepository();
    const resolver = createContextResolver({ contextRepository });

    const result = await resolver.resolveContext({ organizationId: ORG, decisionId: 'd2' });
    expect(result.decisionId).toBe('d2');
    expect(result.organizationId).toBe(ORG);
    expect(result.businessDnaRefs).toEqual([]);
    expect(result.id).toBeTruthy();
  });
});
