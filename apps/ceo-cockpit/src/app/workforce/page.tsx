'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWorkforce } from '@/lib/api/client';
import { cn, statusColor } from '@/lib/utils';
import { Bot, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function WorkforcePage() {
  const { data, isLoading } = useQuery({ queryKey: ['workforce'], queryFn: fetchWorkforce });

  if (isLoading || !data) {
    return <div><Header title="AI Workforce" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  const available = data.workers.filter((w) => w.status === 'available').length;
  const busy = data.workers.filter((w) => w.status === 'busy').length;
  const avgProductivity = Math.round(data.workers.reduce((s, w) => s + w.productivity, 0) / Math.max(data.workers.length, 1));

  return (
    <div>
      <Header title="AI Workforce" description="All AI workers — status, tasks, productivity, and team structure" />
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Workers" value={data.workers.length} icon={Bot} />
          <StatCard title="Available" value={available} icon={Users} />
          <StatCard title="Busy" value={busy} icon={Bot} />
          <StatCard title="Avg Productivity" value={`${avgProductivity}%`} icon={Bot} />
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Worker</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Current Task</th>
                <th className="px-4 py-3 text-left">Productivity</th>
                <th className="px-4 py-3 text-left">Performance</th>
                <th className="px-4 py-3 text-left">Team</th>
              </tr>
            </thead>
            <tbody>
              {data.workers.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{w.name}</td>
                  <td className="px-4 py-3">{w.role}</td>
                  <td className="px-4 py-3"><Badge className={cn(statusColor(w.status))}>{w.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{w.currentTask ?? '—'}</td>
                  <td className="px-4 py-3"><Progress value={w.productivity} className="w-20" /></td>
                  <td className="px-4 py-3">{w.performance}%</td>
                  <td className="px-4 py-3">{w.team ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
