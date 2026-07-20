'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchMissions } from '@/lib/api/client';
import { cn, formatDate, statusColor } from '@/lib/utils';
import { getMissionProgress } from '@lateen-os/launch-product-mission/client';

export default function MissionControlPage() {
  const { data, isLoading } = useQuery({ queryKey: ['missions'], queryFn: fetchMissions });

  if (isLoading || !data) {
    return <div><Header title="Mission Control" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  const running = data.missions.filter((m) => m.status === 'active' || m.status === 'escalated');
  const completed = data.missions.filter((m) => m.status === 'completed');
  const rejected = data.missions.filter((m) => m.status === 'failed');
  const escalations = data.missions.filter((m) => m.status === 'escalated');

  return (
    <div>
      <Header title="Mission Control" description="Running missions, escalations, consensus, and approvals" />
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-5 text-center">
          <div className="rounded-lg border p-4"><p className="text-2xl font-bold">{running.length}</p><p className="text-sm text-muted-foreground">Running</p></div>
          <div className="rounded-lg border p-4"><p className="text-2xl font-bold">{completed.length}</p><p className="text-sm text-muted-foreground">Completed</p></div>
          <div className="rounded-lg border p-4"><p className="text-2xl font-bold text-amber-400">{escalations.length}</p><p className="text-sm text-muted-foreground">Escalations</p></div>
          <div className="rounded-lg border p-4"><p className="text-2xl font-bold text-red-400">{rejected.length}</p><p className="text-sm text-muted-foreground">Rejected</p></div>
          <div className="rounded-lg border p-4"><p className="text-2xl font-bold">{data.summary.averageProgress}%</p><p className="text-sm text-muted-foreground">Avg Progress</p></div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Mission</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Progress</th>
                <th className="px-4 py-3 text-left">Consensus</th>
                <th className="px-4 py-3 text-left">Decision</th>
                <th className="px-4 py-3 text-left">Health</th>
                <th className="px-4 py-3 text-left">Started</th>
              </tr>
            </thead>
            <tbody>
              {data.missions.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3"><Badge className={cn(statusColor(m.status))}>{m.status}</Badge></td>
                  <td className="px-4 py-3"><Progress value={getMissionProgress(m)} className="w-24" /></td>
                  <td className="px-4 py-3">{m.consensusReached ? '✓' : '…'}</td>
                  <td className="px-4 py-3">{m.decisionApproved ? '✓' : '…'}</td>
                  <td className="px-4 py-3"><Badge className={cn(statusColor(m.health))}>{m.health}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(m.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.missions[0] ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Mission Timeline — {data.missions[0].title}</h2>
            <div className="space-y-2">
              {data.missions[0].stages.map((stage) => (
                <div key={stage.code} className="flex items-center justify-between rounded border px-4 py-2 text-sm">
                  <span>{stage.name}</span>
                  <Badge className={cn(statusColor(stage.status))}>{stage.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
