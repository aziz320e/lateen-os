'use client';

import { useQuery } from '@tanstack/react-query';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchPlans } from '@/lib/api/client';

export default function PlansPage() {
  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: fetchPlans });

  return (
    <ConsoleShell title="Plans">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.name}</CardTitle>
              <p className="text-2xl font-bold">${p.priceUsd}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{p.maxUsers} users</p>
              <p>{p.maxStorageGb} GB storage</p>
              <p>{p.maxAiTokens.toLocaleString()} AI tokens</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ConsoleShell>
  );
}
