'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { OrganizationGraph } from '@/components/organization/org-graph';
import { fetchOrganization } from '@/lib/api/client';
import { Building2, Layers, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function OrganizationPage() {
  const { data, isLoading } = useQuery({ queryKey: ['organization'], queryFn: fetchOrganization });

  if (isLoading || !data) {
    return <div><Header title="Organization" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  return (
    <div>
      <Header
        title="Organization"
        description={data.organization ? data.organization.name : 'Organization graph, departments, employees, capabilities, machines'}
      />
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Departments" value={data.counts.departments} icon={Layers} />
          <StatCard title="Employees" value={data.counts.employees} icon={Users} />
          <StatCard title="Branches" value={data.counts.branches} icon={Building2} />
        </div>
        <OrganizationGraph
          organizationName={data.organization?.name ?? 'Organization'}
          departments={data.departments}
          employees={data.employees}
        />
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold mb-4">Departments</h2>
            <div className="rounded-lg border divide-y">
              {data.departments.map((d, i) => (
                <div key={String(d.id ?? i)} className="px-4 py-3 text-sm">{String(d.name ?? `Department ${i + 1}`)}</div>
              ))}
              {data.departments.length === 0 ? <p className="p-4 text-muted-foreground">No departments</p> : null}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Machine Status</h2>
            <div className="rounded-lg border divide-y">
              {data.machines.map((m, i) => (
                <div key={String(m.id ?? i)} className="px-4 py-3 text-sm flex justify-between">
                  <span>{String(m.name ?? `Machine ${i + 1}`)}</span>
                  <span className="text-muted-foreground">{String(m.status ?? 'unknown')}</span>
                </div>
              ))}
              {data.machines.length === 0 ? <p className="p-4 text-muted-foreground">No machines</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
