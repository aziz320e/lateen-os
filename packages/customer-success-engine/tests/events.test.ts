import { describe, expect, it } from 'vitest';
import { createCustomerSuccessEventBus, CUSTOMER_SUCCESS_EVENT_NAMES } from '../src/events/index.js';

describe('CustomerSuccessEventBus', () => {
  it('publishes and delivers events by name', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('customer.onboarded', (payload) => (seen = payload));
    bus.publish('customer.onboarded', { organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
    expect(seen).toEqual({ organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
  });

  it('subscribeAll() receives every event regardless of name', () => {
    const bus = createCustomerSuccessEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('customer.activated', { organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
    bus.publish('customer.churned', { organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
    expect(names).toEqual(['customer.activated', 'customer.churned']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createCustomerSuccessEventBus();
    let count = 0;
    const unsubscribe = bus.subscribe('feedback.received', () => (count += 1));
    bus.publish('feedback.received', { organizationId: 'org-1', feedbackEntryId: 'entry-1', customerId: 'customer-1', feedbackType: 'nps' });
    unsubscribe();
    bus.publish('feedback.received', { organizationId: 'org-1', feedbackEntryId: 'entry-1', customerId: 'customer-1', feedbackType: 'nps' });
    expect(count).toBe(1);
  });

  it('delivers customer.health.updated with its payload', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('customer.health.updated', (payload) => (seen = payload));
    bus.publish('customer.health.updated', { organizationId: 'org-1', healthSnapshotId: 'snap-1', customerId: 'customer-1', overallScore: 80, tier: 'healthy' });
    expect(seen).toEqual({ organizationId: 'org-1', healthSnapshotId: 'snap-1', customerId: 'customer-1', overallScore: 80, tier: 'healthy' });
  });

  it('delivers renewal.created with its payload', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('renewal.created', (payload) => (seen = payload));
    bus.publish('renewal.created', { organizationId: 'org-1', renewalId: 'renewal-1', customerId: 'customer-1', renewalDate: '2026-06-01' });
    expect(seen).toEqual({ organizationId: 'org-1', renewalId: 'renewal-1', customerId: 'customer-1', renewalDate: '2026-06-01' });
  });

  it('delivers renewal.completed with its payload', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('renewal.completed', (payload) => (seen = payload));
    bus.publish('renewal.completed', { organizationId: 'org-1', renewalId: 'renewal-1', customerId: 'customer-1', outcome: 'won' });
    expect(seen).toEqual({ organizationId: 'org-1', renewalId: 'renewal-1', customerId: 'customer-1', outcome: 'won' });
  });

  it('delivers customer.reactivated with its payload', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('customer.reactivated', (payload) => (seen = payload));
    bus.publish('customer.reactivated', { organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
    expect(seen).toEqual({ organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
  });

  it('delivers successplan.completed with its payload', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('successplan.completed', (payload) => (seen = payload));
    bus.publish('successplan.completed', { organizationId: 'org-1', planId: 'plan-1', customerId: 'customer-1' });
    expect(seen).toEqual({ organizationId: 'org-1', planId: 'plan-1', customerId: 'customer-1' });
  });

  it('delivers risk.detected with its payload', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('risk.detected', (payload) => (seen = payload));
    bus.publish('risk.detected', { organizationId: 'org-1', riskId: 'risk-1', customerId: 'customer-1', score: 12 });
    expect(seen).toEqual({ organizationId: 'org-1', riskId: 'risk-1', customerId: 'customer-1', score: 12 });
  });

  it('multiple independent subscribers to the same event all receive it', () => {
    const bus = createCustomerSuccessEventBus();
    let countA = 0;
    let countB = 0;
    bus.subscribe('customer.onboarded', () => (countA += 1));
    bus.subscribe('customer.onboarded', () => (countB += 1));
    bus.publish('customer.onboarded', { organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });

  it('delivers customer.churned with its payload', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('customer.churned', (payload) => (seen = payload));
    bus.publish('customer.churned', { organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
    expect(seen).toEqual({ organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
  });

  it('delivers customer.activated with its payload', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('customer.activated', (payload) => (seen = payload));
    bus.publish('customer.activated', { organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
    expect(seen).toEqual({ organizationId: 'org-1', customerSuccessRecordId: 'record-1', customerId: 'customer-1' });
  });

  it('delivers feedback.received with its payload', () => {
    const bus = createCustomerSuccessEventBus();
    let seen: unknown;
    bus.subscribe('feedback.received', (payload) => (seen = payload));
    bus.publish('feedback.received', { organizationId: 'org-1', feedbackEntryId: 'entry-1', customerId: 'customer-1', feedbackType: 'csat' });
    expect(seen).toEqual({ organizationId: 'org-1', feedbackEntryId: 'entry-1', customerId: 'customer-1', feedbackType: 'csat' });
  });

  it('multiple event names can be subscribed to independently on the same bus', () => {
    const bus = createCustomerSuccessEventBus();
    const seen: string[] = [];
    bus.subscribe('renewal.created', () => seen.push('created'));
    bus.subscribe('renewal.completed', () => seen.push('completed'));
    bus.publish('renewal.created', { organizationId: 'org-1', renewalId: 'r1', customerId: 'c1', renewalDate: '2026-01-01' });
    bus.publish('renewal.completed', { organizationId: 'org-1', renewalId: 'r1', customerId: 'c1', outcome: 'won' });
    expect(seen).toEqual(['created', 'completed']);
  });

  it('CUSTOMER_SUCCESS_EVENT_NAMES values are unique', () => {
    const values = Object.values(CUSTOMER_SUCCESS_EVENT_NAMES);
    expect(new Set(values).size).toBe(values.length);
  });

  it('CUSTOMER_SUCCESS_EVENT_NAMES exposes all 10 canonical event names', () => {
    expect(Object.values(CUSTOMER_SUCCESS_EVENT_NAMES)).toEqual([
      'customer.onboarded',
      'customer.activated',
      'customer.health.updated',
      'renewal.created',
      'renewal.completed',
      'customer.churned',
      'customer.reactivated',
      'feedback.received',
      'successplan.completed',
      'risk.detected',
    ]);
  });
});
