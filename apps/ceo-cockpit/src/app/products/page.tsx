'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard } from '@/lib/api/client';
import { Package } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function ProductsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return <div><Header title="Products" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  const approvedProducts = data.missions
    .filter((m) => m.outputs.approvedProduct)
    .map((m) => m.outputs.approvedProduct!);

  return (
    <div>
      <Header title="Products" description="Product catalog and approved launch pipeline" />
      <div className="p-8 space-y-6">
        <StatCard title="Catalog Products" value={data.counts.products} icon={Package} className="max-w-xs" />
        {approvedProducts.length > 0 ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Approved from Missions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {approvedProducts.map((p) => (
                <div key={p.code} className="rounded-lg border p-4">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.code}</p>
                  <p className="text-xs mt-2">{p.manufacturable ? 'Manufacturable' : 'Not manufacturable'}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Full product catalog available via Business DNA Service. {data.counts.products} products registered.
        </p>
      </div>
    </div>
  );
}
