'use client';

import { useQuery } from '@tanstack/react-query';
import { FolderOpen, FileText, ShoppingCart, Receipt, Factory, Bell } from 'lucide-react';
import { PageHeader } from '@/components/layout/portal-shell';
import { StatCard } from '@/components/dashboard/stat-card';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { Badge } from '@/components/ui/badge';
import { fetchDashboard } from '@/lib/api/client';
import { formatDate, cn, statusColor } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="p-8 grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="p-8"><EmptyState title="Unable to load dashboard" description="Check your connection or sign in again." /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Your projects, orders, and account overview" />
      <div className="p-6 md:p-8 space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Open Projects" value={data.openProjects} icon={FolderOpen} />
          <StatCard title="Pending Quotations" value={data.pendingQuotations} icon={FileText} />
          <StatCard title="Running Orders" value={data.runningOrders} icon={ShoppingCart} />
          <StatCard title="Invoices Due" value={data.invoicesDue} icon={Receipt} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Factory className="h-4 w-4" /> Production</h2>
            <p className="text-sm text-muted-foreground">{data.productionStatus}</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</h2>
            <div className="space-y-2">
              {data.notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="text-sm border-b border-border/50 pb-2">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-muted-foreground text-xs">{n.message}</p>
                </div>
              ))}
              {data.notifications.length === 0 ? <p className="text-sm text-muted-foreground">No notifications</p> : null}
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Recent Activity</h2>
          {data.recentActivity.length === 0 ? (
            <EmptyState title="No recent activity" />
          ) : (
            <div className="rounded-lg border divide-y">
              {data.recentActivity.map((a) => (
                <div key={a.id} className="flex justify-between px-4 py-3 text-sm">
                  <span>{a.title}</span>
                  <span className="text-muted-foreground">{formatDate(a.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {data.upcomingDeliveries.length > 0 ? (
          <div>
            <h2 className="font-semibold mb-3">Upcoming Deliveries</h2>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50"><tr><th className="px-4 py-2 text-left">Order</th><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Status</th></tr></thead>
                <tbody>
                  {data.upcomingDeliveries.map((d) => (
                    <tr key={d.id} className="border-t">
                      <td className="px-4 py-2">{d.orderNumber}</td>
                      <td className="px-4 py-2">{d.estimatedDate}</td>
                      <td className="px-4 py-2"><Badge className={cn(statusColor(d.status))}>{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
