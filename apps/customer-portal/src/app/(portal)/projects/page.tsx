'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/portal-shell';
import { Badge } from '@/components/ui/badge';
import { Skeleton, EmptyState } from '@/components/ui/state';
import { fetchProjects } from '@/lib/api/client';
import { cn, formatDate, statusColor } from '@/lib/utils';

export default function ProjectsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects });

  return (
    <div>
      <PageHeader title="Projects" description="Your project list and progress" />
      <div className="p-6 md:p-8">
        {isLoading ? <Skeleton className="h-64" /> : !data?.projects.length ? (
          <EmptyState title="No projects" description="Projects linked to your account will appear here." />
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Progress</th>
                  <th className="px-4 py-3 text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3"><Link href={`/projects/${p.id}`} className="text-primary hover:underline">{p.code}</Link></td>
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3"><Badge className={cn(statusColor(p.status))}>{p.status}</Badge></td>
                    <td className="px-4 py-3">{p.rolloutProgressPct ? `${p.rolloutProgressPct}%` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
