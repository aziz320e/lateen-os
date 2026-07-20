'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWorkflows, workflowAction } from '@/lib/api/client';
import { statusColor } from '@/lib/utils';

export default function WorkflowsPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['workflows'], queryFn: fetchWorkflows });

  if (isLoading) return <Skeleton className="h-64 m-6" />;

  const workflows = (data?.workflows ?? []) as { id: string; name: string; status: string; steps?: number }[];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workflow Console</h1>
          <p className="text-sm text-muted-foreground">Workflow definitions from Business DNA — actions orchestrate Workflow Engine</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => workflowAction('start').then(() => refetch())}>Start</Button>
          <Button variant="secondary" onClick={() => workflowAction('pause').then(() => refetch())}>Pause</Button>
          <Button variant="secondary" onClick={() => workflowAction('resume').then(() => refetch())}>Resume</Button>
          <Button variant="outline" onClick={() => workflowAction('cancel').then(() => refetch())}>Cancel</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Workflow Definitions ({workflows.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {workflows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workflows in Business DNA</p>
          ) : (
            workflows.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium text-sm">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.steps ?? 0} steps · {w.id}</p>
                </div>
                <Badge className={statusColor(w.status)}>{w.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
