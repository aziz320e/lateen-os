'use client';

import { useQuery } from '@tanstack/react-query';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchTenants } from '@/lib/api/client';

const STATUS_COLOR: Record<string, string> = {
  active: 'border-green-500/50 text-green-400',
  suspended: 'border-yellow-500/50 text-yellow-400',
  provisioning: 'border-blue-500/50 text-blue-400',
  archived: 'opacity-50',
};

export default function TenantsPage() {
  const { data: tenants } = useQuery({ queryKey: ['tenants'], queryFn: () => fetchTenants() });

  return (
    <ConsoleShell title="Tenants">
      <div className="grid gap-3">
        {tenants?.map((t) => (
          <Card key={t.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{t.organizationName} · {t.slug}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={STATUS_COLOR[t.status] ?? ''}>{t.status}</Badge>
                <Badge>{t.plan}</Badge>
                <Badge>{t.region}</Badge>
              </div>
            </CardHeader>
          </Card>
        )) ?? <p className="text-muted-foreground">No tenants loaded</p>}
      </div>
    </ConsoleShell>
  );
}
