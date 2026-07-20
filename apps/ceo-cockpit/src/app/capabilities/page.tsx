'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboard } from '@/lib/api/client';
import { formatPercent } from '@/lib/utils';
import { Target } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function CapabilitiesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboard });

  if (isLoading || !data) {
    return <div><Header title="Capabilities" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  return (
    <div>
      <Header title="Capabilities" description="Manufacturing and operational capability matches from discovery" />
      <div className="p-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Machines" value={data.counts.machines} icon={Target} />
          <StatCard title="Recommendations" value={data.recommendations.length} icon={Target} />
          <StatCard title="Manufacturable" value={data.recommendations.filter((r) => r.capabilityMatch.manufacturable).length} icon={Target} />
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Opportunity</th>
                <th className="px-4 py-3 text-left">Match Score</th>
                <th className="px-4 py-3 text-left">Manufacturable</th>
                <th className="px-4 py-3 text-left">Capabilities</th>
              </tr>
            </thead>
            <tbody>
              {data.recommendations.map((rec) => (
                <tr key={rec.id} className="border-t">
                  <td className="px-4 py-3">{rec.recommendationCandidate.title}</td>
                  <td className="px-4 py-3">{formatPercent(rec.capabilityMatch.overallMatchScore)}</td>
                  <td className="px-4 py-3">{rec.capabilityMatch.manufacturable ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rec.capabilityMatch.matchedCapabilities.map((c) => c.label).join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
