'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  Globe2,
  Loader2,
  Network,
  Shield,
  XCircle,
} from 'lucide-react';
import { fetchDependencies, fetchRoutes, fetchStatus } from '@/lib/api/client';
import { cn } from '@/lib/utils';

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active' || status === 'healthy' || status === 'ready';
  const planned = status === 'planned';
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        active && 'bg-emerald-500/20 text-emerald-400',
        planned && 'bg-amber-500/20 text-amber-400',
        !active && !planned && 'bg-red-500/20 text-red-400',
      )}
    >
      {status}
    </span>
  );
}

export default function AdminGatewayPage() {
  const { data: routes, isLoading: routesLoading } = useQuery({ queryKey: ['routes'], queryFn: fetchRoutes });
  const { data: status, isLoading: statusLoading } = useQuery({ queryKey: ['status'], queryFn: fetchStatus });
  const { data: dependencies, isLoading: depsLoading } = useQuery({
    queryKey: ['dependencies'],
    queryFn: fetchDependencies,
  });

  const loading = routesLoading || statusLoading || depsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
      <header className="border-b bg-card/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Lateen OS Admin Gateway</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading gateway data...
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe2 className="h-4 w-4" /> Routes
                </div>
                <div className="mt-2 text-2xl font-semibold">{status?.routes.total ?? 0}</div>
                <div className="text-xs text-muted-foreground">
                  {status?.routes.active} active · {status?.routes.planned} planned
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" /> Uptime
                </div>
                <div className="mt-2 text-2xl font-semibold">{status?.uptimeSeconds ?? 0}s</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" /> Requests
                </div>
                <div className="mt-2 text-2xl font-semibold">{status?.metrics.totalRequests ?? 0}</div>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm text-muted-foreground">Cache hit rate</div>
                <div className="mt-2 text-2xl font-semibold">
                  {status && status.metrics.cacheHits + status.metrics.cacheMisses > 0
                    ? Math.round(
                        (status.metrics.cacheHits / (status.metrics.cacheHits + status.metrics.cacheMisses)) * 100,
                      )
                    : 0}
                  %
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3 font-medium">Route Registry</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-4 py-2">Route</th>
                      <th className="px-4 py-2">Prefix</th>
                      <th className="px-4 py-2">Service</th>
                      <th className="px-4 py-2">Version</th>
                      <th className="px-4 py-2">Auth</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes?.map((route) => (
                      <tr key={route.id} className="border-b border-border/50">
                        <td className="px-4 py-2 font-medium">{route.displayName}</td>
                        <td className="px-4 py-2 font-mono text-xs">{route.gatewayPrefix}</td>
                        <td className="px-4 py-2">{route.serviceName}</td>
                        <td className="px-4 py-2">{route.version}</td>
                        <td className="px-4 py-2">{route.authRequired ? 'JWT' : 'Public'}</td>
                        <td className="px-4 py-2"><StatusBadge status={route.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3 font-medium">Dependency Health</div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {dependencies?.map((dep) => (
                  <div key={dep.service} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="flex items-center gap-2">
                      {dep.status === 'healthy' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : dep.status === 'planned' ? (
                        <Activity className="h-4 w-4 text-amber-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span>{dep.service}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {dep.latencyMs !== undefined && (
                        <span className="text-xs text-muted-foreground">{dep.latencyMs}ms</span>
                      )}
                      <StatusBadge status={dep.status} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
