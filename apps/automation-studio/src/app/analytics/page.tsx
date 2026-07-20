'use client';

import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { ExecutionChart } from '@/components/analytics/execution-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalytics, fetchTemplates } from '@/lib/api/client';

export default function AnalyticsPage() {
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });
  const { data: templates } = useQuery({ queryKey: ['templates'], queryFn: fetchTemplates });

  return (
    <StudioShell title="Analytics">
      <div className="grid gap-4 md:grid-cols-2">
        {analytics?.map((a) => (
          <Card key={a.automationId}>
            <CardHeader><CardTitle className="text-sm">{a.automationId}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><div className="text-muted-foreground">Executions</div><div className="text-lg font-semibold">{a.executionCount}</div></div>
                <div><div className="text-muted-foreground">Success</div><div className="text-lg font-semibold">{(a.successRate * 100).toFixed(0)}%</div></div>
                <div><div className="text-muted-foreground">Failures</div><div className="text-lg font-semibold">{(a.failureRate * 100).toFixed(0)}%</div></div>
                <div><div className="text-muted-foreground">Avg Duration</div><div className="text-lg font-semibold">{(a.avgDurationMs / 1000).toFixed(0)}s</div></div>
                <div><div className="text-muted-foreground">Retries</div><div className="text-lg font-semibold">{a.retryCount}</div></div>
              </div>
              <ExecutionChart data={a.dailyExecutions} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Most Used Templates</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {templates?.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center justify-between text-sm">
              <span>{t.name}</span>
              <span className="text-muted-foreground">{t.category} · {t.nodeCount} nodes</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </StudioShell>
  );
}
