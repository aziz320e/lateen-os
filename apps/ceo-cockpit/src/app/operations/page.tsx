'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchOrganization } from '@/lib/api/client';
import { cn, statusColor } from '@/lib/utils';
import { Cog, Factory } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function OperationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['organization'], queryFn: fetchOrganization });

  if (isLoading || !data) {
    return <div><Header title="Operations" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  return (
    <div>
      <Header title="Operations" description="Machine status, production capacity, and operational metrics" />
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Machines" value={data.counts.machines} icon={Factory} />
          <StatCard title="Departments" value={data.counts.departments} icon={Cog} />
          <StatCard title="Employees" value={data.counts.employees} icon={Cog} />
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Machine</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {data.machines.map((m, i) => (
                <tr key={String(m.id ?? i)} className="border-t">
                  <td className="px-4 py-3">{String(m.name ?? m.code ?? `Machine ${i + 1}`)}</td>
                  <td className="px-4 py-3">
                    <Badge className={cn(statusColor(String(m.status ?? 'running')))}>{String(m.status ?? 'running')}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{String(m.type ?? '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.machines.length === 0 ? <p className="p-8 text-center text-muted-foreground">No machines registered</p> : null}
        </div>
      </div>
    </div>
  );
}
