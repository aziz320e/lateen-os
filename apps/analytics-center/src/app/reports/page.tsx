'use client';

import { useQuery } from '@tanstack/react-query';
import { CenterShell } from '@/components/layout/center-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchReports } from '@/lib/api/client';

export default function ReportsPage() {
  const { data: reports } = useQuery({ queryKey: ['reports'], queryFn: fetchReports });

  return (
    <CenterShell title="Reports">
      <p className="mb-4 text-sm text-muted-foreground">Daily · Weekly · Monthly · Quarterly · Yearly · Custom</p>
      <div className="grid gap-3 md:grid-cols-2">
        {reports?.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm">{r.name}</CardTitle>
              <Badge>{r.period}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Domain: {r.domain}</p>
              <p className="mt-1 text-xs text-muted-foreground">Metrics: {r.metrics.join(', ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </CenterShell>
  );
}
