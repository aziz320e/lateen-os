'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDiscoveryRuns } from '@/lib/api/client';
import { formatCurrency, formatPercent } from '@/lib/utils';

export default function ProfitPage() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['discovery-runs'],
    queryFn: fetchDiscoveryRuns,
  });

  const estimates = runs?.flatMap((run) =>
    (run.profitEstimation?.estimates ?? []).map((est) => ({
      ...est,
      runId: run.id,
      title: run.rank?.opportunities.find((o) => o.opportunityId === est.opportunityId)?.title,
    })),
  ) ?? [];

  return (
    <div>
      <Header title="Profit Estimates" description="ROI projections for manufacturable opportunities" />
      <div className="grid gap-4 p-8 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? <Skeleton className="h-44" /> : null}
        {estimates.map((est) => (
          <Card key={est.estimateId}>
            <CardHeader>
              <CardTitle className="text-base">{est.title ?? 'Opportunity'}</CardTitle>
              <Badge className="bg-primary/15 text-primary">{est.confidence} confidence</Badge>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <p>Unit cost: {formatCurrency(est.estimatedUnitCost, est.currency)}</p>
              <p>Unit price: {formatCurrency(est.estimatedUnitPrice, est.currency)}</p>
              <p>Margin: {formatPercent(est.estimatedMarginPercent)}</p>
              <p>Monthly volume: {est.estimatedMonthlyVolume}</p>
              <p className="font-semibold text-primary">
                Projected profit: {formatCurrency(est.projectedMonthlyProfit, est.currency)}/mo
              </p>
            </CardContent>
          </Card>
        ))}
        {!isLoading && !estimates.length ? (
          <p className="text-muted-foreground">No profit estimates yet.</p>
        ) : null}
      </div>
    </div>
  );
}
