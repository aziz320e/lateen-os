import { describe, expect, it } from 'vitest';
import { mapOrganization } from '../../src/repositories/mappers.js';

describe('mapOrganization', () => {
  it('maps prisma row to domain organization', () => {
    const row = {
      id: '00000000-0000-4000-8000-000000000001',
      code: 'LATEEN',
      name: 'Lateen',
      legalName: 'Lateen LLC',
      registrationNumber: 'REG',
      taxId: 'TAX',
      status: 'active',
      defaultCurrency: 'SAR',
      defaultLocale: 'ar-SA',
      timezone: 'Asia/Riyadh',
      foundedAt: null,
      operatingModel: 'ai_first',
      proactiveAiEnabled: true,
      aiCouncilPolicyId: null,
      defaultAiSupervisorId: null,
      aiDecisionThreshold: null,
      registeredAgentCount: null,
      industryVerticals: ['signage'],
      productionModel: 'make_to_order',
      serviceCoverage: 'regional',
      defaultPaymentTerms: null,
      defaultSlaTier: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const org = mapOrganization(row);
    expect(org.code).toBe('LATEEN');
    expect(org.industryVerticals).toEqual(['signage']);
    expect(org.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
