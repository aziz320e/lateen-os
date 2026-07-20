export const CONSOLE_SECTIONS = [
  { id: 'overview', label: 'Overview', href: '/' },
  { id: 'organizations', label: 'Organizations', href: '/organizations' },
  { id: 'tenants', label: 'Tenants', href: '/tenants' },
  { id: 'plans', label: 'Plans', href: '/plans' },
  { id: 'usage', label: 'Usage', href: '/usage' },
  { id: 'deployments', label: 'Deployments', href: '/deployments' },
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace' },
  { id: 'support', label: 'Support', href: '/support' },
  { id: 'monitoring', label: 'Monitoring', href: '/monitoring' },
  { id: 'billing', label: 'Billing', href: '/billing' },
  { id: 'settings', label: 'Settings', href: '/settings' },
] as const;

export const SUBSCRIPTION_PLANS = ['community', 'starter', 'professional', 'enterprise', 'partner'] as const;
