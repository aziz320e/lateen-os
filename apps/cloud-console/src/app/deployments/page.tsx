'use client';

import { useQuery } from '@tanstack/react-query';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDeployments } from '@/lib/api/client';

export default function DeploymentsPage() {
  const { data: deployments } = useQuery({ queryKey: ['deployments'], queryFn: fetchDeployments });

  return (
    <ConsoleShell title="Deployments">
      <p className="mb-4 text-sm text-muted-foreground">Development · Testing · Staging · Production</p>
      <div className="space-y-3">
        {deployments?.map((d) => (
          <Card key={d.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm">{d.tenantName}</CardTitle>
                <p className="text-xs text-muted-foreground">v{d.version} · {d.region}</p>
              </div>
              <div className="flex gap-2">
                <Badge>{d.environment}</Badge>
                <Badge className={d.status === 'running' ? 'border-green-500/50 text-green-400' : ''}>{d.status}</Badge>
              </div>
            </CardHeader>
            {d.deployedAt && <CardContent className="text-xs text-muted-foreground">Deployed {new Date(d.deployedAt).toLocaleString()}</CardContent>}
          </Card>
        ))}
      </div>
    </ConsoleShell>
  );
}
