import { describe, expect, it } from 'vitest';
import { filterByCustomer, assertCustomerOwnership } from '@/lib/auth';

describe('tenant isolation', () => {
  const customerId = 'cust-001';

  it('filterByCustomer returns only matching records', () => {
    const items = [
      { id: '1', customerId: 'cust-001' },
      { id: '2', customerId: 'cust-002' },
      { id: '3', customerId: 'cust-001' },
    ];
    const result = filterByCustomer(items, customerId);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.customerId === customerId)).toBe(true);
  });

  it('assertCustomerOwnership passes for owned entity', () => {
    expect(() => assertCustomerOwnership({ customerId: 'cust-001' }, customerId, 'project')).not.toThrow();
  });

  it('assertCustomerOwnership throws for foreign entity', () => {
    expect(() => assertCustomerOwnership({ customerId: 'cust-002' }, customerId, 'project')).toThrow('Access denied');
  });
});
