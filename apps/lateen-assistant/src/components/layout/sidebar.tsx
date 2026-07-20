'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Brain,
  GitBranch,
  MessageSquare,
  Rocket,
  Scale,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/', label: 'Chat', icon: MessageSquare },
  { href: '/missions', label: 'Mission Console', icon: Rocket },
  { href: '/workflows', label: 'Workflow Console', icon: GitBranch },
  { href: '/knowledge', label: 'Knowledge Explorer', icon: Search },
  { href: '/memory', label: 'Memory Explorer', icon: Brain },
  { href: '/decisions', label: 'Decision Explorer', icon: Scale },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card/50">
      <div className="flex items-center gap-3 border-b px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">Lateen Assistant</p>
          <p className="text-xs text-muted-foreground">Unified interface</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4 text-xs text-muted-foreground flex items-center gap-2">
        <Bot className="h-4 w-4" />
        Orchestrates platform services — no business logic
      </div>
    </aside>
  );
}
