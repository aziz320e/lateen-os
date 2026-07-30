import {
  BarChart3,
  Boxes,
  Briefcase,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  Receipt,
  Settings,
  TrendingUp,
  Users,
  UsersRound,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Permission code required to see this item (checked against the current session's real, backend-issued JWT permissions). Omitted = visible to any authenticated user. */
  requiredPermission?: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'CRM', href: '/crm', icon: Users, requiredPermission: 'crm:read' },
  { label: 'Sales', href: '/sales', icon: TrendingUp },
  { label: 'Finance', href: '/finance', icon: Receipt, requiredPermission: 'finance:read' },
  { label: 'Inventory', href: '/inventory', icon: Boxes },
  { label: 'Projects', href: '/projects', icon: Briefcase },
  { label: 'HR', href: '/hr', icon: UsersRound },
  { label: 'Customer Success', href: '/customer-success', icon: HeartHandshake },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

/** Filters nav items down to what the current session's real permissions allow. `platform:admin` sees everything. */
export function visibleNavItems(permissions: readonly string[]): readonly NavItem[] {
  if (permissions.includes('platform:admin')) return NAV_ITEMS;
  return NAV_ITEMS.filter(
    (item) => !item.requiredPermission || permissions.includes(item.requiredPermission),
  );
}
