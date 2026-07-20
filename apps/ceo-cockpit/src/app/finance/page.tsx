'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { EntityBarChart } from '@/components/charts/executive-charts';
import { fetchDashboard } from '@/lib/api/client';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function FinancePage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return <div><Header title="Finance Overview" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  const profitChart = data.recommendations.slice(0, 6).map((r) => ({
    name: r.recommendationCandidate.title.slice(0, 12),
    value: parseFloat(r.profitEstimate.projectedMonthlyProfit || '0'),
  }));

  return (
    <div>
      <Header title="Finance Overview" description="Revenue projections, margins, and invoice status" />
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Projected Revenue" value={formatCurrency(data.finance.projectedRevenue)} icon={DollarSign} />
          <StatCard title="Avg Margin" value={`${data.finance.projectedMargin}%`} icon={TrendingUp} />
          <StatCard title="Open Invoices" value={data.finance.openInvoices} icon={Receipt} />
        </div>
        {profitChart.length > 0 ? (
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Discovery Profit Projections</h2>
            <EntityBarChart data={profitChart} />
          </div>
        ) : null}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Opportunity</th>
                <th className="px-4 py-3 text-left">Margin</th>
                <th className="px-4 py-3 text-left">Monthly Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.recommendations.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.recommendationCandidate.title}</td>
                  <td className="px-4 py-3">{formatPercent(r.profitEstimate.estimatedMarginPercent)}</td>
                  <td className="px-4 py-3">{formatCurrency(r.profitEstimate.projectedMonthlyProfit, r.profitEstimate.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
