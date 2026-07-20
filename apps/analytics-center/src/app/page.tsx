'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, LayoutDashboard, FileText, Bell } from 'lucide-react';
import { CenterShell } from '@/components/layout/center-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDashboards, fetchAlerts } from '@/lib/api/client';
import { DASHBOARD_IDS } from '@/lib/types/analytics';

export default function OverviewPage() {
  const { data: dashboards } = useQuery({ queryKey: ['dashboards'], queryFn: fetchDashboards });
  const { data: alerts } = useQuery({ queryKey: ['alerts'], queryFn: fetchAlerts });

  const triggered = alerts?.filter((a) => a.status === 'triggered').length ?? 0;

  return (
    <CenterShell title="Overview">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Dashboards</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{DASHBOARD_IDS.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Domains</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">18</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Metrics</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">19</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Alerts</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{triggered}</div></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4 text-primary" /> Dashboards</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dashboards?.map((d) => (
              <Link key={d.id} href={`/dashboards/${d.id}`} className="block rounded-md border p-3 hover:bg-muted/50">{d.name}</Link>
            )) ?? DASHBOARD_IDS.map((id) => (
              <Link key={id} href={`/dashboards/${id}`} className="block rounded-md border p-3 hover:bg-muted/50">{id}</Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild><Link href="/dashboards/ceo"><BarChart3 className="mr-2 h-4 w-4" /> CEO Dashboard</Link></Button>
            <Button variant="outline" asChild><Link href="/reports"><FileText className="mr-2 h-4 w-4" /> Reports</Link></Button>
            <Button variant="outline" asChild><Link href="/alerts"><Bell className="mr-2 h-4 w-4" /> Alerts</Link></Button>
          </CardContent>
        </Card>
      </div>
    </CenterShell>
  );
}
