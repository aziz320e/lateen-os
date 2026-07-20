'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { HealthGrid } from '@/components/dashboard/health-grid';
import { HealthPieChart } from '@/components/charts/executive-charts';
import { fetchPlatformHealth } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { cn, statusColor } from '@/lib/utils';

export default function ObservabilityPage() {
  const { data, isLoading } = useQuery({ queryKey: ['platform-health'], queryFn: fetchPlatformHealth, refetchInterval: 30_000 });

  if (isLoading || !data) {
    return <div><Header title="Observability" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  const services = data.services.filter((s) => s.category === 'service');
  const infra = data.services.filter((s) => s.category === 'infrastructure');
  const dataStores = data.services.filter((s) => s.category === 'data');

  const pie = [
    { name: 'OK', value: data.services.filter((s) => s.status === 'ok').length },
    { name: 'Degraded', value: data.services.filter((s) => s.status === 'degraded').length },
    { name: 'Down', value: data.services.filter((s) => s.status === 'down').length },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <Header title="Observability" description="Platform health — services, Redis, PostgreSQL, NATS, Qdrant, Grafana, telemetry" />
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-4">
          <Badge className={cn(statusColor(data.status))}>{data.status.toUpperCase()}</Badge>
          <span className="text-sm text-muted-foreground">Last checked: {new Date(data.checkedAt).toLocaleString()}</span>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Health Distribution</h2>
            <HealthPieChart data={pie.length ? pie : [{ name: 'Unknown', value: 1 }]} />
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold text-emerald-400">{data.services.filter((s) => s.status === 'ok').length}</p><p className="text-sm text-muted-foreground">Healthy</p></div>
              <div><p className="text-2xl font-bold text-amber-400">{data.services.filter((s) => s.status === 'degraded').length}</p><p className="text-sm text-muted-foreground">Degraded</p></div>
              <div><p className="text-2xl font-bold text-red-400">{data.services.filter((s) => s.status === 'down').length}</p><p className="text-sm text-muted-foreground">Down</p></div>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Services</h2>
          <HealthGrid services={services} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Infrastructure & Telemetry</h2>
          <HealthGrid services={infra} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Data Stores</h2>
          <HealthGrid services={dataStores} />
        </div>
      </div>
    </div>
  );
}
