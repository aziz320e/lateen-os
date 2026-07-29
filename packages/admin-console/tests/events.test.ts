import { describe, expect, it } from 'vitest';
import { ADMIN_EVENT_NAMES, createAdminEventBus } from '../src/events/index.js';

describe('AdminEventBus', () => {
  it('publishes and delivers events by name', () => {
    const bus = createAdminEventBus();
    let seen: unknown;
    bus.subscribe('organization.created', (payload) => (seen = payload));
    bus.publish('organization.created', { organizationId: 'org-1', name: 'Acme Co' });
    expect(seen).toEqual({ organizationId: 'org-1', name: 'Acme Co' });
  });

  it('subscribeAll() receives every event regardless of name', () => {
    const bus = createAdminEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('tenant.created', { organizationId: 'org-1', tenantId: 'tenant-1', name: 'Tenant One' });
    bus.publish('user.created', { organizationId: 'org-1', userId: 'user-1', email: 'a@b.com' });
    expect(names).toEqual(['tenant.created', 'user.created']);
  });

  it('unsubscribe stops delivery', () => {
    const bus = createAdminEventBus();
    let count = 0;
    const unsubscribe = bus.subscribe('role.created', () => (count += 1));
    bus.publish('role.created', { organizationId: 'org-1', roleId: 'role-1', name: 'Admin' });
    unsubscribe();
    bus.publish('role.created', { organizationId: 'org-1', roleId: 'role-1', name: 'Admin' });
    expect(count).toBe(1);
  });

  it('delivers settings.updated with its payload', () => {
    const bus = createAdminEventBus();
    let seen: unknown;
    bus.subscribe('settings.updated', (payload) => (seen = payload));
    bus.publish('settings.updated', { organizationId: 'org-1', settingId: 'setting-1', key: 'theme', scope: 'organization' });
    expect(seen).toEqual({ organizationId: 'org-1', settingId: 'setting-1', key: 'theme', scope: 'organization' });
  });

  it('delivers feature.enabled and feature.disabled with their payloads', () => {
    const bus = createAdminEventBus();
    const seen: unknown[] = [];
    bus.subscribe('feature.enabled', (payload) => seen.push(payload));
    bus.subscribe('feature.disabled', (payload) => seen.push(payload));
    bus.publish('feature.enabled', { organizationId: 'org-1', featureFlagId: 'flag-1', key: 'new-ui' });
    bus.publish('feature.disabled', { organizationId: 'org-1', featureFlagId: 'flag-1', key: 'new-ui' });
    expect(seen).toHaveLength(2);
  });

  it('delivers audit.recorded with its payload', () => {
    const bus = createAdminEventBus();
    let seen: unknown;
    bus.subscribe('audit.recorded', (payload) => (seen = payload));
    bus.publish('audit.recorded', { organizationId: 'org-1', auditEntryId: 'audit-1', action: 'user.suspended' });
    expect(seen).toEqual({ organizationId: 'org-1', auditEntryId: 'audit-1', action: 'user.suspended' });
  });

  it('delivers dashboard.generated with its payload', () => {
    const bus = createAdminEventBus();
    let seen: unknown;
    bus.subscribe('dashboard.generated', (payload) => (seen = payload));
    bus.publish('dashboard.generated', { organizationId: 'org-1', dashboardSnapshotId: 'dashboard-1' });
    expect(seen).toEqual({ organizationId: 'org-1', dashboardSnapshotId: 'dashboard-1' });
  });

  it('delivers configuration.updated with its payload', () => {
    const bus = createAdminEventBus();
    let seen: unknown;
    bus.subscribe('configuration.updated', (payload) => (seen = payload));
    bus.publish('configuration.updated', { organizationId: 'org-1', runtimeConfigId: 'config-1', key: 'max_upload_mb' });
    expect(seen).toEqual({ organizationId: 'org-1', runtimeConfigId: 'config-1', key: 'max_upload_mb' });
  });

  it('multiple independent subscribers to the same event all receive it', () => {
    const bus = createAdminEventBus();
    let countA = 0;
    let countB = 0;
    bus.subscribe('organization.created', () => (countA += 1));
    bus.subscribe('organization.created', () => (countB += 1));
    bus.publish('organization.created', { organizationId: 'org-1', name: 'Acme Co' });
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });

  it('a subscriber to one event name is not invoked for a different event', () => {
    const bus = createAdminEventBus();
    let calls = 0;
    bus.subscribe('organization.created', () => (calls += 1));
    bus.publish('tenant.created', { organizationId: 'org-1', tenantId: 'tenant-1', name: 'Tenant One' });
    expect(calls).toBe(0);
  });

  it('unsubscribing one subscriber does not affect another subscriber to the same event', () => {
    const bus = createAdminEventBus();
    let countA = 0;
    let countB = 0;
    const unsubscribeA = bus.subscribe('organization.created', () => (countA += 1));
    bus.subscribe('organization.created', () => (countB += 1));
    unsubscribeA();
    bus.publish('organization.created', { organizationId: 'org-1', name: 'Acme Co' });
    expect(countA).toBe(0);
    expect(countB).toBe(1);
  });

  it('delivers tenant.created with its payload', () => {
    const bus = createAdminEventBus();
    let seen: unknown;
    bus.subscribe('tenant.created', (payload) => (seen = payload));
    bus.publish('tenant.created', { organizationId: 'org-1', tenantId: 'tenant-1', name: 'Tenant One' });
    expect(seen).toEqual({ organizationId: 'org-1', tenantId: 'tenant-1', name: 'Tenant One' });
  });

  it('delivers user.created with its payload', () => {
    const bus = createAdminEventBus();
    let seen: unknown;
    bus.subscribe('user.created', (payload) => (seen = payload));
    bus.publish('user.created', { organizationId: 'org-1', userId: 'user-1', email: 'a@b.com' });
    expect(seen).toEqual({ organizationId: 'org-1', userId: 'user-1', email: 'a@b.com' });
  });

  it('delivers role.created with its payload', () => {
    const bus = createAdminEventBus();
    let seen: unknown;
    bus.subscribe('role.created', (payload) => (seen = payload));
    bus.publish('role.created', { organizationId: 'org-1', roleId: 'role-1', name: 'Admin' });
    expect(seen).toEqual({ organizationId: 'org-1', roleId: 'role-1', name: 'Admin' });
  });

  it('subscribeAll() receives events published across every one of the 10 event names', () => {
    const bus = createAdminEventBus();
    const names: string[] = [];
    bus.subscribeAll((name) => names.push(name));
    bus.publish('organization.created', { organizationId: 'org-1', name: 'A' });
    bus.publish('settings.updated', { organizationId: 'org-1', settingId: 's1', key: 'k', scope: 'global' });
    bus.publish('audit.recorded', { organizationId: 'org-1', auditEntryId: 'a1', action: 'x' });
    expect(names).toEqual(['organization.created', 'settings.updated', 'audit.recorded']);
  });

  it('a bus with no subscribers at all does not throw on publish', () => {
    const bus = createAdminEventBus();
    expect(() => bus.publish('organization.created', { organizationId: 'org-1', name: 'A' })).not.toThrow();
  });

  it('delivers organization.created with its payload exactly once per publish', () => {
    const bus = createAdminEventBus();
    const seen: unknown[] = [];
    bus.subscribe('organization.created', (payload) => seen.push(payload));
    bus.publish('organization.created', { organizationId: 'org-1', name: 'Acme' });
    expect(seen).toHaveLength(1);
  });

  it('subscribing after a publish does not retroactively receive that event', () => {
    const bus = createAdminEventBus();
    bus.publish('organization.created', { organizationId: 'org-1', name: 'Acme' });
    let count = 0;
    bus.subscribe('organization.created', () => (count += 1));
    expect(count).toBe(0);
  });

  it('delivers configuration.updated to subscribeAll as well as a direct subscriber', () => {
    const bus = createAdminEventBus();
    let direct: unknown;
    const names: string[] = [];
    bus.subscribe('configuration.updated', (payload) => (direct = payload));
    bus.subscribeAll((name) => names.push(name));
    bus.publish('configuration.updated', { organizationId: 'org-1', runtimeConfigId: 'c1', key: 'max_upload_mb' });
    expect(direct).toEqual({ organizationId: 'org-1', runtimeConfigId: 'c1', key: 'max_upload_mb' });
    expect(names).toEqual(['configuration.updated']);
  });

  it('subscribeAll unsubscribe stops delivery of every event', () => {
    const bus = createAdminEventBus();
    const names: string[] = [];
    const unsubscribe = bus.subscribeAll((name) => names.push(name));
    unsubscribe();
    bus.publish('organization.created', { organizationId: 'org-1', name: 'Acme' });
    expect(names).toEqual([]);
  });

  it('publishing the same event twice invokes a persistent subscriber twice', () => {
    const bus = createAdminEventBus();
    let count = 0;
    bus.subscribe('audit.recorded', () => (count += 1));
    bus.publish('audit.recorded', { organizationId: 'org-1', auditEntryId: 'a1', action: 'login' });
    bus.publish('audit.recorded', { organizationId: 'org-1', auditEntryId: 'a2', action: 'logout' });
    expect(count).toBe(2);
  });

  it('ADMIN_EVENT_NAMES exposes all 10 canonical event names', () => {
    expect(Object.values(ADMIN_EVENT_NAMES)).toEqual([
      'organization.created',
      'tenant.created',
      'user.created',
      'role.created',
      'settings.updated',
      'feature.enabled',
      'feature.disabled',
      'audit.recorded',
      'dashboard.generated',
      'configuration.updated',
    ]);
  });
});
