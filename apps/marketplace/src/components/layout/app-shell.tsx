'use client';

import Link from 'next/link';
import { Package, Search, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Store className="h-5 w-5 text-primary" />
            Lateen Marketplace
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Browse
            </Link>
            <Link href="/publishers" className="hover:text-foreground">
              Publishers
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function ExtensionCard({
  extension,
  className,
}: {
  extension: import('@/types').ExtensionListing;
  className?: string;
}) {
  return (
    <Link href={`/extensions/${extension.extensionId}`}>
      <CardWrapper className={cn('transition hover:border-primary/50', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{extension.manifest.displayName}</h3>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{extension.manifest.description}</p>
            <div className="flex flex-wrap gap-2">
              <BadgePill>{extension.category}</BadgePill>
              <BadgePill>v{extension.manifest.version}</BadgePill>
              {extension.tags.slice(0, 2).map((tag) => (
                <BadgePill key={tag}>{tag}</BadgePill>
              ))}
            </div>
          </div>
        </div>
      </CardWrapper>
    </Link>
  );
}

function CardWrapper({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-lg border bg-card p-5 shadow-sm', className)}>{children}</div>;
}

function BadgePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{children}</span>
  );
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="relative max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search extensions, connectors, AI workers..."
        className="h-11 w-full rounded-lg border bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </form>
  );
}
