'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchStudioDashboard } from '@/lib/api/client';
import { displayName } from '@/lib/utils';

export default function CapabilitiesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['studio-dashboard'],
    queryFn: fetchStudioDashboard,
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Capabilities" />
        <Skeleton className="m-8 h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Capabilities" />
        <p className="p-8 text-destructive">{(error as Error)?.message}</p>
      </div>
    );
  }

  const capabilities = [
    ...data.products.map((p) => ({
      id: `product-${p.id}`,
      name: displayName(p),
      source: 'product',
      type: 'manufacturing',
    })),
    ...data.machines.map((m) => ({
      id: `machine-${m.id}`,
      name: displayName(m),
      source: 'machine',
      type: 'equipment',
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Capabilities"
        description="Derived capability coverage from products and machines — assign via Capability Graph editor"
      />

      <div className="p-8">
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Capability</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              {capabilities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No capabilities derived — add products or machines first.
                  </td>
                </tr>
              ) : (
                capabilities.map((cap) => (
                  <tr key={cap.id} className="border-t">
                    <td className="px-4 py-3">{cap.name}</td>
                    <td className="px-4 py-3">
                      <Badge className="capitalize">{cap.source}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{cap.type}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
