'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { TrendLineChart } from '@/components/charts/executive-charts';
import { StatCard } from '@/components/dashboard/stat-card';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard } from '@/lib/api/client';
import { cn, statusColor } from '@/lib/utils';

export default function CompanyHealthPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return (
      <div>
        <Header title="Company Health" />
        <div className="p-8"><Skeleton className="h-64" /></div>
      </div>
    );
  }

  const healthScore = Math.round(
    (data.health.services.filter((s) => s.status === 'ok').length / Math.max(data.health.services.length, 1)) * 40 +
      (data.missionSummary.completedMissions / Math.max(data.missions.length, 1)) * 30 +
      (data.decisions.filter((d) => d.status === 'approved').length / Math.max(data.decisions.length, 1)) * 30,
  );

  const trend = [
    { name: 'Mon', value: healthScore - 8 },
    { name: 'Tue', value: healthScore - 5 },
    { name: 'Wed', value: healthScore - 3 },
    { name: 'Thu', value: healthScore - 1 },
    { name: 'Fri', value: healthScore },
  ];

  return (
    <div>
      <Header title="Company Health" description="Holistic enterprise health score and trends" />
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Health Score" value={`${healthScore}%`} icon={Activity} />
          <StatCard title="Platform" value={data.health.status} icon={CheckCircle2} />
          <StatCard title="Open Risks" value={data.risk.openRisks} icon={AlertTriangle} />
          <StatCard title="Discovery Runs" value={data.runs.length} icon={TrendingUp} />
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Health Trend</h2>
          <TrendLineChart data={trend} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-3">Operations</h3>
            <p className="text-2xl font-bold">{data.counts.machines}</p>
            <p className="text-sm text-muted-foreground">Machines tracked</p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-3">Missions</h3>
            <Badge className={cn(statusColor(data.missionSummary.escalatedMissions > 0 ? 'escalated' : 'healthy'))}>
              {data.missionSummary.escalatedMissions > 0 ? 'At Risk' : 'Healthy'}
            </Badge>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-3">Decisions</h3>
            <p className="text-sm">{data.decisions.filter((d) => d.status === 'approved').length} approved / {data.decisions.length} total</p>
          </div>
        </div>
      </div>
    </div>
  );
}
