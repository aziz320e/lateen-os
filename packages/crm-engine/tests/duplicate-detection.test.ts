import { describe, expect, it } from 'vitest';
import { createCustomerRepository } from '../src/customer/repository.impl.js';
import { createCustomerLifecycle } from '../src/customer/lifecycle.impl.js';
import { createLeadRepository } from '../src/lead/repository.impl.js';
import { createLeadLifecycle } from '../src/lead/lifecycle.impl.js';
import {
  createCrmDuplicateDetectionEngine,
  detectDuplicates,
  normalizeEmail,
  normalizePhone,
  normalizeText,
} from '../src/duplicate-detection/engine.impl.js';

const ORG = 'org-1';

describe('normalization helpers', () => {
  it('normalizeEmail trims and lowercases', () => {
    expect(normalizeEmail('  Jordan@Example.com ')).toBe('jordan@example.com');
  });

  it('normalizePhone strips all non-digits', () => {
    expect(normalizePhone('+1 (555) 123-4567')).toBe('15551234567');
  });

  it('normalizeText lowercases, strips punctuation, and collapses whitespace', () => {
    expect(normalizeText('  Acme, Corp.  ')).toBe('acme corp');
  });
});

describe('detectDuplicates (pure)', () => {
  it('matches on email with the highest weight', () => {
    const existing = [{ name: 'A', email: 'jordan@example.com' }];
    const matches = detectDuplicates(existing, { name: 'Different', email: 'Jordan@Example.com' });
    expect(matches).toHaveLength(1);
    expect(matches[0]?.matchedOn).toEqual(['email']);
    expect(matches[0]?.score).toBeCloseTo(0.5);
  });

  it('accumulates score across multiple matched fields', () => {
    const existing = [{ name: 'Acme Corp', email: 'info@acme.com', phone: '555-1234', company: 'Acme Corp' }];
    const matches = detectDuplicates(existing, { name: 'Acme Corp', email: 'info@acme.com', phone: '555-1234', company: 'Acme Corp' });
    expect(matches[0]?.score).toBeCloseTo(1.0);
    expect(matches[0]?.matchedOn.sort()).toEqual(['company', 'email', 'name', 'phone'].sort());
  });

  it('returns no matches when nothing overlaps', () => {
    const existing = [{ name: 'Acme Corp', email: 'info@acme.com' }];
    const matches = detectDuplicates(existing, { name: 'Globex', email: 'other@globex.com' });
    expect(matches).toHaveLength(0);
  });

  it('sorts matches by score descending', () => {
    const existing = [
      { name: 'Acme Corp' },
      { name: 'Acme Corp', email: 'info@acme.com' },
    ];
    const matches = detectDuplicates(existing, { name: 'Acme Corp', email: 'info@acme.com' });
    expect(matches[0]?.score).toBeGreaterThanOrEqual(matches[1]!.score);
  });
});

describe('createCrmDuplicateDetectionEngine', () => {
  function setup() {
    const customerRepository = createCustomerRepository();
    const customerLifecycle = createCustomerLifecycle(customerRepository);
    const leadRepository = createLeadRepository();
    const leadLifecycle = createLeadLifecycle(leadRepository, customerLifecycle);
    const engine = createCrmDuplicateDetectionEngine(customerRepository, leadRepository);
    return { customerLifecycle, leadLifecycle, engine };
  }

  it('detectCustomerDuplicates() finds a matching active customer', async () => {
    const { customerLifecycle, engine } = setup();
    await customerLifecycle.create(ORG, { name: 'Acme Corp', email: 'info@acme.com' });
    const matches = await engine.detectCustomerDuplicates(ORG, { email: 'info@acme.com' });
    expect(matches).toHaveLength(1);
  });

  it('detectCustomerDuplicates() excludes already-merged customers', async () => {
    const { customerLifecycle, engine } = setup();
    const primary = await customerLifecycle.create(ORG, { name: 'Acme Corp', email: 'existing@acme.com' });
    const duplicate = await customerLifecycle.create(ORG, { name: 'Acme Corp', email: 'info@acme.com' });
    await customerLifecycle.mergeDuplicates(ORG, primary.id, [duplicate.id]);

    const matches = await engine.detectCustomerDuplicates(ORG, { email: 'info@acme.com' });
    expect(matches).toHaveLength(0);
  });

  it('detectLeadDuplicates() finds a matching lead', async () => {
    const { leadLifecycle, engine } = setup();
    await leadLifecycle.create(ORG, { name: 'Jordan Lee', phone: '555-1234' });
    const matches = await engine.detectLeadDuplicates(ORG, { phone: '555-1234' });
    expect(matches).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { customerLifecycle, engine } = setup();
    await customerLifecycle.create(ORG, { name: 'Acme Corp', email: 'info@acme.com' });
    const matches = await engine.detectCustomerDuplicates('org-2', { email: 'info@acme.com' });
    expect(matches).toHaveLength(0);
  });
});
