'use client';

import { useQuery } from '@tanstack/react-query';
import { CenterShell } from '@/components/layout/center-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchMetrics } from '@/lib/api/client';

export default function MetricsPage() {
  const { data: metrics } = useQuery({ queryKey: ['metrics'], queryFn: () => fetchMetrics() });

  return (
    <CenterShell title="Metrics">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(metrics as { id: string; domain: string; value: number; unit: string }[] | undefined)?.map((m) => (
          <Card key={m.id}>
            <CardHeader><CardTitle className="text-sm">{m.id}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{m.domain} · {m.unit}</p>
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">Start Analytics Platform to load metrics</p>}
      </div>
    </CenterShell>
  );
}
