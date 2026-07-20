'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/portal-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { fetchInvoices } from '@/lib/api/client';
import { cn, formatCurrency, formatDate, statusColor } from '@/lib/utils';

export default function InvoicesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices });

  return (
    <div>
      <PageHeader title="Invoices" description="Payment status and invoice downloads" />
      <div className="p-6 md:p-8">
        {isLoading ? <Skeleton className="h-64" /> : !data?.invoices.length ? (
          <EmptyState title="No invoices" />
        ) : (
          <table className="w-full text-sm rounded-lg border overflow-hidden">
            <thead className="bg-muted/50"><tr><th className="px-4 py-3 text-left">Number</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Due</th><th className="px-4 py-3 text-left">Amount due</th><th className="px-4 py-3 text-left"></th></tr></thead>
            <tbody>
              {data.invoices.map((i) => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{i.number}</td>
                  <td className="px-4 py-3"><Badge className={cn(statusColor(i.status))}>{i.status}</Badge></td>
                  <td className="px-4 py-3">{formatCurrency(i.total, i.currency)}</td>
                  <td className="px-4 py-3">{i.dueDate ?? '—'}</td>
                  <td className="px-4 py-3">{formatCurrency(i.amountDue, i.currency)}</td>
                  <td className="px-4 py-3"><Button size="sm" variant="ghost">Download</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data?.invoices.some((i) => i.paidAt) ? (
          <div className="mt-8">
            <h2 className="font-semibold mb-3">Payment History</h2>
            <div className="text-sm space-y-2">
              {data.invoices.filter((i) => i.paidAt).map((i) => (
                <div key={i.id} className="flex justify-between border-b pb-2">
                  <span>{i.number}</span>
                  <span>{formatCurrency(i.amountPaid, i.currency)} · {formatDate(i.paidAt)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
