'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CenterShell } from '@/components/layout/center-shell';
import { KpiCards } from '@/components/charts/kpi-cards';
import { RechartsPanel } from '@/components/charts/recharts-panel';
import { EChartsPanel } from '@/components/charts/echarts-panel';
import { Button } from '@/components/ui/button';
import { fetchDashboard } from '@/lib/api/client';

export default function DashboardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: dashboard, isLoading, error } = useQuery({ queryKey: ['dashboard', id], queryFn: () => fetchDashboard(id) });

  return (
    <CenterShell title={dashboard?.name ?? 'Dashboard'}>
      <Button variant="ghost" size="sm" className="mb-4" asChild><Link href="/dashboards">← Back to Dashboards</Link></Button>
      {isLoading && <p className="text-muted-foreground">Loading dashboard...</p>}
      {error && <p className="text-red-400">Dashboard unavailable — start Analytics Platform on port 4011</p>}
      {dashboard && (
        <div className="space-y-6">
          <KpiCards kpis={dashboard.kpis} />
          <div className="grid gap-4 md:grid-cols-2">
            {dashboard.charts.map((chart, i) => (
              i % 2 === 0 ? <RechartsPanel key={chart.title} chart={chart} /> : <EChartsPanel key={chart.title} chart={chart} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Generated at {new Date(dashboard.generatedAt).toLocaleString()} · Domain: {dashboard.domain}</p>
        </div>
      )}
    </CenterShell>
  );
}
