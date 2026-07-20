'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Rocket, LifeBuoy } from 'lucide-react';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchOverview } from '@/lib/api/client';

export default function OverviewPage() {
  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: fetchOverview });

  return (
    <ConsoleShell title="Overview">
      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader className="pb-2"><CardDescription>Organizations</CardDescription><CardTitle className="text-3xl">{overview?.organizations ?? '—'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Tenants</CardDescription><CardTitle className="text-3xl">{overview?.tenants ?? '—'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Active</CardDescription><CardTitle className="text-3xl">{overview?.activeTenants ?? '—'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Deployments</CardDescription><CardTitle className="text-3xl">{overview?.deployments ?? '—'}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Open Tickets</CardDescription><CardTitle className="text-3xl">{overview?.openTickets ?? '—'}</CardTitle></CardHeader></Card>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link href="/organizations" className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/50"><Building2 className="h-4 w-4 text-primary" /> Organizations</Link>
            <Link href="/tenants" className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/50"><Users className="h-4 w-4 text-primary" /> Tenants</Link>
            <Link href="/deployments" className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/50"><Rocket className="h-4 w-4 text-primary" /> Deployments</Link>
            <Link href="/support" className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted/50"><LifeBuoy className="h-4 w-4 text-primary" /> Support</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tenant Lifecycle</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Provision → Activate → Suspend → Resume → Upgrade → Downgrade → Archive → Delete
          </CardContent>
        </Card>
      </div>
    </ConsoleShell>
  );
}
