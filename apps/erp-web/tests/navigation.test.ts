import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, visibleNavItems } from '../src/lib/navigation';

describe('Role-based navigation / permission-aware UI', () => {
  it('hides CRM and Finance from a user with no domain permissions', () => {
    const items = visibleNavItems([]);
    expect(items.some((item) => item.label === 'CRM')).toBe(false);
    expect(items.some((item) => item.label === 'Finance')).toBe(false);
    // Ungated items (Dashboard, Sales, Settings, ...) remain visible to any authenticated user.
    expect(items.some((item) => item.label === 'Dashboard')).toBe(true);
    expect(items.some((item) => item.label === 'Settings')).toBe(true);
  });

  it('shows CRM only to a user holding crm:read, without unlocking Finance too', () => {
    const items = visibleNavItems(['crm:read']);
    expect(items.some((item) => item.label === 'CRM')).toBe(true);
    expect(items.some((item) => item.label === 'Finance')).toBe(false);
  });

  it('grants every nav item to a platform:admin permission holder', () => {
    const items = visibleNavItems(['platform:admin']);
    expect(items).toHaveLength(NAV_ITEMS.length);
  });
});
