'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDiscoveryRuns } from '@/lib/api/client';
import { formatPercent } from '@/lib/utils';

export default function SignalsPage() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['discovery-runs'],
    queryFn: fetchDiscoveryRuns,
  });

  const signals = runs?.flatMap((run) =>
    (run.collectSignals?.signals ?? []).map((signal) => ({ ...signal, runId: run.id })),
  ) ?? [];

  return (
    <div>
      <Header title="Trend Signals" description="Market signals collected across discovery sources" />
      <div className="grid gap-4 p-8 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? <Skeleton className="h-40" /> : null}
        {signals.map((signal) => (
          <Card key={signal.signalId}>
            <CardHeader>
              <CardTitle className="text-base">{signal.title}</CardTitle>
              <div className="flex gap-2">
                <Badge className="bg-secondary">{signal.source}</Badge>
                <Badge className="bg-primary/15 text-primary">{signal.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>Keyword: {signal.keyword ?? '—'}</p>
              <p>Strength: {formatPercent(signal.strength)}</p>
              <p className="text-muted-foreground">Run: {signal.runId.slice(0, 8)}…</p>
            </CardContent>
          </Card>
        ))}
        {!isLoading && !signals.length ? (
          <p className="text-muted-foreground">No trend signals collected yet.</p>
        ) : null}
      </div>
    </div>
  );
}
