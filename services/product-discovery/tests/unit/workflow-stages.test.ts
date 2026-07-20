import { describe, expect, it } from 'vitest';
import { createNormalizeStage, createRankStage } from '../../src/workflows/implementations/workflow-stages.impl.js';
import type { OrganizationId } from '../../src/domain/identifiers.js';
import { randomUUID } from 'node:crypto';

describe('NormalizeStage', () => {
  it('groups signals by keyword', async () => {
    const stage = createNormalizeStage();
    const organizationId = randomUUID() as OrganizationId;
    const output = await stage.execute({
      organizationId,
      runId: randomUUID() as never,
      collectSignals: {
        runId: 'run-1',
        sourceCounts: { google_trends: 1 },
        signals: [
          {
            signalId: randomUUID() as never,
            organizationId,
            source: 'google_trends',
            category: 'trend',
            title: 'signage trend',
            keyword: 'signage',
            rawPayload: {},
            strength: '0.80',
            collectedAt: new Date().toISOString(),
          },
          {
            signalId: randomUUID() as never,
            organizationId,
            source: 'tiktok',
            category: 'social_engagement',
            title: 'signage social',
            keyword: 'signage',
            rawPayload: {},
            strength: '0.70',
            collectedAt: new Date().toISOString(),
          },
        ],
      },
    });

    expect(output.result.signals).toHaveLength(1);
    expect(output.result.signals[0]?.productConcept).toBe('signage');
    expect(output.result.signals[0]?.sourceSignalIds).toHaveLength(2);
  });
});

describe('RankStage', () => {
  it('ranks normalized signals deterministically', async () => {
    const stage = createRankStage();
    const organizationId = randomUUID() as OrganizationId;
    const output = await stage.execute({
      organizationId,
      runId: randomUUID() as never,
      normalize: {
        signals: [
          {
            normalizedSignalId: randomUUID() as never,
            organizationId,
            sourceSignalIds: [randomUUID() as never],
            primarySource: 'google_trends',
            category: 'trend',
            productConcept: 'led board',
            keywords: ['led board'],
            demandScore: '0.90',
            confidence: '0.85',
          },
          {
            normalizedSignalId: randomUUID() as never,
            organizationId,
            sourceSignalIds: [randomUUID() as never],
            primarySource: 'amazon',
            category: 'marketplace_listing',
            productConcept: 'vehicle wrap',
            keywords: ['vehicle wrap'],
            demandScore: '0.70',
            confidence: '0.75',
          },
        ],
      },
    });

    expect(output.result.opportunities[0]?.title).toBe('led board');
    expect(output.result.opportunities[0]?.rank).toBe(1);
  });
});
