'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard, fetchNotifications } from '@/lib/api/client';
import { cn, statusColor } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function RiskPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });
  const { data: notifData } = useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications });

  if (isLoading || !data) {
    return <div><Header title="Risk Center" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  const highRiskDecisions = data.decisions.filter((d) => d.risk === 'high');
  const riskAlerts = notifData?.notifications.filter((n) => n.type === 'risk' || n.severity === 'critical') ?? [];

  return (
    <div>
      <Header title="Risk Center" description="Open risks, escalations, and high-risk decisions" />
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Open Risks" value={data.risk.openRisks} icon={AlertTriangle} />
          <StatCard title="High-Risk Decisions" value={data.risk.highRiskDecisions} icon={AlertTriangle} />
          <StatCard title="Escalated Missions" value={data.risk.escalatedMissions} icon={AlertTriangle} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">High-Risk Decisions</h2>
          <div className="space-y-2">
            {highRiskDecisions.map((d) => (
              <div key={d.id} className="flex justify-between rounded border px-4 py-3 text-sm">
                <span>{d.title}</span>
                <Badge className={cn(statusColor(d.status))}>{d.status}</Badge>
              </div>
            ))}
            {highRiskDecisions.length === 0 ? <p className="text-muted-foreground">No high-risk decisions</p> : null}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Risk Alerts</h2>
          <div className="space-y-2">
            {riskAlerts.map((n) => (
              <div key={n.id} className="rounded border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
