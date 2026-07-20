'use client';

import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchWorkflows } from '@/lib/api/client';
import { cn, formatDate, statusColor } from '@/lib/utils';

export default function WorkflowsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['workflows'], queryFn: fetchWorkflows });

  if (isLoading || !data) {
    return <div><Header title="Workflow Monitor" /><div className="p-8"><Skeleton className="h-64" /></div></div>;
  }

  return (
    <div>
      <Header title="Workflow Monitor" description="Workflow Engine execution status across the enterprise" />
      <div className="p-8">
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left">Workflow</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Current Step</th>
                <th className="px-4 py-3 text-left">Progress</th>
                <th className="px-4 py-3 text-left">Started</th>
              </tr>
            </thead>
            <tbody>
              {data.workflows.map((wf) => (
                <tr key={wf.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{wf.name}</td>
                  <td className="px-4 py-3"><Badge className={cn(statusColor(wf.status))}>{wf.status}</Badge></td>
                  <td className="px-4 py-3">{wf.currentStep}</td>
                  <td className="px-4 py-3"><Progress value={wf.progress} className="w-24" /></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(wf.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.workflows.length === 0 ? <p className="p-8 text-center text-muted-foreground">No workflows in Business DNA</p> : null}
        </div>
      </div>
    </div>
  );
}
