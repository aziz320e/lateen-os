export const CENTER_SECTIONS = [
  { id: 'home', label: 'Overview', href: '/' },
  { id: 'dashboards', label: 'Dashboards', href: '/dashboards' },
  { id: 'reports', label: 'Reports', href: '/reports' },
  { id: 'alerts', label: 'Alerts', href: '/alerts' },
  { id: 'exports', label: 'Exports', href: '/exports' },
  { id: 'metrics', label: 'Metrics', href: '/metrics' },
] as const;

export const DASHBOARD_IDS = [
  'ceo', 'finance', 'operations', 'sales', 'production',
  'warehouse', 'customer-success', 'ai-operations', 'platform-health', 'marketplace',
] as const;
