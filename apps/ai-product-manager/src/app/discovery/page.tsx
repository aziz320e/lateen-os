'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDiscoveryRuns } from '@/lib/api/client';
import { cn, formatDate, statusColor } from '@/lib/utils';

const STAGES = [
  'collect_signals',
  'normalize',
  'rank',
  'capability_matching',
  'profit_estimation',
  'decision_submission',
  'recommendation',
];

function stageProgress(currentStage?: string, status?: string): number {
  if (status === 'completed') return 100;
  if (status === 'failed') return 0;
  const index = STAGES.indexOf(currentStage ?? 'collect_signals');
  return Math.round(((index + 1) / STAGES.length) * 100);
}

export default function DiscoveryRunsPage() {
  const { data: runs, isLoading, error } = useQuery({
    queryKey: ['discovery-runs'],
    queryFn: fetchDiscoveryRuns,
  });

  return (
    <div>
      <Header title="Discovery Runs" description="Product discovery pipeline executions" />
      <div className="space-y-4 p-8">
        {isLoading ? <Skeleton className="h-40" /> : null}
        {error ? <p className="text-destructive">{(error as Error).message}</p> : null}
        {runs?.map((run) => (
          <Card key={run.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  <Link href={`/discovery/${run.id}`} className="hover:text-primary">
                    Run {run.id.slice(0, 8)}…
                  </Link>
                </CardTitle>
                <p className="text-sm text-muted-foreground">Started {formatDate(run.startedAt)}</p>
              </div>
              <Badge className={cn(statusColor(run.status))}>{run.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Stage: {run.currentStage ?? '—'}</p>
                <Progress value={stageProgress(run.currentStage, run.status)} />
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{run.collectSignals?.signals.length ?? 0} signals</span>
                <span>{run.recommendation?.recommendations.length ?? 0} recommendations</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && !runs?.length ? (
          <p className="text-muted-foreground">No discovery runs yet. Start one from the header.</p>
        ) : null}
      </div>
    </div>
  );
}
