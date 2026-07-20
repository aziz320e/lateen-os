'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { StudioShell } from '@/components/layout/studio-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAutomations } from '@/lib/api/client';

export default function AutomationsPage() {
  const { data: automations, isLoading } = useQuery({ queryKey: ['automations'], queryFn: fetchAutomations });

  return (
    <StudioShell title="Automations">
      <div className="mb-4 flex justify-between">
        <p className="text-sm text-muted-foreground">Design automations — execution via Workflow Engine and Mission Scheduler</p>
        <Button disabled>New Automation (stub)</Button>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="grid gap-3">
          {automations?.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{a.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{a.triggerType}</Badge>
                  <Badge>{a.status}</Badge>
                  <Badge>v{a.version}</Badge>
                  <Button size="sm" asChild><Link href={`/automations/${a.id}`}>Edit</Link></Button>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{a.nodes.length} nodes · {a.edges.length} edges</CardContent>
            </Card>
          ))}
        </div>
      )}
    </StudioShell>
  );
}
