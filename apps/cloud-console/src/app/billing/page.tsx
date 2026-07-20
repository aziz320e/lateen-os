'use client';

import { useQuery } from '@tanstack/react-query';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchBilling } from '@/lib/api/client';

export default function BillingPage() {
  const { data: invoices } = useQuery({ queryKey: ['billing'], queryFn: fetchBilling });

  return (
    <ConsoleShell title="Billing">
      <p className="mb-4 text-sm text-muted-foreground">Subscriptions · Invoices · Payments (stub) · Licenses · Usage Billing</p>
      <div className="space-y-3">
        {invoices?.map((inv) => (
          <Card key={inv.id}>
            <CardContent className="flex items-center justify-between pt-4">
              <div>
                <div className="font-medium">${inv.amount} {inv.currency}</div>
                <div className="text-xs text-muted-foreground">{inv.periodStart} — {inv.periodEnd}</div>
              </div>
              <Badge className={inv.status === 'paid' ? 'border-green-500/50 text-green-400' : inv.status === 'open' ? 'border-yellow-500/50 text-yellow-400' : ''}>{inv.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </ConsoleShell>
  );
}
