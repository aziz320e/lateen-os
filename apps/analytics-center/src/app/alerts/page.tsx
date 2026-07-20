'use client';

import { useQuery } from '@tanstack/react-query';
import { CenterShell } from '@/components/layout/center-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchAlerts } from '@/lib/api/client';

export default function AlertsPage() {
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: fetchAlerts });

  const statusColor = (s: string) => s === 'triggered' ? 'border-red-500/50 text-red-400' : s === 'resolved' ? 'border-green-500/50 text-green-400' : '';

  return (
    <CenterShell title="Alerts">
      <p className="mb-4 text-sm text-muted-foreground">Threshold · Trend · Anomaly (contract) · SLA · KPI</p>
      <div className="space-y-3">
        {alerts?.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge>{a.type}</Badge>
                  <span className="text-sm font-medium">{a.message}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Metric: {a.metricId}{a.threshold !== undefined ? ` · Threshold: ${a.threshold}` : ''}</p>
              </div>
              <Badge className={statusColor(a.status)}>{a.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </CenterShell>
  );
}
