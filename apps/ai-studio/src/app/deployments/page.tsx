'use client';

import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDeployments } from '@/lib/api/client';

export default function DeploymentsPage() {
  const { data: deployments } = useQuery({ queryKey: ['deployments'], queryFn: fetchDeployments });

  return (
    <StudioShell title="Deployments">
      <p className="mb-4 text-sm text-muted-foreground">Draft → Published → Archived · Rollback and versioning contracts</p>
      <div className="space-y-3">
        {deployments?.map((d) => (
          <Card key={d.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{d.workerName}</CardTitle>
                <p className="text-sm text-muted-foreground">Version {d.version} · {d.publishedAt ? new Date(d.publishedAt).toLocaleString() : 'Not published'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{d.status}</Badge>
                {d.status === 'published' && <Button size="sm" variant="outline" disabled>Rollback (stub)</Button>}
              </div>
            </CardHeader>
            {d.publishedBy && <CardContent className="text-xs text-muted-foreground">Published by {d.publishedBy}</CardContent>}
          </Card>
        ))}
      </div>
    </StudioShell>
  );
}
