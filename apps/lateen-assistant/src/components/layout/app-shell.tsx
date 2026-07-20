'use client';

import { CommandPalette } from '@/components/layout/command-palette';
import { Sidebar } from '@/components/layout/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b px-6 bg-card/30">
          <p className="text-sm text-muted-foreground">Lateen OS · Primary interaction layer</p>
          <CommandPalette />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
