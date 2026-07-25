import { describe, expect, it } from 'vitest';
import { createTrendRepository } from '../src/trend-discovery/repository.impl.js';
import { createForecastRepository } from '../src/forecasting/repository.impl.js';
import { createIntelligenceScoreRepository } from '../src/scoring/repository.impl.js';
import { createSignalRepository } from '../src/signals/repository.impl.js';
import { createBusinessOpportunityRepository } from '../src/opportunities/repository.impl.js';
import type { Trend } from '../src/trend-discovery/types.js';
import type { Forecast } from '../src/forecasting/types.js';
import type { IntelligenceScore } from '../src/scoring/types.js';
import type { Signal } from '../src/signals/types.js';
import type { BusinessOpportunity } from '../src/opportunities/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

describe('createTrendRepository', () => {
  const trend: Trend = {
    id: 't1', organizationId: ORG, createdAt: now, updatedAt: now,
    title: 'Rising demand', category: 'product_demand',
    score: { value: '0.8', direction: 'rising', computedAt: now },
    source: 'sales_data', signals: [], status: 'active',
  };

  it('findByCategory and findByStatus filter correctly', async () => {
    const repo = createTrendRepository([trend]);
    await expect(repo.findByCategory(ORG, 'product_demand')).resolves.toHaveLength(1);
    await expect(repo.findByCategory(ORG, 'seasonal')).resolves.toHaveLength(0);
    await expect(repo.findByStatus(ORG, 'active')).resolves.toHaveLength(1);
  });
});

describe('createForecastRepository', () => {
  const forecast: Forecast = {
    id: 'f1', organizationId: ORG, createdAt: now, updatedAt: now,
    subjectType: 'product', productId: 'p1', model: 'moving_average', period: '30d',
    predictedValue: '100', confidence: { score: '0.5' },
    forecastFrom: now, forecastTo: now, status: 'draft',
  };

  it('findByProduct and findByPeriod filter correctly', async () => {
    const repo = createForecastRepository([forecast]);
    await expect(repo.findByProduct(ORG, 'p1')).resolves.toHaveLength(1);
    await expect(repo.findByProduct(ORG, 'other')).resolves.toHaveLength(0);
    await expect(repo.findByPeriod(ORG, '30d')).resolves.toHaveLength(1);
  });
});

describe('createIntelligenceScoreRepository', () => {
  const score: IntelligenceScore = {
    id: 's1', organizationId: ORG, createdAt: now, updatedAt: now,
    subjectType: 'product', subjectId: 'p1', composite: '0.7',
  };

  it('findBySubject returns the matching score', async () => {
    const repo = createIntelligenceScoreRepository([score]);
    await expect(repo.findBySubject(ORG, 'product', 'p1')).resolves.toEqual(score);
    await expect(repo.findBySubject(ORG, 'product', 'other')).resolves.toBeNull();
  });
});

describe('createSignalRepository', () => {
  const signal: Signal = {
    id: 'sig1', organizationId: ORG, createdAt: now, updatedAt: now,
    type: 'demand_spike', title: 'Spike', strength: 'strong', score: '0.9',
    observedAt: now, status: 'active',
  };

  it('findByType and findByStatus filter correctly', async () => {
    const repo = createSignalRepository([signal]);
    await expect(repo.findByType(ORG, 'demand_spike')).resolves.toHaveLength(1);
    await expect(repo.findByType(ORG, 'demand_drop')).resolves.toHaveLength(0);
    await expect(repo.findByStatus(ORG, 'active')).resolves.toHaveLength(1);
  });
});

describe('createBusinessOpportunityRepository', () => {
  const opportunity: BusinessOpportunity = {
    id: 'bo1', organizationId: ORG, createdAt: now, updatedAt: now,
    title: 'Expand market', description: 'desc', category: 'growth',
    score: { value: '0.8', confidence: '0.7' }, status: 'qualified',
  };

  it('findByCategory and findByStatus filter correctly', async () => {
    const repo = createBusinessOpportunityRepository([opportunity]);
    await expect(repo.findByCategory(ORG, 'growth')).resolves.toHaveLength(1);
    await expect(repo.findByStatus(ORG, 'qualified')).resolves.toHaveLength(1);
    await expect(repo.findByStatus(ORG, 'lost')).resolves.toHaveLength(0);
  });
});
