'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDiscoveryRun } from '@/lib/api/client';
import { cn, formatDate, statusColor } from '@/lib/utils';

export default function DiscoveryRunDetailPage() {
  const params = useParams<{ runId: string }>();
  const { data: run, isLoading, error } = useQuery({
    queryKey: ['discovery-run', params.runId],
    queryFn: () => fetchDiscoveryRun(params.runId),
    enabled: Boolean(params.runId),
  });

  return (
    <div>
      <Header title="Discovery Run Detail" description={params.runId} />
      <div className="space-y-4 p-8">
        {isLoading ? <Skeleton className="h-60" /> : null}
        {error ? <p className="text-destructive">{(error as Error).message}</p> : null}
        {run ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pipeline Status</CardTitle>
                  <Badge className={cn(statusColor(run.status))}>{run.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <p>Started: {formatDate(run.startedAt)}</p>
                <p>Completed: {formatDate(run.completedAt)}</p>
                <p>Current stage: {run.currentStage ?? '—'}</p>
                {run.errorMessage ? <p className="text-destructive">{run.errorMessage}</p> : null}
              </CardContent>
            </Card>

            {run.decisionSubmission ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Decision Submission</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="font-medium">{run.decisionSubmission.submission.title}</p>
                  <p className="text-muted-foreground">{run.decisionSubmission.submission.summary}</p>
                  <Badge className={cn(statusColor(run.decisionSubmission.submission.status))}>
                    {run.decisionSubmission.submission.status}
                  </Badge>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
