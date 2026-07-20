'use client';

import { RunDiscoveryDialog } from '@/components/discovery/run-discovery-dialog';

export function Header({ title, description }: { title: string; description?: string }) {
  return (
    <header className="flex items-center justify-between border-b px-8 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <RunDiscoveryDialog />
    </header>
  );
}
