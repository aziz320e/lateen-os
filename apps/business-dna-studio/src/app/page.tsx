'use client';

import { useQuery } from '@tanstack/react-query';
import { Bot, Building2, Cpu, FolderKanban, GitBranch, Package, Users } from 'lucide-react';
import {
  AiWorkforceChart,
  CapabilityCoverageChart,
  DepartmentSizeChart,
  MachineUtilizationChart,
  OrgHealthChart,
} from '@/components/charts/studio-charts';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStudioDashboard } from '@/lib/api/client';
import { displayName } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['studio-dashboard'],
    queryFn: fetchStudioDashboard,
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Business DNA Studio overview" />
        <div className="grid gap-4 p-8 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <p className="p-8 text-destructive">{(error as Error)?.message ?? 'Failed to load dashboard'}</p>
      </div>
    );
  }

  const { counts, organization } = data;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Build and maintain the Business Operating System — organization structure, capabilities, workflows, and AI workforce"
      />

      <div className="space-y-8 p-8">
        {organization ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {displayName(organization)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Organization ID: {String(organization.id ?? '—')}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Branches" value={counts.branches ?? 0} hint="Physical locations" icon={GitBranch} />
          <StatCard title="Departments" value={counts.departments ?? 0} hint="Organizational units" icon={Users} />
          <StatCard title="Products" value={counts.products ?? 0} hint="Catalog items" icon={Package} />
          <StatCard title="Machines" value={counts.machines ?? 0} hint="Production equipment" icon={Cpu} />
          <StatCard title="Projects" value={counts.projects ?? 0} hint="Active initiatives" icon={FolderKanban} />
          <StatCard title="AI Agents" value={counts.agents ?? 0} hint="Registered workforce" icon={Bot} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <OrgHealthChart dashboard={data} />
          <CapabilityCoverageChart dashboard={data} />
          <MachineUtilizationChart dashboard={data} />
          <DepartmentSizeChart dashboard={data} />
          <AiWorkforceChart dashboard={data} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Integrations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Business DNA Service', status: 'connected' },
              { name: 'Workflow Engine', status: 'contracts' },
              { name: 'AI Workforce', status: 'contracts' },
              { name: 'Decision Engine', status: 'policy-linked' },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span className="text-muted-foreground">{item.name}</span>
                <Badge className="capitalize">{item.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
