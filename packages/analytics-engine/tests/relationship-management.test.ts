import { describe, expect, it } from 'vitest';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import type { RelationshipManagementDeps } from '../src/relationship-management/types.js';

const ORG = 'org-1';

describe('createRelationshipManagement — fully offline (no collaborators injected)', () => {
  it('every method degrades to null when its collaborator is not injected', async () => {
    const relationships = createRelationshipManagement({});
    expect(await relationships.getInstitutionalMemoryContext(ORG)).toBeNull();
    expect(await relationships.getDomainGraphContext(ORG, 'graph-1')).toBeNull();
    expect(await relationships.getDecisionContext(ORG)).toBeNull();
    expect(await relationships.getIntelligenceContext(ORG)).toBeNull();
    expect(await relationships.getWorkforceUtilizationContext(ORG)).toBeNull();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
  });
});

describe('createRelationshipManagement — with injected collaborators', () => {
  it('getInstitutionalMemoryContext() delegates to the real Institutional Memory queries', async () => {
    const deps: RelationshipManagementDeps = {
      institutionalMemory: {
        findKnowledge: async () => ({ entries: [{ id: 'k1' }] as never, total: 1 }),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.getInstitutionalMemoryContext(ORG);
    expect(result?.entries).toHaveLength(1);
  });

  it('getDomainGraphContext() delegates to the real Domain Graph queries', async () => {
    const deps: RelationshipManagementDeps = {
      domainGraph: {
        graphStatistics: async () => ({ entityCount: 5, relationshipCount: 3, entityCountsByType: {}, relationshipCountsByType: {}, componentCount: 1 }),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.getDomainGraphContext(ORG, 'graph-1');
    expect(result?.entityCount).toBe(5);
  });

  it('getDecisionContext() delegates to the real Decision Engine queries', async () => {
    const deps: RelationshipManagementDeps = {
      decisionEngine: {
        findPendingApprovals: async () => ({ approvals: [{ id: 'a1' }] as never } as never),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.getDecisionContext(ORG);
    expect(result).toEqual({ approvals: [{ id: 'a1' }] });
  });

  it('getIntelligenceContext() delegates to the real Intelligence Engine queries', async () => {
    const deps: RelationshipManagementDeps = {
      intelligenceEngine: {
        findBusinessOpportunities: async () => ({ opportunities: [{ id: 'o1' }] as never } as never),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.getIntelligenceContext(ORG);
    expect(result).toEqual({ opportunities: [{ id: 'o1' }] });
  });

  it('getWorkforceUtilizationContext() computes utilization from real worker statuses', async () => {
    const deps: RelationshipManagementDeps = {
      aiWorkforce: {
        findWorkers: async () => ({
          workers: [{ status: 'busy' }, { status: 'active' }, { status: 'offboarded' }] as never,
          total: 3,
        }),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.getWorkforceUtilizationContext(ORG);
    expect(result).toEqual({ busyCount: 1, activeCount: 2, utilizationPercentage: 50 });
  });

  it('getWorkforceUtilizationContext() returns 0% utilization when there are no active workers', async () => {
    const deps: RelationshipManagementDeps = {
      aiWorkforce: {
        findWorkers: async () => ({ workers: [], total: 0 }),
      },
    };
    const relationships = createRelationshipManagement(deps);
    const result = await relationships.getWorkforceUtilizationContext(ORG);
    expect(result?.utilizationPercentage).toBe(0);
  });

  it('getBusinessProfileContext() delegates to the real Business DNA service', async () => {
    const deps: RelationshipManagementDeps = {
      businessDna: {
        businessProfile: {
          get: async () => ({ id: 'profile-1' } as never),
        } as never,
      },
    };
    const relationships = createRelationshipManagement(deps);
    const profile = await relationships.getBusinessProfileContext(ORG);
    expect(profile).toEqual({ id: 'profile-1' });
  });
});
