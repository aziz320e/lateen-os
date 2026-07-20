'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell, ExtensionCard, SearchBar } from '@/components/layout/app-shell';
import { searchExtensions } from '@/lib/api/client';

const CATEGORIES = [
  'application',
  'service',
  'connector',
  'workflow',
  'mission',
  'ai-worker',
  'industry-pack',
  'dashboard',
  'widget',
  'theme',
];

export default function MarketplaceHomePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', searchTerm, category],
    queryFn: () => searchExtensions(searchTerm, category),
  });

  return (
    <AppShell>
      <section className="border-b bg-gradient-to-b from-primary/10 to-transparent px-6 py-12">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lateen Marketplace</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Discover, install, and publish extensions for Lateen OS. Connectors, workflows, AI workers, and more.
            </p>
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={() => setSearchTerm(query)}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory(undefined)}
              className={`rounded-full border px-3 py-1 text-xs ${!category ? 'border-primary text-primary' : 'text-muted-foreground'}`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full border px-3 py-1 text-xs ${category === cat ? 'border-primary text-primary' : 'text-muted-foreground'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {isLoading && <p className="text-muted-foreground">Loading extensions...</p>}
        {error && <p className="text-destructive">{(error as Error).message}</p>}
        {data && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{data.total} extensions</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.extensions.map((ext) => (
                <ExtensionCard key={ext.id} extension={ext} />
              ))}
            </div>
          </>
        )}
      </section>
    </AppShell>
  );
}
