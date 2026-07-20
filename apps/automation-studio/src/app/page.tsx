'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Play, Workflow, LayoutTemplate, BarChart3 } from 'lucide-react';
import { StudioShell } from '@/components/layout/studio-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalytics, fetchAutomations, fetchExecutions } from '@/lib/api/client';

export default function DashboardPage() {
  const { data: automations } = useQuery({ queryKey: ['automations'], queryFn: fetchAutomations });
  const { data: executions } = useQuery({ queryKey: ['executions'], queryFn: fetchExecutions });
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });

  const published = automations?.filter((a) => a.status === 'published').length ?? 0;
  const totalExecs = analytics?.reduce((s, a) => s + a.executionCount, 0) ?? 0;
  const avgSuccess = analytics?.length ? analytics.reduce((s, a) => s + a.successRate, 0) / analytics.length : 0;

  return (
    <StudioShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardDescription>Automations</CardDescription><CardTitle className="text-3xl">{automations?.length ?? 0}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Published</CardDescription><CardTitle className="text-3xl">{published}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Executions</CardDescription><CardTitle className="text-3xl">{totalExecs}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Success Rate</CardDescription><CardTitle className="text-3xl">{(avgSuccess * 100).toFixed(0)}%</CardTitle></CardHeader></Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Workflow className="h-4 w-4 text-primary" /> Recent Automations</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {automations?.map((a) => (
              <Link key={a.id} href={`/automations/${a.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50">
                <span>{a.name}</span>
                <Badge>{a.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild><Link href="/workflow-builder"><Workflow className="mr-2 h-4 w-4" /> Workflow Builder</Link></Button>
            <Button variant="outline" asChild><Link href="/executions"><Play className="mr-2 h-4 w-4" /> Executions</Link></Button>
            <Button variant="outline" asChild><Link href="/templates"><LayoutTemplate className="mr-2 h-4 w-4" /> Templates</Link></Button>
            <Button variant="outline" asChild><Link href="/analytics"><BarChart3 className="mr-2 h-4 w-4" /> Analytics</Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader><CardTitle>Recent Executions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {executions?.slice(0, 3).map((e) => (
            <Link key={e.id} href={`/executions/${e.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50">
              <span>{e.automationName}</span>
              <Badge className={e.status === 'completed' ? 'border-green-500/50 text-green-400' : e.status === 'failed' ? 'border-red-500/50 text-red-400' : ''}>{e.status}</Badge>
            </Link>
          ))}
        </CardContent>
      </Card>
    </StudioShell>
  );
}
