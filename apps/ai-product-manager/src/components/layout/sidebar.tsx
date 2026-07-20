'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Bot,
  CheckCircle2,
  Compass,
  DollarSign,
  LayoutDashboard,
  Radio,
  Sparkles,
  Rocket,
  Target,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/missions', label: 'Launch Product', icon: Rocket },
  { href: '/discovery', label: 'Discovery Runs', icon: Compass },
  { href: '/recommendations', label: 'Recommendations', icon: Sparkles },
  { href: '/signals', label: 'Trend Signals', icon: TrendingUp },
  { href: '/capabilities', label: 'Capability Matches', icon: Target },
  { href: '/profit', label: 'Profit Estimates', icon: DollarSign },
  { href: '/decisions', label: 'Decision Status', icon: CheckCircle2 },
  { href: '/activity', label: 'AI Activity', icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card/50">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">AI Product Manager</p>
          <p className="text-xs text-muted-foreground">Lateen OS Worker</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
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
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
          <Radio className="h-3.5 w-3.5 text-emerald-400" />
          <span>Recommendations only — no execution</span>
        </div>
        <div className="mt-2 flex items-center gap-2 px-3 text-xs text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5" />
          Decision Engine integration
        </div>
      </div>
    </aside>
  );
}
