'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CenterShell } from '@/components/layout/center-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchDashboards } from '@/lib/api/client';
import { DASHBOARD_IDS } from '@/lib/types/analytics';

export default function DashboardsPage() {
  const { data: dashboards } = useQuery({ queryKey: ['dashboards'], queryFn: fetchDashboards });
  const list = dashboards ?? DASHBOARD_IDS.map((id) => ({ id, name: id.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') }));

  return (
    <CenterShell title="Dashboards">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <Link key={d.id} href={`/dashboards/${d.id}`}>
            <Card className="hover:bg-muted/30">
              <CardHeader><CardTitle className="text-sm">{d.name}</CardTitle></CardHeader>
              <CardContent className="text-xs text-muted-foreground">View KPIs, charts, and trends</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </CenterShell>
  );
}
