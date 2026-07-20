'use client';

import { useQuery } from '@tanstack/react-query';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchOrganizations } from '@/lib/api/client';

export default function OrganizationsPage() {
  const { data: orgs } = useQuery({ queryKey: ['organizations'], queryFn: fetchOrganizations });

  return (
    <ConsoleShell title="Organizations">
      <div className="grid gap-3">
        {orgs?.map((o) => (
          <Card key={o.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{o.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{o.slug}{o.domain ? ` · ${o.domain}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <Badge>{o.region}</Badge>
                <Badge>{o.tenantCount} tenants</Badge>
              </div>
            </CardHeader>
          </Card>
        )) ?? <p className="text-muted-foreground">Start Cloud Control Plane on port 4012</p>}
      </div>
    </ConsoleShell>
  );
}
