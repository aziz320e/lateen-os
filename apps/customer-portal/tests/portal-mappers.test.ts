import { describe, expect, it } from 'vitest';
import { buildDashboard, buildAssistantReply } from '@/lib/api/portal-mappers';

describe('portal mappers', () => {
  it('buildDashboard computes counts', () => {
    const dashboard = buildDashboard(
      [{ id: 'p1', customerId: 'c1', status: 'production', name: 'P', code: 'P1', updatedAt: '2026-01-01', createdAt: '2026-01-01' } as never],
      [{ id: 'q1', customerId: 'c1', status: 'sent', number: 'Q1', updatedAt: '2026-01-01' } as never],
      [{ id: 'o1', customerId: 'c1', status: 'in_progress', number: 'O1', updatedAt: '2026-01-01' } as never],
      [{ id: 'i1', customerId: 'c1', status: 'issued', number: 'I1', amountDue: '100', total: '100', updatedAt: '2026-01-01' } as never],
    );
    expect(dashboard.openProjects).toBe(1);
    expect(dashboard.pendingQuotations).toBe(1);
    expect(dashboard.runningOrders).toBe(1);
    expect(dashboard.invoicesDue).toBe(1);
  });

  it('buildAssistantReply uses customer-safe language', () => {
    const reply = buildAssistantReply('help', [], [], []);
    expect(reply).toContain('account');
    expect(reply).toContain('never shared');
  });
});
