'use client';

import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { UsageChart } from '@/components/analytics/usage-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalytics } from '@/lib/api/client';

export default function AnalyticsPage() {
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });

  return (
    <StudioShell title="Analytics">
      <div className="grid gap-4 md:grid-cols-2">
        {analytics?.map((a) => (
          <Card key={a.workerId}>
            <CardHeader><CardTitle>{a.workerId}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><div className="text-muted-foreground">Usage</div><div className="text-lg font-semibold">{a.usage}</div></div>
                <div><div className="text-muted-foreground">Tasks</div><div className="text-lg font-semibold">{a.tasks}</div></div>
                <div><div className="text-muted-foreground">Failures</div><div className="text-lg font-semibold">{a.failures}</div></div>
                <div><div className="text-muted-foreground">Latency</div><div className="text-lg font-semibold">{a.avgLatencyMs}ms</div></div>
                <div><div className="text-muted-foreground">Cost</div><div className="text-lg font-semibold">${a.costUsd}</div></div>
                <div><div className="text-muted-foreground">Success</div><div className="text-lg font-semibold">{(a.successRate * 100).toFixed(0)}%</div></div>
              </div>
              <UsageChart data={a.dailyUsage} />
            </CardContent>
          </Card>
        ))}
      </div>
    </StudioShell>
  );
}
