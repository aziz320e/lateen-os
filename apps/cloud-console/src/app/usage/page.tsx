'use client';

import { useQuery } from '@tanstack/react-query';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchUsage } from '@/lib/api/client';

export default function UsagePage() {
  const { data: usage } = useQuery({ queryKey: ['usage'], queryFn: fetchUsage });

  return (
    <ConsoleShell title="Usage">
      <p className="mb-4 text-sm text-muted-foreground">Users · Storage · API Calls · AI Tokens · Extensions · Connectors · Workers · Workflows · Knowledge · Search</p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {usage?.map((u, i) => (
          <Card key={`${u.tenantId}-${u.metric}-${i}`}>
            <CardHeader><CardTitle className="text-sm">{u.metric}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{u.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{u.tenantId} · {u.unit} · {u.period}</p>
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">No usage data</p>}
      </div>
    </ConsoleShell>
  );
}
