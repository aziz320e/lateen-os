'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Bot,
  Building2,
  DollarSign,
  Rocket,
  Shield,
  Target,
} from 'lucide-react';
import { EntityBarChart, HealthPieChart } from '@/components/charts/executive-charts';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { HealthGrid } from '@/components/dashboard/health-grid';
import { StatCard } from '@/components/dashboard/stat-card';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard } from '@/lib/api/client';
import { cn, formatCurrency, statusColor } from '@/lib/utils';
import { getMissionProgress } from '@lateen-os/launch-product-mission/client';

export default function ExecutiveDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return (
      <div>
        <Header title="Executive Dashboard" description="Enterprise-wide command overview" />
        <div className="p-8 space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const entityChartData = [
    { name: 'Products', value: data.counts.products },
    { name: 'Customers', value: data.counts.customers },
    { name: 'Agents', value: data.counts.agents },
    { name: 'Machines', value: data.counts.machines },
    { name: 'Projects', value: data.counts.projects },
  ];

  const healthPie = [
    { name: 'OK', value: data.health.services.filter((s) => s.status === 'ok').length },
    { name: 'Degraded', value: data.health.services.filter((s) => s.status === 'degraded').length },
    { name: 'Down', value: data.health.services.filter((s) => s.status === 'down').length },
  ].filter((d) => d.value > 0);

  const widgets = [
    {
      id: 'health',
      title: 'Platform Health',
      defaultLayout: { x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
      content: (
        <div className="space-y-2">
          <Badge className={cn(statusColor(data.health.status))}>{data.health.status}</Badge>
          <p className="text-xs text-muted-foreground">{data.health.services.length} components monitored</p>
          <HealthPieChart data={healthPie.length ? healthPie : [{ name: 'Unknown', value: 1 }]} />
        </div>
      ),
    },
    {
      id: 'missions',
      title: 'Mission Control',
      defaultLayout: { x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
      content: (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Active</span><p className="text-xl font-bold">{data.missionSummary.activeMissions}</p></div>
          <div><span className="text-muted-foreground">Completed</span><p className="text-xl font-bold">{data.missionSummary.completedMissions}</p></div>
          <div><span className="text-muted-foreground">Escalated</span><p className="text-xl font-bold text-amber-400">{data.missionSummary.escalatedMissions}</p></div>
          <div><span className="text-muted-foreground">Avg Progress</span><Progress value={data.missionSummary.averageProgress} className="mt-2" /></div>
        </div>
      ),
    },
    {
      id: 'decisions',
      title: 'Decision Center',
      defaultLayout: { x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
      content: (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {data.decisions.slice(0, 5).map((d) => (
            <div key={d.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
              <span className="truncate mr-2">{d.title}</span>
              <Badge className={cn(statusColor(d.status))}>{d.status}</Badge>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'entities',
      title: 'Enterprise Entities',
      defaultLayout: { x: 0, y: 3, w: 6, h: 4, minW: 4, minH: 3 },
      content: <EntityBarChart data={entityChartData} />,
    },
    {
      id: 'workforce',
      title: 'AI Workforce',
      defaultLayout: { x: 6, y: 3, w: 6, h: 4, minW: 4, minH: 3 },
      content: (
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {data.workers.slice(0, 6).map((w) => (
            <div key={w.id} className="flex justify-between text-sm">
              <div><p className="font-medium">{w.name}</p><p className="text-xs text-muted-foreground">{w.role}</p></div>
              <Badge className={cn(statusColor(w.status))}>{w.status}</Badge>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'risk',
      title: 'Risk Summary',
      defaultLayout: { x: 0, y: 7, w: 4, h: 2, minW: 3, minH: 2 },
      content: (
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div><p className="text-2xl font-bold text-red-400">{data.risk.openRisks}</p><p className="text-muted-foreground">Open</p></div>
          <div><p className="text-2xl font-bold">{data.risk.highRiskDecisions}</p><p className="text-muted-foreground">High Risk</p></div>
          <div><p className="text-2xl font-bold text-amber-400">{data.risk.escalatedMissions}</p><p className="text-muted-foreground">Escalated</p></div>
        </div>
      ),
    },
    {
      id: 'finance',
      title: 'Finance Snapshot',
      defaultLayout: { x: 4, y: 7, w: 4, h: 2, minW: 3, minH: 2 },
      content: (
        <div className="space-y-2 text-sm">
          <p>Projected revenue: <span className="font-bold">{formatCurrency(data.finance.projectedRevenue)}</span></p>
          <p>Avg margin: <span className="font-bold">{data.finance.projectedMargin}%</span></p>
          <p>Open invoices: <span className="font-bold">{data.finance.openInvoices}</span></p>
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Alerts',
      defaultLayout: { x: 8, y: 7, w: 4, h: 2, minW: 3, minH: 2 },
      content: (
        <div className="space-y-2 max-h-36 overflow-y-auto text-sm">
          {data.notifications.slice(0, 4).map((n) => (
            <div key={n.id} className="border-b border-border/50 pb-1">
              <p className="font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.message}</p>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header
        title="Executive Dashboard"
        description={data.organization ? `${data.organization.name} — enterprise command overview` : 'Enterprise command overview'}
      />
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Company Health" value={data.health.status.toUpperCase()} icon={Activity} hint="Platform-wide status" />
          <StatCard title="Active Missions" value={data.missionSummary.activeMissions} icon={Rocket} hint={`${data.missionSummary.completedMissions} completed`} />
          <StatCard title="Pending Decisions" value={data.decisions.filter((d) => d.status === 'pending' || d.status === 'waiting').length} icon={Shield} />
          <StatCard title="AI Workers" value={data.workers.length} icon={Bot} hint={`${data.workers.filter((w) => w.status === 'available').length} available`} />
        </div>

        <DashboardGrid widgets={widgets} />

        {data.missionSummary.latestMission ? (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium mb-2">Latest Mission Timeline</p>
            <div className="flex gap-2 flex-wrap">
              {data.missionSummary.latestMission.stages.map((stage) => (
                <Badge key={stage.code} className={cn(statusColor(stage.status))}>{stage.name}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Progress: {getMissionProgress(data.missionSummary.latestMission)}%
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
