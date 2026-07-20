'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchExecutions } from '@/lib/api/client';

export default function ExecutionsPage() {
  const { data: executions } = useQuery({ queryKey: ['executions'], queryFn: fetchExecutions });

  return (
    <StudioShell title="Executions">
      <p className="mb-4 text-sm text-muted-foreground">Read-only execution view — runs via Workflow Engine</p>
      <div className="space-y-3">
        {executions?.map((e) => (
          <Link key={e.id} href={`/executions/${e.id}`}>
            <Card className="hover:bg-muted/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm">{e.automationName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{new Date(e.startedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={e.status === 'completed' ? 'border-green-500/50 text-green-400' : e.status === 'failed' ? 'border-red-500/50 text-red-400' : ''}>{e.status}</Badge>
                  {e.durationMs && <span className="text-xs text-muted-foreground">{(e.durationMs / 1000).toFixed(1)}s</span>}
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{e.steps.length} steps</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </StudioShell>
  );
}
