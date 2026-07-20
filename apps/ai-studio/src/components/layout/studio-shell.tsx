'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Sparkles } from 'lucide-react';
import { STUDIO_SECTIONS } from '@/lib/types/studio';
import { cn } from '@/lib/utils';

export function StudioShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r bg-card/50 p-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Studio</span>
        </div>
        <nav className="space-y-0.5">
          {STUDIO_SECTIONS.map((s) => {
            const active = s.href === '/' ? pathname === '/' : pathname.startsWith(s.href);
            return (
              <Link
                key={s.id}
                href={s.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-sm transition',
                  active ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {s.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="border-b bg-card/30 px-6 py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">{title ?? 'AI Studio'}</h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Design only — execution via AI Runtime · management via AI Workforce</p>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
