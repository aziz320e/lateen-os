import { describe, expect, it } from 'vitest';
import { createBusinessDnaRuntime } from '../src/runtime.js';

const ORG = 'org-1';

function orgInput(code = 'acme') {
  return {
    code,
    name: 'Acme Signage Co.',
    legalName: 'Acme Signage Company LLC',
    registrationNumber: 'REG-001',
    taxId: 'TAX-001',
    defaultCurrency: 'SAR',
    defaultLocale: 'en-SA',
    timezone: 'Asia/Riyadh',
  };
}

describe('createBusinessDnaQueries (via createBusinessDnaRuntime)', () => {
  it('findOrganizations() filters by code, domain, and status', async () => {
    const runtime = createBusinessDnaRuntime();
    const org = await runtime.organization.create({ ...orgInput(), domain: 'acme.com' });
    await runtime.organization.create({ ...orgInput('other'), domain: 'other.com' });

    const byCode = await runtime.queries.findOrganizations({ code: 'acme' });
    expect(byCode.organizations.map((o) => o.id)).toEqual([org.id]);

    const byDomain = await runtime.queries.findOrganizations({ domain: 'acme.com' });
    expect(byDomain.organizations.map((o) => o.id)).toEqual([org.id]);

    const byStatus = await runtime.queries.findOrganizations({ status: 'draft' });
    expect(byStatus.total).toBe(2);

    const all = await runtime.queries.findOrganizations({});
    expect(all.total).toBe(2);
  });

  it('findBusinessProfile() returns the organization singleton', async () => {
    const runtime = createBusinessDnaRuntime();
    const org = await runtime.organization.create(orgInput());
    await runtime.businessProfile.upsert(org.id, {
      displayName: 'Acme',
      legalEntity: {
        legalName: org.legalName,
        entityType: 'llc',
        registrationNumber: org.registrationNumber,
        taxId: org.taxId,
        countryOfIncorporation: 'SA',
      },
    });

    const result = await runtime.queries.findBusinessProfile({ organizationId: org.id });
    expect(result.profile?.displayName).toBe('Acme');
  });

  it('findProducts() filters by category and status', async () => {
    const runtime = createBusinessDnaRuntime();
    const org = await runtime.organization.create(orgInput());
    const product = await runtime.products.createProduct(org.id, {
      code: 'SIGN-001',
      name: 'Channel Letters',
      category: 'signage',
      productionType: 'fabrication',
      unitOfMeasure: 'sqm',
      currency: 'SAR',
    });
    await runtime.products.createProduct(org.id, {
      code: 'BRAND-001',
      name: 'Brand Book',
      category: 'branding',
      productionType: 'print_only',
      unitOfMeasure: 'each',
      currency: 'SAR',
    });

    const byCategory = await runtime.queries.findProducts({ organizationId: org.id, category: 'signage' });
    expect(byCategory.products.map((p) => p.id)).toEqual([product.id]);

    const byStatus = await runtime.queries.findProducts({ organizationId: org.id, status: 'draft' });
    expect(byStatus.total).toBe(2);
  });

  it('findCompetitors() filters by status', async () => {
    const runtime = createBusinessDnaRuntime();
    const org = await runtime.organization.create(orgInput());
    const active = await runtime.competitors.add(org.id, { name: 'Active Co.' });
    const archived = await runtime.competitors.add(org.id, { name: 'Archived Co.' });
    await runtime.competitors.archive(org.id, archived.id);

    const activeOnly = await runtime.queries.findCompetitors({ organizationId: org.id, status: 'active' });
    expect(activeOnly.competitors.map((c) => c.id)).toEqual([active.id]);
  });

  it('findPolicies() filters by type and status', async () => {
    const runtime = createBusinessDnaRuntime();
    const org = await runtime.organization.create(orgInput());
    const policy = await runtime.policies.create(org.id, { code: 'POL-1', name: 'Sales Policy', type: 'sales' });
    await runtime.policies.create(org.id, { code: 'POL-2', name: 'Approval Policy', type: 'approval' });
    await runtime.policies.activate(org.id, policy.id);

    const byType = await runtime.queries.findPolicies({ organizationId: org.id, type: 'sales' });
    expect(byType.policies.map((p) => p.id)).toEqual([policy.id]);

    const byStatus = await runtime.queries.findPolicies({ organizationId: org.id, status: 'active' });
    expect(byStatus.policies.map((p) => p.id)).toEqual([policy.id]);
  });

  it('findMarkets() returns the organization singleton', async () => {
    const runtime = createBusinessDnaRuntime();
    const org = await runtime.organization.create(orgInput());
    await runtime.market.addOperatingMarket(org.id, {
      countryCode: 'SA',
      countryName: 'Saudi Arabia',
      currency: 'SAR',
    });

    const result = await runtime.queries.findMarkets({ organizationId: org.id });
    expect(result.market?.operatingMarkets).toHaveLength(1);
  });

  it('does not expose repositories on the runtime surface', () => {
    const runtime = createBusinessDnaRuntime();
    expect((runtime as Record<string, unknown>).organizationRepository).toBeUndefined();
    expect((runtime as Record<string, unknown>).productRepository).toBeUndefined();
    expect(Object.keys(runtime).sort()).toEqual(
      ['businessProfile', 'competitors', 'dna', 'events', 'market', 'organization', 'policies', 'products', 'queries', 'visionMission'].sort(),
    );
  });
});
