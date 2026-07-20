'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMissions, missionAction } from '@/lib/api/client';
import { statusColor } from '@/lib/utils';

export default function MissionsPage() {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['missions'], queryFn: fetchMissions });

  if (isLoading) return <Skeleton className="h-64 m-6" />;

  const groups = data?.groups ?? { running: [], completed: [], paused: [], failed: [] };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mission Console</h1>
          <p className="text-sm text-muted-foreground">Launch Product missions via AI Product Manager</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => missionAction('start', { opportunityTitle: 'New Mission' }).then(() => refetch())}>Start Mission</Button>
          <Button variant="secondary" onClick={() => missionAction('retry').then(() => refetch())}>Retry</Button>
          <Button variant="outline" onClick={() => missionAction('escalate').then(() => refetch())}>Escalate</Button>
        </div>
      </div>

      {(['running', 'completed', 'paused', 'failed'] as const).map((key) => {
        const items = (groups[key] ?? []) as { id: string; title: string; status: string; progress: number }[];
        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="capitalize">{key} ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No {key} missions</p>
              ) : (
                items.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{m.progress}%</span>
                      <Badge className={statusColor(m.status)}>{m.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
