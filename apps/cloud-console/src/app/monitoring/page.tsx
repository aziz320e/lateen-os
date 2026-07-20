'use client';

import { useQuery } from '@tanstack/react-query';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMonitoring } from '@/lib/api/client';

const STATUS_COLOR: Record<string, string> = {
  healthy: 'border-green-500/50 text-green-400',
  degraded: 'border-yellow-500/50 text-yellow-400',
  down: 'border-red-500/50 text-red-400',
};

export default function MonitoringPage() {
  const { data: status } = useQuery({ queryKey: ['monitoring'], queryFn: fetchMonitoring });

  return (
    <ConsoleShell title="Monitoring">
      <div className="grid gap-3 md:grid-cols-2">
        {status?.map((s) => (
          <Card key={s.component}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm capitalize">{s.component.replace(/-/g, ' ')}</CardTitle>
              <Badge className={STATUS_COLOR[s.status] ?? ''}>{s.status}</Badge>
            </CardHeader>
            {(s.latencyMs || s.message) && (
              <CardContent className="text-xs text-muted-foreground">
                {s.latencyMs && `${s.latencyMs}ms`}
                {s.message && ` · ${s.message}`}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </ConsoleShell>
  );
}
