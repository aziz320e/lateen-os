'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Bot, Rocket, Store, TestTube } from 'lucide-react';
import { StudioShell } from '@/components/layout/studio-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchAnalytics, fetchDeployments, fetchWorkers } from '@/lib/api/client';

export default function DashboardPage() {
  const { data: workers } = useQuery({ queryKey: ['workers'], queryFn: fetchWorkers });
  const { data: deployments } = useQuery({ queryKey: ['deployments'], queryFn: fetchDeployments });
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });

  const published = deployments?.filter((d) => d.status === 'published').length ?? 0;
  const totalUsage = analytics?.reduce((sum, a) => sum + a.usage, 0) ?? 0;

  return (
    <StudioShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Workers</CardDescription><CardTitle className="text-3xl">{workers?.length ?? 0}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Published</CardDescription><CardTitle className="text-3xl">{published}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total Usage</CardDescription><CardTitle className="text-3xl">{totalUsage}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Success Rate</CardDescription><CardTitle className="text-3xl">{analytics?.[0] ? `${(analytics[0].successRate * 100).toFixed(0)}%` : '—'}</CardTitle></CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Recent Workers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workers?.map((w) => (
              <Link key={w.id} href={`/workers/${w.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50">
                <span>{w.name}</span>
                <Badge>{w.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild><Link href="/workers"><Bot className="mr-2 h-4 w-4" /> Workers</Link></Button>
            <Button variant="outline" asChild><Link href="/testing"><TestTube className="mr-2 h-4 w-4" /> Sandbox</Link></Button>
            <Button variant="outline" asChild><Link href="/deployments"><Rocket className="mr-2 h-4 w-4" /> Deploy</Link></Button>
            <Button variant="outline" asChild><Link href="/marketplace"><Store className="mr-2 h-4 w-4" /> Marketplace</Link></Button>
          </CardContent>
        </Card>
      </div>
    </StudioShell>
  );
}
