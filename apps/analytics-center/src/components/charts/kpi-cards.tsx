import type { KpiValue } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export function KpiCards({ kpis }: { kpis: readonly KpiValue[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{kpi.value}{kpi.unit && kpi.unit !== 'USD' && kpi.unit !== 'count' ? '' : kpi.unit === 'USD' ? '' : ''}</span>
              {kpi.change !== undefined && (
                <span className={`flex items-center text-xs ${kpi.trend === 'up' ? 'text-green-400' : kpi.trend === 'down' ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {kpi.trend === 'up' ? <TrendingUp className="mr-1 h-3 w-3" /> : kpi.trend === 'down' ? <TrendingDown className="mr-1 h-3 w-3" /> : <Minus className="mr-1 h-3 w-3" />}
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
