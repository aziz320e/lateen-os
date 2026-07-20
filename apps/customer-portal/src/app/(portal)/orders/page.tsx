'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/portal-shell';
import { Badge } from '@/components/ui/badge';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { fetchOrders } from '@/lib/api/client';
import { cn, formatCurrency, formatDate, statusColor } from '@/lib/utils';

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['orders'], queryFn: fetchOrders });

  return (
    <div>
      <PageHeader title="Orders" description="Order history and production progress" />
      <div className="p-6 md:p-8">
        {isLoading ? <Skeleton className="h-64" /> : !data?.orders.length ? (
          <EmptyState title="No orders" />
        ) : (
          <table className="w-full text-sm rounded-lg border overflow-hidden">
            <thead className="bg-muted/50"><tr><th className="px-4 py-3 text-left">Number</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Delivery</th><th className="px-4 py-3 text-left">Confirmed</th></tr></thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{o.number}</td>
                  <td className="px-4 py-3"><Badge className={cn(statusColor(o.status))}>{o.status}</Badge></td>
                  <td className="px-4 py-3">{formatCurrency(o.total, o.currency)}</td>
                  <td className="px-4 py-3">{o.deliveryDate ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(o.confirmedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
