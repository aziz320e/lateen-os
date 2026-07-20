'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchActivity, fetchRuntimeTasks } from '@/lib/api/client';
import { runtimeMetrics } from '@/lib/runtime-metrics';
import { cn, formatDate, statusColor } from '@/lib/utils';

export default function ActivityPage() {
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['runtime-tasks'],
    queryFn: fetchRuntimeTasks,
  });
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: fetchActivity,
  });

  const metrics = runtimeMetrics(tasks ?? []);

  return (
    <div>
      <Header title="AI Activity Timeline" description="Runtime tasks, execution status, and agent activity" />
      <div className="grid gap-6 p-8 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Execution Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <MetricRow label="Total tasks" value={metrics.total} />
            <MetricRow label="Running" value={metrics.running} />
            <MetricRow label="Completed" value={metrics.completed} />
            <MetricRow label="Failed" value={metrics.failed} />
            <MetricRow label="Success rate" value={`${metrics.successRate}%`} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Task History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksLoading ? <Skeleton className="h-20" /> : null}
            {tasks?.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-muted-foreground">{formatDate(task.updatedAt)}</p>
                </div>
                <Badge className={cn(statusColor(task.status))}>{task.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLoading ? <Skeleton className="h-32" /> : null}
            {activity?.map((event) => (
              <div key={event.id} className="flex gap-4 border-l-2 border-primary/30 pl-4">
                <div className="flex-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <Badge className={cn(statusColor(event.status))}>{event.type}</Badge>
                  <p className="mt-1">{formatDate(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
