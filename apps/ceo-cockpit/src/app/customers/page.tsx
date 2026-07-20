'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard } from '@/lib/api/client';
import { Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function CustomersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return <div><Header title="Customers" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  return (
    <div>
      <Header title="Customers" description="Customer base overview from Business DNA" />
      <div className="p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Customers" value={data.counts.customers} icon={Users} />
          <StatCard title="Projects" value={data.counts.projects} icon={Users} />
          <StatCard title="Branches" value={data.counts.branches} icon={Users} />
        </div>
        <p className="text-sm text-muted-foreground">
          Customer detail views are sourced from Business DNA Service — visualization only in CEO Cockpit.
        </p>
      </div>
    </div>
  );
}
