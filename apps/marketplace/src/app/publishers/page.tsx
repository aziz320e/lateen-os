'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { fetchPublishers } from '@/lib/api/client';

export default function PublishersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['publishers'],
    queryFn: fetchPublishers,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-bold">Publishers</h1>
        <p className="mt-2 text-muted-foreground">Verified extension publishers on Lateen Marketplace</p>

        {isLoading && <p className="mt-8 text-muted-foreground">Loading...</p>}
        {error && <p className="mt-8 text-destructive">{(error as Error).message}</p>}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {data?.map((publisher) => (
            <Link
              key={publisher.id}
              href={`/?publisher=${publisher.slug}`}
              className="rounded-lg border bg-card p-5 transition hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{publisher.displayName}</h2>
                <Badge>{publisher.verification}</Badge>
              </div>
              {publisher.description && (
                <p className="mt-2 text-sm text-muted-foreground">{publisher.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
