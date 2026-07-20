'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMemory } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';

export default function MemoryPage() {
  const { data, isLoading } = useQuery({ queryKey: ['memory'], queryFn: () => fetchMemory() });

  if (isLoading) return <Skeleton className="h-64 m-6" />;

  const entries = data?.entries ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Memory Explorer</h1>
        <p className="text-sm text-muted-foreground">Institutional memory aggregated from missions, decisions, policies, and discovery</p>
      </div>

      <div className="grid gap-3">
        {entries.map((e) => (
          <Card key={e.id}>
            <CardHeader className="py-3 flex-row items-center justify-between">
              <CardTitle className="text-base">{e.title}</CardTitle>
              <div className="flex gap-2">
                <Badge>{e.category}</Badge>
                <Badge variant="secondary">{e.source}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{e.summary}</p>
              <p className="text-xs text-muted-foreground mt-2">{formatDate(e.occurredAt)}</p>
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No memory entries yet. Run missions or discovery to populate.</p>}
      </div>
    </div>
  );
}
