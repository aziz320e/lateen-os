'use client';

import { useQuery } from '@tanstack/react-query';
import { EntityBarChart } from '@/components/charts/executive-charts';
import { StatCard } from '@/components/dashboard/stat-card';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard } from '@/lib/api/client';
import { GitBranch, Layers, Shield, Workflow } from 'lucide-react';

export default function BusinessDnaPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return <div><Header title="Business DNA" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  const chart = [
    { name: 'Branches', value: data.counts.branches },
    { name: 'Departments', value: data.counts.departments },
    { name: 'Employees', value: data.counts.employees },
    { name: 'Policies', value: data.counts.policies },
    { name: 'Workflows', value: data.counts.workflows },
  ];

  return (
    <div>
      <Header title="Business DNA" description="Organization operating system snapshot — read-only view" />
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Branches" value={data.counts.branches} icon={GitBranch} />
          <StatCard title="Departments" value={data.counts.departments} icon={Layers} />
          <StatCard title="Policies" value={data.counts.policies} icon={Shield} />
          <StatCard title="Workflows" value={data.counts.workflows} icon={Workflow} />
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Entity Distribution</h2>
          <EntityBarChart data={chart} />
        </div>
        <p className="text-sm text-muted-foreground">
          Edit Business DNA in Business DNA Studio (port 3001). CEO Cockpit visualizes only.
        </p>
      </div>
    </div>
  );
}
