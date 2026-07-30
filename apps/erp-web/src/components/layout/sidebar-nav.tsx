'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { visibleNavItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export function SidebarNav({
  onNavigate,
  permissions,
}: {
  onNavigate?: () => void;
  permissions: readonly string[];
}) {
  const pathname = usePathname();
  const items = visibleNavItems(permissions);

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
