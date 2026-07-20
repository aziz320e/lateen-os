'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Building2,
  Crown,
  DollarSign,
  FileSearch,
  GitBranch,
  LayoutDashboard,
  Package,
  Rocket,
  Shield,
  Target,
  Users,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navSections = [
  {
    label: 'Executive',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/health', label: 'Company Health', icon: Activity },
      { href: '/risk', label: 'Risk Center', icon: AlertTriangle },
      { href: '/finance', label: 'Finance Overview', icon: DollarSign },
    ],
  },
  {
    label: 'Enterprise',
    items: [
      { href: '/organization', label: 'Organization', icon: Building2 },
      { href: '/business-dna', label: 'Business DNA', icon: GitBranch },
      { href: '/capabilities', label: 'Capabilities', icon: Target },
      { href: '/products', label: 'Products', icon: Package },
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/operations', label: 'Operations', icon: BarChart3 },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/missions', label: 'Mission Control', icon: Rocket },
      { href: '/workforce', label: 'AI Workforce', icon: Bot },
      { href: '/workflows', label: 'Workflow Monitor', icon: Workflow },
      { href: '/decisions', label: 'Decision Center', icon: Shield },
      { href: '/memory', label: 'Institutional Memory', icon: Brain },
    ],
  },
  {
    label: 'Platform',
    items: [
      { href: '/observability', label: 'Observability', icon: Activity },
      { href: '/audit', label: 'Audit Center', icon: FileSearch },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card/50">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">CEO Cockpit</p>
          <p className="text-xs text-muted-foreground">Lateen OS Executive</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t p-4 text-xs text-muted-foreground">
        Visualization only — no business logic
      </div>
    </aside>
  );
}
